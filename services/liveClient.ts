import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { ConnectionState, TranscriptionItem } from "../types";
import { SYSTEM_INSTRUCTION, VOICE_NAME } from "../constants";
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from "../utils/audioUtils";

// Audio configuration
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const BUFFER_SIZE = 4096;

export class LiveClient {
  private ai: GoogleGenAI;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private sessionPromise: Promise<any> | null = null;
  
  // Audio Contexts
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private outputNode: GainNode | null = null;
  
  // State Callbacks
  private onStateChange: (state: ConnectionState) => void;
  private onTranscription: (item: TranscriptionItem) => void;
  private onAudioLevel: (level: number, source: 'user' | 'ai') => void;

  // Transcription State
  private currentInputTranscription = '';
  private currentOutputTranscription = '';

  // Playback State
  private nextStartTime = 0;
  private activeSources = new Set<AudioBufferSourceNode>();

  constructor(
    apiKey: string, 
    callbacks: {
      onStateChange: (state: ConnectionState) => void;
      onTranscription: (item: TranscriptionItem) => void;
      onAudioLevel: (level: number, source: 'user' | 'ai') => void;
    }
  ) {
    this.ai = new GoogleGenAI({ apiKey });
    this.onStateChange = callbacks.onStateChange;
    this.onTranscription = callbacks.onTranscription;
    this.onAudioLevel = callbacks.onAudioLevel;
  }

  public async connect() {
    try {
      this.updateState(ConnectionState.CONNECTING);

      // Initialize Audio Contexts
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: INPUT_SAMPLE_RATE,
      });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: OUTPUT_SAMPLE_RATE,
      });
      this.outputNode = this.outputAudioContext.createGain();
      this.outputNode.connect(this.outputAudioContext.destination);

      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_NAME } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: this.handleOpen.bind(this, stream),
          onmessage: this.handleMessage.bind(this),
          onerror: this.handleError.bind(this),
          onclose: this.handleClose.bind(this),
        },
      });

    } catch (error) {
      console.error("Connection failed:", error);
      this.updateState(ConnectionState.ERROR);
    }
  }

  public async disconnect() {
    if (this.sessionPromise) {
      // There isn't a direct "close" method on the promise, 
      // but usually the session object returned has one.
      // However, the SDK structure in the prompt implies we might not hold the session object directly 
      // outside the callbacks easily without caching it.
      // For this implementation, we rely on closing the audio contexts and stopping tracks
      // which effectively ends the client side. The server will timeout or close.
      // Ideally, if we stored the 'session' from the promise resolution, we would call session.close().
      const session = await this.sessionPromise;
      // Note: The prompt doesn't explicitly show session.close(), but standard WebSocket practice implies it.
      // If the SDK doesn't expose it on the session object, we just clean up locally.
      // Assuming session object has a close or we just close contexts.
      // Re-reading prompt: "When the conversation is finished, use `session.close()`"
      if (session && typeof session.close === 'function') {
        session.close();
      }
    }

    this.stopAudio();
    this.updateState(ConnectionState.DISCONNECTED);
  }

  private updateState(state: ConnectionState) {
    this.connectionState = state;
    this.onStateChange(state);
  }

  private handleOpen(stream: MediaStream) {
    this.updateState(ConnectionState.CONNECTED);
    this.startAudioInput(stream);
  }

  private startAudioInput(stream: MediaStream) {
    if (!this.inputAudioContext) return;

    this.inputSource = this.inputAudioContext.createMediaStreamSource(stream);
    this.processor = this.inputAudioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Calculate volume for visualizer
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
      const rms = Math.sqrt(sum / inputData.length);
      this.onAudioLevel(rms, 'user');

      const pcmBlob = createPcmBlob(inputData);
      
      if (this.sessionPromise) {
        this.sessionPromise.then((session) => {
          session.sendRealtimeInput({ media: pcmBlob });
        });
      }
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
    // 1. Handle Transcription
    this.handleTranscription(message);

    // 2. Handle Audio Output
    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio && this.outputAudioContext && this.outputNode) {
        const audioBuffer = await decodeAudioData(
            base64ToUint8Array(base64Audio),
            this.outputAudioContext,
            OUTPUT_SAMPLE_RATE,
            1
        );

        // Analyze audio for visualizer (AI)
        // Since we are scheduling this in the future, realtime visualization is tricky.
        // We'll just trigger a visualizer 'pulse' proportional to buffer length for simplicity
        // or use an AnalyserNode on the output if we wanted perfect sync. 
        // For now, we simulate activity when scheduling.
        this.onAudioLevel(0.5, 'ai'); // Pulse visualizer
        setTimeout(() => this.onAudioLevel(0, 'ai'), audioBuffer.duration * 1000);

        this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
        
        const source = this.outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.outputNode);
        
        source.addEventListener('ended', () => {
            this.activeSources.delete(source);
        });

        source.start(this.nextStartTime);
        this.nextStartTime += audioBuffer.duration;
        this.activeSources.add(source);
    }

    // 3. Handle Interruption
    if (message.serverContent?.interrupted) {
        this.activeSources.forEach(source => source.stop());
        this.activeSources.clear();
        this.nextStartTime = 0;
        this.currentOutputTranscription = ''; // Reset partial
    }
  }

  private handleTranscription(message: LiveServerMessage) {
    if (message.serverContent?.outputTranscription) {
        const text = message.serverContent.outputTranscription.text;
        this.currentOutputTranscription += text;
        this.onTranscription({
            speaker: 'ai',
            text: this.currentOutputTranscription,
            isComplete: false,
            timestamp: Date.now()
        });
    } else if (message.serverContent?.inputTranscription) {
        const text = message.serverContent.inputTranscription.text;
        this.currentInputTranscription += text;
        this.onTranscription({
            speaker: 'user',
            text: this.currentInputTranscription,
            isComplete: false,
            timestamp: Date.now()
        });
    }

    if (message.serverContent?.turnComplete) {
        // Finalize turns
        if (this.currentInputTranscription.trim()) {
             this.onTranscription({
                speaker: 'user',
                text: this.currentInputTranscription,
                isComplete: true,
                timestamp: Date.now()
            });
            this.currentInputTranscription = '';
        }
        if (this.currentOutputTranscription.trim()) {
            this.onTranscription({
                speaker: 'ai',
                text: this.currentOutputTranscription,
                isComplete: true,
                timestamp: Date.now()
            });
            this.currentOutputTranscription = '';
        }
    }
  }

  private handleError(e: ErrorEvent) {
    console.error("Session Error", e);
    this.updateState(ConnectionState.ERROR);
  }

  private handleClose(e: CloseEvent) {
    console.log("Session Closed", e);
    this.updateState(ConnectionState.DISCONNECTED);
    this.stopAudio();
  }

  private stopAudio() {
    if (this.processor) {
        this.processor.disconnect();
        this.processor = null;
    }
    if (this.inputSource) {
        this.inputSource.disconnect();
        this.inputSource = null;
    }
    if (this.inputAudioContext) {
        this.inputAudioContext.close();
        this.inputAudioContext = null;
    }
    if (this.outputAudioContext) {
        this.outputAudioContext.close();
        this.outputAudioContext = null;
    }
    this.activeSources.forEach(s => s.stop());
    this.activeSources.clear();
  }
}

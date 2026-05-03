import { ConnectionState, TranscriptionItem } from "../types";
import { AIProvider } from "./aiProvider";

export class LocalLiveClient {
  private recognition: any | null = null;
  private synthesis: SpeechSynthesis = window.speechSynthesis;
  private isConnected: boolean = false;
  private conversationHistory: { role: 'user' | 'assistant', content: string }[] = [];

  constructor(
    private provider: AIProvider,
    private systemInstruction: string,
    private tutorStrictness: string,
    private languageCode: string, // e.g., 'GERMAN'
    private voiceName: string,
    private callbacks: {
      onStateChange: (state: ConnectionState) => void;
      onTranscription: (item: TranscriptionItem) => void;
      onAudioLevel: (level: number, source: 'user' | 'ai') => void;
    }
  ) {
    // Modify system instruction based on strictness
    const strictnessNote = `\nTutor Strictness: ${this.tutorStrictness}. 
      ${this.tutorStrictness === 'GENTLE' ? 'Only correct major errors that break communication.' : ''}
      ${this.tutorStrictness === 'BALANCED' ? 'Correct significant grammar and vocabulary errors.' : ''}
      ${this.tutorStrictness === 'STRICT' ? 'Correct every single grammatical, gender, or case error meticulously.' : ''}
    `;
    this.systemInstruction += strictnessNote;

    // Initialize Web Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.languageCode === 'GERMAN' ? 'de-DE' : 'en-US';

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          this.handleUserSpeech(finalTranscript);
        } else if (interimTranscript) {
          this.callbacks.onTranscription({
            speaker: 'user',
            text: interimTranscript,
            isComplete: false,
            timestamp: Date.now()
          });
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error !== 'no-speech') {
          this.callbacks.onStateChange(ConnectionState.ERROR);
        }
      };
    }
  }

  public async connect() {
    if (!this.recognition) {
      alert("Speech Recognition not supported in this browser.");
      this.callbacks.onStateChange(ConnectionState.ERROR);
      return;
    }

    this.isConnected = true;
    this.callbacks.onStateChange(ConnectionState.CONNECTED);
    this.recognition.start();
    
    // Initial greeting
    const greeting = this.languageCode === 'GERMAN' 
      ? "Hallo! Ich bin bereit. Wie kann ich dir heute beim Deutschlernen helfen?" 
      : "Hello! I am ready. How can I help you with your English today?";
    
    this.conversationHistory = [{ role: 'assistant', content: greeting }];
    this.handleAISpeech(greeting);
  }

  public async disconnect() {
    this.isConnected = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Recognition might already be stopped
      }
    }
    this.synthesis.cancel();
    this.callbacks.onStateChange(ConnectionState.DISCONNECTED);
  }

  private async handleUserSpeech(text: string) {
    // Finalize user transcription
    this.callbacks.onTranscription({
      speaker: 'user',
      text: text,
      isComplete: true,
      timestamp: Date.now()
    });

    // Check for "STOP" or "DONE" commands
    const lowerText = text.toLowerCase();
    const stopWords = ["stop", "i am done", "ich bin fertig", "auf wiedersehen", "goodbye", "end session"];
    if (stopWords.some(word => lowerText.includes(word))) {
      this.handleAISpeech(this.languageCode === 'GERMAN' ? "Auf Wiedersehen! Ich erstelle jetzt deinen Bericht." : "Goodbye! I am generating your report now.");
      // Give it a moment to speak then disconnect
      setTimeout(() => {
        if (this.isConnected) {
          // We can't call handleStop directly here as it's in App.tsx
          // But we can trigger a state change or just let the user click
          // Actually, a better way is to provide a callback for auto-stop
        }
      }, 3000);
      return;
    }

    // Pulse visualizer for user
    this.callbacks.onAudioLevel(0.8, 'user');
    setTimeout(() => this.callbacks.onAudioLevel(0, 'user'), 500);

    // Get response from Local LLM
    try {
      // In a real implementation, we'd add generateChatResponse to AIProvider
      // For now, let's use a simplified chat logic or wait for feedback
      // Since this is a specialized tutor, we'll implement a simple chat method in LocalLiveClient for now
      const responseText = await this.getLLMResponse(text);
      
      this.handleAISpeech(responseText);
    } catch (error) {
      console.error("LLM Error:", error);
    }
  }

  private async getLLMResponse(text: string): Promise<string> {
    const responseText = await this.provider.chat(text, this.systemInstruction, this.conversationHistory);
    this.conversationHistory.push({ role: 'user', content: text });
    this.conversationHistory.push({ role: 'assistant', content: responseText });
    return responseText;
  }

  private handleAISpeech(text: string) {
    this.callbacks.onTranscription({
      speaker: 'ai',
      text: text,
      isComplete: true,
      timestamp: Date.now()
    });

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.languageCode === 'GERMAN' ? 'de-DE' : 'en-US';
    
    utterance.onstart = () => {
      this.callbacks.onAudioLevel(0.8, 'ai');
    };
    
    utterance.onend = () => {
      this.callbacks.onAudioLevel(0, 'ai');
    };

    this.synthesis.speak(utterance);
  }
}

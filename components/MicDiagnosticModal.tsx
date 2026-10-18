import React, { useState, useEffect, useRef } from 'react';

interface MicDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MicDiagnosticModal: React.FC<MicDiagnosticModalProps> = ({ isOpen, onClose }) => {
  const [micStatus, setMicStatus] = useState<'checking' | 'granted' | 'denied' | 'unsupported'>('checking');
  const [speechRecStatus, setSpeechRecStatus] = useState<'supported' | 'unsupported'>('checking' as any);
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [testedSpeaker, setTestedSpeaker] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      cleanupAudio();
      return;
    }

    // Check Speech Recognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechRecStatus(SpeechRecognition ? 'supported' : 'unsupported');

    // Check & request Microphone access
    startMicStream();

    return () => {
      cleanupAudio();
    };
  }, [isOpen]);

  const cleanupAudio = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // ignore
      }
      audioContextRef.current = null;
    }
    setVolumeLevel(0);
  };

  const startMicStream = async () => {
    setMicStatus('checking');
    setErrorMessage(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicStatus('unsupported');
      setErrorMessage('Your browser does not support mediaDevices.getUserMedia.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMicStatus('granted');

      // Setup Web Audio Analyser
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateMeter = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate average volume level
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          const normalized = Math.min(100, Math.round((average / 128) * 100));
          setVolumeLevel(normalized);

          animationFrameRef.current = requestAnimationFrame(updateMeter);
        };

        updateMeter();
      }
    } catch (err: any) {
      console.error('Mic check error:', err);
      setMicStatus('denied');
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Please allow microphone access in your browser settings.'
          : `Failed to open microphone: ${err.message || 'Unknown error'}`
      );
    }
  };

  const playTestChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Play a cheerful chord (C5 - E5 - G5)
      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.6);
      });

      setTestedSpeaker(true);
    } catch (e) {
      console.error('Speaker test error:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl">🎙️</span>
            <div>
              <h2 className="text-base font-bold text-gray-900">Audio & Mic Diagnostic</h2>
              <p className="text-xs text-gray-500">Verify your audio hardware before speaking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Diagnostic Item 1: Microphone */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800">1. Microphone Access</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                micStatus === 'granted'
                  ? 'bg-green-100 text-green-700'
                  : micStatus === 'checking'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {micStatus === 'granted' ? '✓ Working' : micStatus === 'checking' ? 'Testing...' : 'Denied / Error'}
              </span>
            </div>

            {/* Live Volume Meter */}
            {micStatus === 'granted' && (
              <div>
                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                  <span>Input Volume (Speak now):</span>
                  <span className="font-mono font-bold">{volumeLevel}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-green-500 via-emerald-400 to-emerald-600 transition-all duration-75"
                    style={{ width: `${Math.max(4, volumeLevel)}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5 italic text-center">
                  {volumeLevel > 15 ? '🎤 Voice detected loud and clear!' : 'Say something to test input levels...'}
                </p>
              </div>
            )}

            {errorMessage && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 leading-relaxed">
                {errorMessage}
              </p>
            )}
          </div>

          {/* Diagnostic Item 2: Speech Recognition */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-800">2. Speech Recognition Engine</p>
              <p className="text-[10px] text-gray-400">Web Speech API (Chrome / Edge / Safari)</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              speechRecStatus === 'supported' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {speechRecStatus === 'supported' ? '✓ Supported' : '✕ Unsupported'}
            </span>
          </div>

          {/* Diagnostic Item 3: Speaker Audio */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-800">3. Speaker & Headphones</p>
              <p className="text-[10px] text-gray-400">Test audio playback chime</p>
            </div>
            <button
              onClick={playTestChime}
              className="bg-black hover:bg-gray-800 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-colors flex items-center space-x-1"
            >
              <span>🔊</span>
              <span>{testedSpeaker ? 'Play Again' : 'Test Sound'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="w-full bg-black text-white py-3 rounded-2xl font-bold text-xs hover:bg-gray-800 transition-all shadow-xs"
          >
            Ready to Practice
          </button>
        </div>
      </div>
    </div>
  );
};

export default MicDiagnosticModal;

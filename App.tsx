import React, { useState, useEffect, useRef } from 'react';
import { ConnectionState, TranscriptionItem } from './types';
import { LiveClient } from './services/liveClient';
import Visualizer from './components/Visualizer';
import Transcript from './components/Transcript';

const SESSION_DURATION_SECONDS = 15 * 60; // 15 minutes

const App: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [transcripts, setTranscripts] = useState<TranscriptionItem[]>([]);
  const [userVolume, setUserVolume] = useState(0);
  const [aiVolume, setAiVolume] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION_SECONDS);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const liveClientRef = useRef<LiveClient | null>(null);
  const timerRef = useRef<number | null>(null);

  // Initialize Client
  useEffect(() => {
    const apiKey = process.env.API_KEY;
    if (apiKey) {
      liveClientRef.current = new LiveClient(apiKey, {
        onStateChange: setConnectionState,
        onTranscription: handleTranscriptionUpdate,
        onAudioLevel: (level, source) => {
          if (source === 'user') setUserVolume(level);
          else setAiVolume(level);
        }
      });
    }
    return () => {
      // Cleanup
      liveClientRef.current?.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer Logic
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
       setIsTimerRunning(false);
       // Optional: Auto-trigger feedback if desired, or just notify
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timeLeft]);

  const handleTranscriptionUpdate = (newItem: TranscriptionItem) => {
    setTranscripts(prev => {
        // If the last item is from the same speaker and incomplete, update it
        // Otherwise add new
        const last = prev[prev.length - 1];
        if (last && last.speaker === newItem.speaker && !last.isComplete && !newItem.isComplete) {
            return [...prev.slice(0, -1), newItem];
        }
        // If the last item was incomplete but now we have a complete one for the same speaker, replace it
        if (last && last.speaker === newItem.speaker && !last.isComplete && newItem.isComplete) {
             return [...prev.slice(0, -1), newItem];
        }
        return [...prev, newItem];
    });
  };

  const handleStart = async () => {
    if (!liveClientRef.current) return;
    setTranscripts([]);
    setTimeLeft(SESSION_DURATION_SECONDS);
    await liveClientRef.current.connect();
    setIsTimerRunning(true);
  };

  const handleStop = async () => {
    if (!liveClientRef.current) return;
    await liveClientRef.current.disconnect();
    setIsTimerRunning(false);
    setUserVolume(0);
    setAiVolume(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((SESSION_DURATION_SECONDS - timeLeft) / SESSION_DURATION_SECONDS) * 100;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-red-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <span className="text-2xl">🇩🇪</span>
                <h1 className="text-xl font-bold tracking-tight text-gray-900">Deutsch Daily</h1>
            </div>
            
            {/* Timer Display */}
            <div className="flex items-center space-x-4 bg-gray-100 rounded-full px-4 py-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" style={{ opacity: isTimerRunning ? 1 : 0 }}></div>
                <span className={`font-mono font-medium ${timeLeft < 60 ? 'text-red-600' : 'text-gray-700'}`}>
                    {formatTime(timeLeft)}
                </span>
            </div>
        </div>
        {/* Progress Bar */}
        <div className="h-1 bg-gray-100 w-full">
            <div 
                className="h-full bg-gradient-to-r from-yellow-400 via-red-500 to-black transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercentage}%` }}
            />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Visuals & Controls */}
        <div className="md:col-span-7 space-y-6">
            {/* Visualizer Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-transparent pointer-events-none"></div>
                
                <div className="flex items-center justify-center space-x-12 z-0">
                    <Visualizer 
                        isActive={connectionState === ConnectionState.CONNECTED}
                        level={userVolume}
                        color="#EF4444" // Red for User
                        label="You"
                    />
                    <Visualizer 
                        isActive={connectionState === ConnectionState.CONNECTED}
                        level={aiVolume}
                        color="#FBBF24" // Gold/Yellow for AI
                        label="Frau Müller"
                    />
                </div>

                {connectionState === ConnectionState.DISCONNECTED && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 backdrop-blur-sm">
                        <div className="text-center max-w-sm">
                            <h2 className="text-2xl font-bold mb-2">Ready for your lesson?</h2>
                            <p className="text-gray-600 mb-6">Talk to Frau Müller for 15 minutes. She will help you with pronunciation and grammar.</p>
                            <button 
                                onClick={handleStart}
                                className="bg-black text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition-transform active:scale-95 shadow-lg"
                            >
                                Start Conversation
                            </button>
                        </div>
                    </div>
                )}
                
                {connectionState === ConnectionState.ERROR && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-50/90 z-10">
                        <div className="text-center">
                            <p className="text-red-600 font-medium mb-4">Connection failed. Please check your microphone permissions or API key.</p>
                            <button onClick={() => setConnectionState(ConnectionState.DISCONNECTED)} className="text-sm underline">Reset</button>
                        </div>
                    </div>
                )}

                 {connectionState === ConnectionState.CONNECTING && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                    </div>
                )}
            </div>

            {/* Controls */}
            {connectionState === ConnectionState.CONNECTED && (
                <div className="flex justify-center space-x-4">
                     <button 
                        onClick={handleStop}
                        className="bg-red-50 text-red-600 border border-red-100 px-6 py-3 rounded-full font-medium hover:bg-red-100 transition-colors"
                    >
                        End Session
                    </button>
                    <div className="bg-blue-50 text-blue-800 px-4 py-3 rounded-xl text-sm flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Tip: Say "I am done" to get your feedback.
                    </div>
                </div>
            )}
        </div>

        {/* Right Column: Transcript */}
        <div className="md:col-span-5">
            <Transcript items={transcripts} />
            <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-sm text-yellow-800">
                <p className="font-semibold mb-1">Your Goal</p>
                <p>Speak for 15 minutes. Don't worry about mistakes! Frau Müller is here to help you.</p>
            </div>
        </div>

      </main>
    </div>
  );
};

export default App;

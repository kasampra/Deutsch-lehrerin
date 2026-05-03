import React, { useState, useEffect, useRef } from 'react';
import { ConnectionState, TranscriptionItem, FeedbackReport, Language, LanguageConfig, ProviderType, TutorStrictness } from './types';
import { LiveClient } from './services/liveClient';
import { LocalLiveClient } from './services/localLiveClient';
import { AIProvider, GeminiProvider, OllamaProvider, LMStudioProvider } from './services/aiProvider';
import { generateFeedback } from './services/feedbackService';
import { saveSession } from './utils/progressUtils';
import { GERMAN_SYSTEM_INSTRUCTION, GERMAN_VOICE_NAME, ENGLISH_SYSTEM_INSTRUCTION, ENGLISH_VOICE_NAME } from './constants';
import Visualizer from './components/Visualizer';
import Transcript from './components/Transcript';
import FeedbackReportView from './components/FeedbackReport';
import LanguageSelector from './components/LanguageSelector';
import ProviderSelector from './components/ProviderSelector';
import DailyPractice from './components/DailyPractice';
import ProgressDashboard from './components/ProgressDashboard';
import WelcomeModal from './components/WelcomeModal';
import TrainingSession from './components/TrainingSession';
import { generatePersonalizedTraining, TrainingExercise } from './services/trainingService';

const SESSION_DURATION_SECONDS = 15 * 60; // 15 minutes

const LANGUAGE_CONFIGS: Record<Language, LanguageConfig> = {
  [Language.GERMAN]: {
    code: Language.GERMAN,
    name: 'German',
    flag: '🇩🇪',
    teacherName: 'Frau Müller',
    systemInstruction: GERMAN_SYSTEM_INSTRUCTION,
    voiceName: GERMAN_VOICE_NAME,
    primaryColor: '#EF4444',
    secondaryColor: '#FBBF24',
  },
  [Language.ENGLISH]: {
    code: Language.ENGLISH,
    name: 'English',
    flag: '🇬🇧',
    teacherName: 'Mr. Williams',
    systemInstruction: ENGLISH_SYSTEM_INSTRUCTION,
    voiceName: ENGLISH_VOICE_NAME,
    primaryColor: '#3B82F6',
    secondaryColor: '#8B5CF6',
  },
};

const App: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageConfig>(LANGUAGE_CONFIGS[Language.GERMAN]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>(ProviderType.GEMINI);
  const [tutorStrictness, setTutorStrictness] = useState<TutorStrictness>(TutorStrictness.BALANCED);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [transcripts, setTranscripts] = useState<TranscriptionItem[]>([]);
  const [userVolume, setUserVolume] = useState(0);
  const [aiVolume, setAiVolume] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION_SECONDS);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // Feedback State
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [feedbackReport, setFeedbackReport] = useState<FeedbackReport | null>(null);
  const [trainingExercises, setTrainingExercises] = useState<TrainingExercise[] | null>(null);

  const liveClientRef = useRef<LiveClient | LocalLiveClient | null>(null);
  const aiProviderRef = useRef<AIProvider | null>(null);
  const timerRef = useRef<number | null>(null);

  // Initialize Provider and Client
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    // Create the AI Provider based on selection
    if (selectedProvider === ProviderType.GEMINI && apiKey) {
      aiProviderRef.current = new GeminiProvider(apiKey);
    } else if (selectedProvider === ProviderType.OLLAMA) {
      aiProviderRef.current = new OllamaProvider();
    } else if (selectedProvider === ProviderType.LM_STUDIO) {
      aiProviderRef.current = new LMStudioProvider();
    }

    // Create the appropriate Live Client
    const callbacks = {
      onStateChange: setConnectionState,
      onTranscription: handleTranscriptionUpdate,
      onAudioLevel: (level: number, source: 'user' | 'ai') => {
        if (source === 'user') setUserVolume(level);
        else setAiVolume(level);
      }
    };

    if (selectedProvider === ProviderType.GEMINI && apiKey) {
      liveClientRef.current = new LiveClient(
        apiKey,
        selectedLanguage.systemInstruction,
        selectedLanguage.voiceName,
        callbacks
      );
    } else if (aiProviderRef.current) {
      liveClientRef.current = new LocalLiveClient(
        aiProviderRef.current,
        selectedLanguage.systemInstruction,
        tutorStrictness,
        selectedLanguage.code,
        selectedLanguage.voiceName,
        callbacks
      );
    }

    return () => {
      liveClientRef.current?.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedLanguage, selectedProvider]);

  // Timer Logic
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
       handleStop(); // Auto-stop when time runs out
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timeLeft]);

  const handleTranscriptionUpdate = (newItem: TranscriptionItem) => {
    setTranscripts(prev => {
        const last = prev[prev.length - 1];
        if (last && last.speaker === newItem.speaker && !last.isComplete && !newItem.isComplete) {
            return [...prev.slice(0, -1), newItem];
        }
        if (last && last.speaker === newItem.speaker && !last.isComplete && newItem.isComplete) {
             return [...prev.slice(0, -1), newItem];
        }
        return [...prev, newItem];
    });
  };

  const handleStart = async () => {
    if (!liveClientRef.current) return;
    setTranscripts([]);
    setFeedbackReport(null);
    setTrainingExercises(null);
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

    const duration = SESSION_DURATION_SECONDS - timeLeft;

    // Trigger Feedback Generation if there is enough conversation
    if (transcripts.length > 2) {
        setIsGeneratingFeedback(true);
        try {
            if (aiProviderRef.current) {
                const report = await generateFeedback(aiProviderRef.current, transcripts, selectedLanguage.code);
                setFeedbackReport(report);
                
                // Save session with feedback
                saveSession({
                  language: selectedLanguage.code,
                  duration: duration,
                  sentenceCount: transcripts.filter(t => t.speaker === 'user').length,
                  feedback: report
                });

                // Generate training exercises
                const exercises = await generatePersonalizedTraining(aiProviderRef.current, report, selectedLanguage.code);
                setTrainingExercises(exercises);
            }
        } catch (error) {
            console.error("Failed to generate feedback:", error);
            // Save session even if feedback fails
            saveSession({
                language: selectedLanguage.code,
                duration: duration,
                sentenceCount: transcripts.filter(t => t.speaker === 'user').length,
            });
        } finally {
            setIsGeneratingFeedback(false);
        }
    }
  };

  const resetSession = () => {
      setFeedbackReport(null);
      setTrainingExercises(null);
      setTranscripts([]);
      setTimeLeft(SESSION_DURATION_SECONDS);
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
                <span className="text-2xl">{selectedLanguage.flag}</span>
                <h1 className="text-xl font-bold tracking-tight text-gray-900">
                  {selectedLanguage.name === 'German' ? 'Deutsch Daily' : 'English Express'}
                </h1>
            </div>
            
            {/* Timer Display */}
            <div className="flex items-center space-x-4 bg-gray-100 rounded-full px-4 py-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" style={{ opacity: isTimerRunning ? 1 : 0 }}></div>
                <span className={`font-mono font-medium ${timeLeft < 60 ? 'text-red-600' : 'text-gray-700'}`}>
                    {formatTime(timeLeft)}
                </span>
            </div>
        </div>
        <div className="h-1 bg-gray-100 w-full">
            <div 
                className="h-full transition-all duration-1000 ease-linear"
                style={{ 
                  width: `${progressPercentage}%`,
                  background: selectedLanguage.code === Language.GERMAN 
                    ? 'linear-gradient(to right, #FBBF24, #EF4444, #000000)'
                    : 'linear-gradient(to right, #3B82F6, #8B5CF6, #EC4899)'
                }}
            />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Main Content Area */}
        <div className="md:col-span-12">
            
            {/* Logic to show Feedback Report OR Training Session OR the standard Visualizer */}
            {trainingExercises ? (
                <div className="max-w-2xl mx-auto">
                    <TrainingSession exercises={trainingExercises} onComplete={resetSession} />
                </div>
            ) : feedbackReport ? (
                <FeedbackReportView report={feedbackReport} onClose={() => {
                    if (!trainingExercises) resetSession();
                }} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                     {/* Left Column: Visuals & Controls */}
                    <div className="md:col-span-7 space-y-6">
                        {/* Language & Provider Selector */}
                        {connectionState === ConnectionState.DISCONNECTED && (
                          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-8">
                            <div>
                              <h2 className="text-lg font-bold text-center mb-4 text-gray-900">1. Choose Your Language</h2>
                              <LanguageSelector 
                                selected={selectedLanguage}
                                onSelect={setSelectedLanguage}
                                disabled={connectionState !== ConnectionState.DISCONNECTED}
                              />
                            </div>

                            <div>
                              <h2 className="text-lg font-bold text-center mb-4 text-gray-900">2. Choose Your AI Brain</h2>
                              <ProviderSelector 
                                selected={selectedProvider}
                                onSelect={setSelectedProvider}
                                disabled={connectionState !== ConnectionState.DISCONNECTED}
                              />
                            </div>

                            <div className="pt-4 border-t border-gray-50">
                              <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Tutor Strictness</h2>
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-black text-white rounded-full">
                                  {tutorStrictness}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                {(Object.values(TutorStrictness) as TutorStrictness[]).map((s) => (
                                  <button
                                    key={s}
                                    onClick={() => setTutorStrictness(s)}
                                    className={`
                                      py-2 px-1 rounded-xl text-[10px] font-bold transition-all border
                                      ${tutorStrictness === s 
                                        ? 'bg-black text-white border-black' 
                                        : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}
                                    `}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                              <p className="mt-2 text-[10px] text-gray-400 text-center italic">
                                {tutorStrictness === TutorStrictness.GENTLE && "Minimal interruptions, focused on flow."}
                                {tutorStrictness === TutorStrictness.BALANCED && "Corrects key errors, maintains conversation."}
                                {tutorStrictness === TutorStrictness.STRICT && "Corrects every mistake, focused on accuracy."}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-transparent pointer-events-none"></div>
                            
                            <div className="flex items-center justify-center space-x-12 z-0">
                                <Visualizer 
                                    isActive={connectionState === ConnectionState.CONNECTED}
                                    level={userVolume}
                                    color={selectedLanguage.primaryColor}
                                    label="You"
                                />
                                <Visualizer 
                                    isActive={connectionState === ConnectionState.CONNECTED}
                                    level={aiVolume}
                                    color={selectedLanguage.secondaryColor}
                                    label={selectedLanguage.teacherName}
                                />
                            </div>

                            {/* Overlays */}
                            {connectionState === ConnectionState.DISCONNECTED && !isGeneratingFeedback && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 backdrop-blur-sm">
                                    <div className="text-center max-w-sm">
                                        <h2 className="text-2xl font-bold mb-2">Ready for your lesson?</h2>
                                        <p className="text-gray-600 mb-6">
                                          Talk to {selectedLanguage.teacherName} for 15 minutes. 
                                          {selectedLanguage.code === Language.GERMAN 
                                            ? ' Sie wird Ihnen bei Aussprache und Grammatik helfen.' 
                                            : ' They will help you with pronunciation and grammar.'}
                                        </p>
                                        <button 
                                            onClick={handleStart}
                                            className="bg-black text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition-transform active:scale-95 shadow-lg"
                                        >
                                            Start Conversation
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isGeneratingFeedback && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/95 z-20 backdrop-blur-sm">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mx-auto mb-4"></div>
                                        <h2 className="text-xl font-bold mb-2">Generating Report...</h2>
                                        <p className="text-gray-500">{selectedLanguage.teacherName} is writing down your feedback.</p>
                                    </div>
                                </div>
                            )}
                            
                            {connectionState === ConnectionState.ERROR && (
                                <div className="absolute inset-0 flex items-center justify-center bg-red-50/90 z-10">
                                    <div className="text-center">
                                        <p className="text-red-600 font-medium mb-4">Connection failed.</p>
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
                                    Tip: Say "I am done" to end and get your report.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Transcript, Daily Practice, and Progress */}
                    <div className="md:col-span-5 space-y-6">
                        {connectionState === ConnectionState.DISCONNECTED ? (
                          <>
                            <DailyPractice />
                            <ProgressDashboard />
                          </>
                        ) : (
                          <Transcript items={transcripts} />
                        )}
                        
                        <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-sm text-yellow-800">
                            <p className="font-semibold mb-1">Your Goal</p>
                            <p>Speak for 15 minutes. At the end, you will receive a detailed report with actionable advice.</p>
                        </div>
                    </div>
                </div>
            )}

        </div>
      </main>
      <WelcomeModal />
    </div>
  );
};

export default App;

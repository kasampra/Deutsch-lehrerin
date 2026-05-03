import React, { useState, useEffect } from 'react';

const WelcomeModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [compatibility, setCompatibility] = useState({ stt: false, tts: false });

  useEffect(() => {
    const hasVisited = localStorage.getItem('deutsch_lehrerin_visited');
    if (!hasVisited) {
      setIsOpen(true);
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setCompatibility({
      stt: !!SpeechRecognition,
      tts: !!window.speechSynthesis
    });
  }, []);

  const close = () => {
    localStorage.setItem('deutsch_lehrerin_visited', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🛡️</span>
          </div>
          
          <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
            Welcome to Your Sovereign Teacher
          </h2>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            Congratulations on taking control of your learning. **Deutsch-lehrerin** is designed to keep your data private by running the AI "brain" locally on your machine.
          </p>

          <div className="space-y-4 mb-10 text-left">
            <div className="flex items-start space-x-4">
              <div className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-1">1</div>
              <p className="text-sm text-gray-700"><strong>Install Ollama</strong> to provide the local AI engine.</p>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-1">2</div>
              <p className="text-sm text-gray-700"><strong>Choose your Brain</strong> in the settings below (Ollama or LM Studio).</p>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-1">3</div>
              <p className="text-sm text-gray-700"><strong>Start Speaking</strong> and get real-time grammar corrections.</p>
            </div>
          </div>

          {(!compatibility.stt || !compatibility.tts) && (
            <div className="mb-8 p-4 bg-orange-50 border border-orange-100 rounded-2xl text-left">
              <p className="text-xs font-bold text-orange-800 uppercase mb-1">⚠️ System Warning</p>
              <p className="text-xs text-orange-700">
                {!compatibility.stt && "Speech Recognition (STT) is not supported in this browser. "}
                {!compatibility.tts && "Speech Synthesis (TTS) is not supported in this browser. "}
                Please use a modern browser like Chrome or Edge for the best experience.
              </p>
            </div>
          )}

          <button 
            onClick={close}
            className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-xl"
          >
            Let's Get Started
          </button>
          
          <p className="mt-6 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
            Sovereign by Design • No Cloud Monitoring
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;

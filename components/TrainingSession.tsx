import React, { useState } from 'react';
import { TrainingExercise } from '../services/trainingService';

interface TrainingSessionProps {
  exercises: TrainingExercise[];
  onComplete: () => void;
}

const TrainingSession: React.FC<TrainingSessionProps> = ({ exercises, onComplete }) => {
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowEnglish] = useState(false);
  const current = exercises[index];

  const next = () => {
    if (index < exercises.length - 1) {
      setIndex(index + 1);
      setShowEnglish(false);
    } else {
      onComplete();
    }
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <span className="text-xs font-black uppercase tracking-widest text-blue-600">Personalized Training</span>
        <span className="text-xs font-bold text-gray-400">{index + 1} / {exercises.length}</span>
      </div>

      <div className="text-center mb-10">
        <p className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Focus: {current.focus}</p>
        <h2 className="text-3xl font-black text-gray-900 mb-6">{current.german}</h2>
        
        {showAnswer ? (
          <p className="text-xl text-gray-500 italic animate-in fade-in duration-300">{current.english}</p>
        ) : (
          <button 
            onClick={() => setShowEnglish(true)}
            className="text-sm font-bold text-blue-500 hover:underline"
          >
            Reveal Translation
          </button>
        )}
      </div>

      <div className="flex flex-col space-y-3">
        <button 
          onClick={() => speak(current.german)}
          className="w-full bg-gray-50 text-gray-600 py-4 rounded-2xl font-bold flex items-center justify-center hover:bg-gray-100 transition-all"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
          Listen
        </button>
        <button 
          onClick={next}
          className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-800 shadow-lg active:scale-[0.98] transition-all"
        >
          {index === exercises.length - 1 ? 'Finish Training' : 'Next Exercise'}
        </button>
      </div>
    </div>
  );
};

export default TrainingSession;

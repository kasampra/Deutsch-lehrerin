import React, { useState } from 'react';
import { EVERYDAY_SENTENCES } from '../constants';

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD") // Split accent characters
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "") // Remove punctuation
    .replace(/\s+/g, " ")
    .trim()
    .replace(/ß/g, "ss")
    .replace(/ae/g, "a")
    .replace(/oe/g, "o")
    .replace(/ue/g, "u")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u");
}

function levenshteinDistance(a: string, b: string): number {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }
  return matrix[b.length][a.length];
}


const DailyPractice: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showEnglish, setShowEnglish] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const current = EVERYDAY_SENTENCES[currentIndex];

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % EVERYDAY_SENTENCES.length);
    setShowEnglish(false);
    setFeedback(null);
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    window.speechSynthesis.speak(utterance);
  };

  const practice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    setIsListening(true);
    setFeedback(null);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const normTranscript = normalizeText(transcript);
      const normTarget = normalizeText(current.german);

      const distance = levenshteinDistance(normTranscript, normTarget);
      const maxLength = Math.max(normTranscript.length, normTarget.length);
      const similarity = maxLength === 0 ? 1 : 1 - distance / maxLength;

      if (normTranscript === normTarget) {
        setFeedback("✅ Perfect pronunciation!");
      } else if (similarity >= 0.8) {
        setFeedback(`✅ Great job! (Similarity: ${Math.round(similarity * 100)}%)`);
      } else {
        setFeedback(`❌ You said: "${transcript}". Try again!`);
      }
    };

    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Everyday Sentences</h2>
        <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full text-gray-500 uppercase tracking-wider">
          {current.category}
        </span>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[150px] space-y-4">
        <p className="text-2xl font-bold text-center text-gray-900 leading-tight">
          {current.german}
        </p>
        
        {showEnglish ? (
          <p className="text-lg text-gray-500 animate-in fade-in slide-in-from-top-1 duration-300">
            {current.english}
          </p>
        ) : (
          <button 
            onClick={() => setShowEnglish(true)}
            className="text-sm text-blue-600 font-medium hover:underline"
          >
            Show Translation
          </button>
        )}

        {feedback && (
          <p className={`text-sm font-medium mt-2 ${feedback.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
            {feedback}
          </p>
        )}
      </div>

      <div className="mt-8 flex flex-col space-y-3">
        <div className="flex items-center space-x-3">
            <button 
              onClick={() => speak(current.german)}
              className="p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors text-gray-600 flex-1 flex items-center justify-center"
              title="Listen"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              Listen
            </button>
            
            <button 
              onClick={practice}
              disabled={isListening}
              className={`p-4 rounded-2xl transition-all flex-1 flex items-center justify-center font-medium ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              {isListening ? 'Listening...' : 'Practice'}
            </button>
        </div>

        <button 
          onClick={next}
          className="w-full bg-black text-white py-4 rounded-2xl font-semibold hover:bg-gray-800 transition-all active:scale-95 shadow-sm"
        >
          Next Sentence
        </button>
      </div>

      <div className="mt-6 flex justify-center space-x-1">
        {EVERYDAY_SENTENCES.map((_, i) => (
          <div 
            key={i} 
            className={`h-1 w-4 rounded-full transition-colors ${i === currentIndex ? 'bg-black' : 'bg-gray-100'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default DailyPractice;

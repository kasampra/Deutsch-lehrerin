import React, { useState, useEffect } from 'react';
import { EVERYDAY_SENTENCES } from '../constants';
import {
  getDueCards,
  getFlashcards,
  calculateNextReview,
  saveFlashcard,
  SRSReviewRating,
  Flashcard,
  seedInitialCardsIfEmpty,
} from '../services/srsService';

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
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
          matrix[i - 1][j - 1] + 1,
          Math.min(
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

const DailyPractice: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'srs' | 'everyday'>('srs');
  
  // Everyday Sentences State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showEnglish, setShowEnglish] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // SRS State
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [srsIndex, setSrsIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  useEffect(() => {
    seedInitialCardsIfEmpty();
    refreshDueCards();
  }, []);

  const refreshDueCards = () => {
    const cards = getDueCards();
    setDueCards(cards);
    setSrsIndex(0);
    setIsCardFlipped(false);
  };

  const currentEveryday = EVERYDAY_SENTENCES[currentIndex];
  const currentSrs = dueCards[srsIndex];

  const nextEveryday = () => {
    setCurrentIndex((prev) => (prev + 1) % EVERYDAY_SENTENCES.length);
    setShowEnglish(false);
    setFeedback(null);
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    window.speechSynthesis.speak(utterance);
  };

  const practiceSpeech = (targetText: string) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    setIsListening(true);
    setFeedback(null);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const normTranscript = normalizeText(transcript);
      const normTarget = normalizeText(targetText);

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
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const handleSrsRating = (rating: SRSReviewRating) => {
    if (!currentSrs) return;
    const updated = calculateNextReview(currentSrs, rating);
    saveFlashcard(updated);

    // Advance to next due card
    if (srsIndex < dueCards.length - 1) {
      setSrsIndex(prev => prev + 1);
      setIsCardFlipped(false);
      setFeedback(null);
    } else {
      // Refresh list
      refreshDueCards();
    }
  };

  const totalCardsCount = getFlashcards().length;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => { setActiveTab('srs'); setFeedback(null); }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'srs'
                ? 'bg-black text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 bg-gray-50'
            }`}
          >
            <span>🧠 SRS Vault</span>
            {dueCards.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeTab === 'srs' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600'
              }`}>
                {dueCards.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('everyday'); setFeedback(null); }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === 'everyday'
                ? 'bg-black text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 bg-gray-50'
            }`}
          >
            <span>💬 Everyday Sentences</span>
          </button>
        </div>

        <span className="text-[10px] text-gray-400 font-medium">
          {activeTab === 'srs' ? `${totalCardsCount} cards total` : currentEveryday.category}
        </span>
      </div>

      {/* TAB 1: SRS FLASHCARD REVIEW */}
      {activeTab === 'srs' && (
        <div>
          {dueCards.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <span className="text-4xl">🎉</span>
              <h3 className="font-bold text-gray-900 text-base">All Caught Up!</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                You have reviewed all due cards. When you practice speaking with Frau Müller, your mistakes will automatically be added here!
              </p>
              <button
                onClick={() => {
                  // Review all cards anyway
                  setDueCards(getFlashcards());
                  setSrsIndex(0);
                }}
                className="text-xs text-blue-600 font-bold hover:underline pt-2 block mx-auto"
              >
                Review all {totalCardsCount} cards anyway
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="font-bold uppercase tracking-wider text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                  {currentSrs.category}
                </span>
                <span>Card {srsIndex + 1} of {dueCards.length}</span>
              </div>

              {/* Flashcard Body */}
              <div 
                onClick={() => setIsCardFlipped(prev => !prev)}
                className="cursor-pointer min-h-[170px] bg-gradient-to-b from-gray-50 to-white border border-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all hover:border-gray-300 shadow-2xs relative"
              >
                <span className="text-[9px] uppercase tracking-widest text-gray-400 absolute top-3 left-4">
                  {isCardFlipped ? 'Answer & Rule (Click to flip)' : 'Prompt (Click to reveal)'}
                </span>

                <p className="text-xl font-bold text-gray-900 mt-2 leading-snug">
                  {isCardFlipped ? currentSrs.back : currentSrs.front}
                </p>

                {isCardFlipped && currentSrs.explanation && (
                  <p className="text-xs text-gray-500 mt-3 max-w-md bg-yellow-50/70 border border-yellow-100/80 p-2 rounded-xl text-left leading-relaxed">
                    💡 {currentSrs.explanation}
                  </p>
                )}

                {isCardFlipped && (
                  <button
                    onClick={(e) => { e.stopPropagation(); speak(currentSrs.back); }}
                    className="mt-3 text-xs text-gray-500 hover:text-black flex items-center gap-1"
                  >
                    <span>🔊 Listen</span>
                  </button>
                )}
              </div>

              {feedback && (
                <p className={`text-xs font-medium text-center ${feedback.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
                  {feedback}
                </p>
              )}

              {/* Action Buttons */}
              {!isCardFlipped ? (
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={() => practiceSpeech(currentSrs.back)}
                    disabled={isListening}
                    className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-1.5 ${
                      isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>🎤</span>
                    <span>{isListening ? 'Listening...' : 'Practice Speaking'}</span>
                  </button>
                  <button
                    onClick={() => setIsCardFlipped(true)}
                    className="flex-1 bg-black text-white py-3 rounded-xl font-bold text-xs hover:bg-gray-800 transition-all shadow-xs"
                  >
                    Show Answer
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] text-gray-400 text-center uppercase tracking-wider font-bold">
                    How well did you know this?
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => handleSrsRating(SRSReviewRating.AGAIN)}
                      className="py-2.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-xs font-bold transition-all"
                    >
                      Again (1d)
                    </button>
                    <button
                      onClick={() => handleSrsRating(SRSReviewRating.HARD)}
                      className="py-2.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl text-xs font-bold transition-all"
                    >
                      Hard
                    </button>
                    <button
                      onClick={() => handleSrsRating(SRSReviewRating.GOOD)}
                      className="py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all"
                    >
                      Good
                    </button>
                    <button
                      onClick={() => handleSrsRating(SRSReviewRating.EASY)}
                      className="py-2.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl text-xs font-bold transition-all"
                    >
                      Easy
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EVERYDAY SENTENCES (EXISTING) */}
      {activeTab === 'everyday' && (
        <div>
          <div className="flex flex-col items-center justify-center min-h-[150px] space-y-4">
            <p className="text-2xl font-bold text-center text-gray-900 leading-tight">
              {currentEveryday.german}
            </p>
            
            {showEnglish ? (
              <p className="text-lg text-gray-500 animate-in fade-in slide-in-from-top-1 duration-300">
                {currentEveryday.english}
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
                onClick={() => speak(currentEveryday.german)}
                className="p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors text-gray-600 flex-1 flex items-center justify-center"
                title="Listen"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                Listen
              </button>
              
              <button 
                onClick={() => practiceSpeech(currentEveryday.german)}
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
              onClick={nextEveryday}
              className="w-full bg-black text-white py-4 rounded-2xl font-semibold hover:bg-gray-800 transition-all active:scale-95 shadow-sm"
            >
              Next Sentence
            </button>
          </div>

          <div className="mt-6 flex justify-center space-x-1">
            {EVERYDAY_SENTENCES.slice(0, 10).map((_, i) => (
              <div 
                key={i} 
                className={`h-1 w-4 rounded-full transition-colors ${i === currentIndex % 10 ? 'bg-black' : 'bg-gray-100'}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyPractice;

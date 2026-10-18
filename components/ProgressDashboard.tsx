import React, { useState, useRef } from 'react';
import { getProgress, downloadSovereignBackup, importSovereignData } from '../utils/progressUtils';
import { getFlashcards, getDueCards } from '../services/srsService';

const ProgressDashboard: React.FC = () => {
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const progress = getProgress();
  const flashcards = getFlashcards();
  const dueCards = getDueCards();

  const totalSessions = progress.sessions.length;
  const totalDuration = progress.sessions.reduce((acc, s) => acc + s.duration, 0);
  const totalSentences = progress.sessions.reduce((acc, s) => acc + s.sentenceCount, 0);

  // Calculate average scores if feedback exists
  const feedbackSessions = progress.sessions.filter(s => s.feedback);
  const avgGrammar = feedbackSessions.length > 0
    ? (feedbackSessions.reduce((acc, s) => acc + (s.feedback?.grammar.score || 0), 0) / feedbackSessions.length).toFixed(1)
    : null;
  const avgVocab = feedbackSessions.length > 0
    ? (feedbackSessions.reduce((acc, s) => acc + (s.feedback?.vocabulary.score || 0), 0) / feedbackSessions.length).toFixed(1)
    : null;

  // Estimate CEFR level based on average score & session count
  const getEstimatedLevel = () => {
    if (totalSessions < 3) return 'A1 (Beginner)';
    const avg = Number(avgGrammar || 5);
    if (avg >= 8.5) return 'B2 (Independent)';
    if (avg >= 7.0) return 'B1 (Intermediate)';
    if (avg >= 5.0) return 'A2 (Elementary)';
    return 'A1 (Beginner)';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const res = importSovereignData(text);
      setImportMessage(res.message);
      setTimeout(() => setImportMessage(null), 5000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Your Progress Vault</h2>
          <p className="text-xs text-gray-400">Continuous mastery across speaking & grammar</p>
        </div>
        <span className="text-[10px] font-extrabold px-2.5 py-1 bg-black text-white rounded-full">
          {getEstimatedLevel()}
        </span>
      </div>
      
      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-gray-50/80 p-3.5 rounded-2xl text-center border border-gray-100">
          <p className="text-xl font-black text-black">{totalSessions}</p>
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-0.5">Sessions</p>
        </div>
        <div className="bg-gray-50/80 p-3.5 rounded-2xl text-center border border-gray-100">
          <p className="text-xl font-black text-black">{Math.round(totalDuration / 60)}</p>
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-0.5">Minutes</p>
        </div>
        <div className="bg-gray-50/80 p-3.5 rounded-2xl text-center border border-gray-100">
          <p className="text-xl font-black text-black">{flashcards.length}</p>
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-0.5">SRS Cards</p>
        </div>
      </div>

      {/* SRS Mastery Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 p-3.5 rounded-2xl border border-blue-100/60 flex items-center justify-between text-xs">
        <div>
          <p className="font-bold text-blue-900">🧠 Spaced Repetition Due Today</p>
          <p className="text-blue-700/80 text-[11px] mt-0.5">
            {dueCards.length === 0 ? 'All caught up! Zero cards overdue.' : `${dueCards.length} cards waiting for your voice review.`}
          </p>
        </div>
        <span className={`text-xs font-black px-2.5 py-1 rounded-xl ${
          dueCards.length > 0 ? 'bg-red-500 text-white shadow-xs' : 'bg-green-600 text-white'
        }`}>
          {dueCards.length} Due
        </span>
      </div>

      {/* Recent Activity */}
      {progress.sessions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recent Sessions</h3>
          {progress.sessions.slice(-3).reverse().map((session, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
              <div>
                <p className="text-xs font-bold text-gray-800">{new Date(session.timestamp).toLocaleDateString()}</p>
                <p className="text-[10px] text-gray-400">{session.language} • {Math.round(session.duration)}s • {session.sentenceCount} turns</p>
              </div>
              {session.feedback && (
                <div className="flex space-x-1.5">
                  <span className="text-[10px] bg-green-50 text-green-700 border border-green-200/60 px-2 py-0.5 rounded-md font-bold">
                    Grammar: {session.feedback.grammar.score}/10
                  </span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200/60 px-2 py-0.5 rounded-md font-bold">
                    Vocab: {session.feedback.vocabulary.score}/10
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sovereign Data Portability Card */}
      <div className="pt-4 border-t border-gray-100 flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <span>🛡️</span> Sovereign Backup
          </span>
          <div className="flex space-x-2">
            <button
              onClick={downloadSovereignBackup}
              className="text-[11px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-xl transition-colors flex items-center space-x-1"
              title="Download full JSON backup of sessions and cards"
            >
              <span>💾 Export</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-xl transition-colors flex items-center space-x-1"
              title="Restore previous backup"
            >
              <span>📥 Import</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>
        {importMessage && (
          <p className="text-xs text-green-700 bg-green-50 p-2 rounded-xl border border-green-200 text-center font-medium animate-in fade-in duration-200">
            {importMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProgressDashboard;

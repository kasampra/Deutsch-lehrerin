import React from 'react';
import { getProgress } from '../utils/progressUtils';

const ProgressDashboard: React.FC = () => {
  const progress = getProgress();
  const totalSessions = progress.sessions.length;
  const totalDuration = progress.sessions.reduce((acc, s) => acc + s.duration, 0);
  const totalSentences = progress.sessions.reduce((acc, s) => acc + s.sentenceCount, 0);

  if (totalSessions === 0) return null;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Your Progress</h2>
      
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-50 p-4 rounded-2xl text-center">
          <p className="text-2xl font-bold text-black">{totalSessions}</p>
          <p className="text-xs text-gray-500 uppercase">Sessions</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl text-center">
          <p className="text-2xl font-bold text-black">{Math.round(totalDuration / 60)}</p>
          <p className="text-xs text-gray-500 uppercase">Minutes</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl text-center">
          <p className="text-2xl font-bold text-black">{totalSentences}</p>
          <p className="text-xs text-gray-500 uppercase">Sentences</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Recent Activity</h3>
        {progress.sessions.slice(-3).reverse().map((session, i) => (
          <div key={i} className="flex items-center justify-between p-3 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-sm font-medium">{new Date(session.timestamp).toLocaleDateString()}</p>
              <p className="text-xs text-gray-400">{session.language} • {Math.round(session.duration)}s</p>
            </div>
            {session.feedback && (
              <div className="flex space-x-1">
                <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold">
                  G: {session.feedback.grammar.score}
                </span>
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                  V: {session.feedback.vocabulary.score}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressDashboard;

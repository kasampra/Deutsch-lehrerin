import React from 'react';
import { FeedbackReport, FeedbackCategory } from '../types';

interface FeedbackReportProps {
  report: FeedbackReport;
  onClose: () => void;
}

const CategoryCard: React.FC<{ title: string; data: FeedbackCategory; icon: string; color: string }> = ({ title, data, icon, color }) => (
  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{icon}</span>
        <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
      </div>
      <div className={`px-3 py-1 rounded-full text-sm font-bold ${data.score >= 8 ? 'bg-green-100 text-green-700' : data.score >= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
        {data.score}/10
      </div>
    </div>
    
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Strengths</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 marker:text-green-500">
          {data.strengths.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>
      
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Needs Focus</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 marker:text-red-400">
          {data.areasForImprovement.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>

      <div className={`mt-4 p-3 rounded-xl ${color} bg-opacity-10 border border-opacity-20`}>
        <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 opacity-80`} style={{ color: color.replace('bg-', 'text-') }}>Actionable Advice</h4>
        <ul className="space-y-2">
            {data.actionableTips.map((tip, i) => (
                <li key={i} className="flex items-start text-sm text-gray-700">
                    <span className="mr-2 text-lg leading-none">💡</span>
                    <span>{tip}</span>
                </li>
            ))}
        </ul>
      </div>
    </div>
  </div>
);

const FeedbackReportView: React.FC<FeedbackReportProps> = ({ report, onClose }) => {
    
  const handleCopy = () => {
    const text = `
Deutsch Daily Feedback Report:
${report.generalSummary}

--- GRAMMAR (${report.grammar.score}/10) ---
Tips:
${report.grammar.actionableTips.map(t => `- ${t}`).join('\n')}

--- VOCABULARY (${report.vocabulary.score}/10) ---
Tips:
${report.vocabulary.actionableTips.map(t => `- ${t}`).join('\n')}

--- PRONUNCIATION (${report.pronunciation.score}/10) ---
Tips:
${report.pronunciation.actionableTips.map(t => `- ${t}`).join('\n')}
    `;
    navigator.clipboard.writeText(text);
    alert("Report copied to clipboard!");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
        <h2 className="text-2xl font-bold mb-2">Session Complete!</h2>
        <p className="text-gray-300 leading-relaxed max-w-2xl">{report.generalSummary}</p>
        
        <div className="flex gap-4 mt-6">
            <button onClick={handleCopy} className="bg-white text-gray-900 px-5 py-2 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                Copy Report
            </button>
            <button onClick={onClose} className="bg-gray-700 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-gray-600 transition-colors">
                Start New Session
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CategoryCard 
            title="Grammar" 
            data={report.grammar} 
            icon="📐" 
            color="bg-blue-500" 
        />
        <CategoryCard 
            title="Vocabulary" 
            data={report.vocabulary} 
            icon="📚" 
            color="bg-purple-500" 
        />
        <CategoryCard 
            title="Pronunciation" 
            data={report.pronunciation} 
            icon="🗣️" 
            color="bg-orange-500" 
        />
      </div>
    </div>
  );
};

export default FeedbackReportView;

import React, { useEffect, useRef } from 'react';
import { TranscriptionItem } from '../types';

interface TranscriptProps {
  items: TranscriptionItem[];
}

const CORRECTION_REGEX = /\[Korrektur:\s*['"`]?(.*?)['"`]?\s*->\s*['"`]?(.*?)['"`]?\s*\|\s*(.*?)\]/i;

const Transcript: React.FC<TranscriptProps> = ({ items }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [items]);

  const renderMessageContent = (item: TranscriptionItem) => {
    if (item.speaker === 'user') {
      return <p>{item.text}</p>;
    }

    const match = item.text.match(CORRECTION_REGEX);
    if (!match) {
      return <p>{item.text}</p>;
    }

    const [fullMatch, incorrect, correct, explanation] = match;
    const cleanText = item.text.replace(fullMatch, '').trim();

    return (
      <div className="space-y-3 w-full">
        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 text-xs text-gray-800 space-y-1.5 shadow-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center space-x-1.5 font-bold text-red-500 uppercase tracking-wider text-[9px]">
            <span className="text-sm">📐</span>
            <span>Grammar Correction</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="line-through text-red-400 bg-red-50 px-1.5 py-0.5 rounded font-medium">"{incorrect}"</span>
            <span className="text-gray-400">→</span>
            <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-bold">"{correct}"</span>
          </div>
          <p className="text-gray-500 font-medium leading-relaxed mt-1 border-t border-gray-100 pt-1.5">{explanation}</p>
        </div>
        {cleanText && <p className="leading-relaxed">{cleanText}</p>}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-96 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-700">Live Transcript</h3>
      </div>
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {items.length === 0 ? (
            <p className="text-gray-400 text-center italic mt-10">Conversation will appear here...</p>
        ) : (
            items.map((item, index) => (
            <div 
                key={`${item.timestamp}-${index}`} 
                className={`flex ${item.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
            >
                <div 
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    item.speaker === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                } ${!item.isComplete ? 'opacity-70' : ''}`}
                >
                {renderMessageContent(item)}
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
};

export default Transcript;

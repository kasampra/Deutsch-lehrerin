import React, { useEffect, useRef } from 'react';
import { TranscriptionItem } from '../types';

interface TranscriptProps {
  items: TranscriptionItem[];
}

const Transcript: React.FC<TranscriptProps> = ({ items }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [items]);

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
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    item.speaker === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                } ${!item.isComplete ? 'opacity-70' : ''}`}
                >
                <p>{item.text}</p>
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
};

export default Transcript;

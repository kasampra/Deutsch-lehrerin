import React, { useState } from 'react';
import { ProviderType } from '../types';

interface ProviderSelectorProps {
  selected: ProviderType;
  onSelect: (provider: ProviderType) => void;
  disabled?: boolean;
}

const ProviderSelector: React.FC<ProviderSelectorProps> = ({ selected, onSelect, disabled }) => {
  const [testing, setTesting] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, 'online' | 'offline' | null>>({});

  const testConnection = async (type: ProviderType) => {
    setTesting(type);
    let url = '';
    if (type === ProviderType.OLLAMA) url = 'http://localhost:11434/api/tags';
    if (type === ProviderType.LM_STUDIO) url = 'http://localhost:1234/v1/models';

    try {
      const res = await fetch(url);
      setStatus(prev => ({ ...prev, [type]: res.ok ? 'online' : 'offline' }));
    } catch (e) {
      setStatus(prev => ({ ...prev, [type]: 'offline' }));
    } finally {
      setTesting(null);
    }
  };

  const providers = [
    { id: ProviderType.GEMINI, name: 'Google Gemini', icon: '☁️', description: 'Cloud-based, high performance' },
    { id: ProviderType.OLLAMA, name: 'Ollama', icon: '🦙', description: 'Local, sovereign AI', testable: true },
    { id: ProviderType.LM_STUDIO, name: 'LM Studio', icon: '💻', description: 'Local GUI engine', testable: true },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {providers.map((provider) => (
        <div key={provider.id} className="relative group">
          <button
            disabled={disabled}
            onClick={() => onSelect(provider.id)}
            className={`
              relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all text-left w-full h-full
              ${selected === provider.id 
                ? 'border-black bg-gray-50' 
                : 'border-gray-100 hover:border-gray-200 bg-white'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span className="text-2xl mb-1">{provider.icon}</span>
            <span className="font-bold text-sm">{provider.name}</span>
            <span className="text-[10px] text-gray-500 text-center mt-1">{provider.description}</span>
            
            {status[provider.id] && (
              <span className={`text-[9px] mt-2 font-bold uppercase tracking-wider ${status[provider.id] === 'online' ? 'text-green-500' : 'text-red-500'}`}>
                {status[provider.id]}
              </span>
            )}

            {selected === provider.id && (
              <div className="absolute top-2 right-2">
                <div className="bg-black rounded-full p-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </button>
          
          {provider.testable && !disabled && (
            <button
              onClick={(e) => { e.stopPropagation(); testConnection(provider.id); }}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white border border-gray-200 text-[9px] px-2 py-0.5 rounded-full shadow-sm hover:bg-gray-50 font-bold text-gray-400 group-hover:text-black transition-colors"
            >
              {testing === provider.id ? 'Testing...' : 'Test Connection'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProviderSelector;

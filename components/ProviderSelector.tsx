import React, { useState, useEffect } from 'react';
import { ProviderType } from '../types';

interface ProviderSelectorProps {
  selected: ProviderType;
  onSelect: (provider: ProviderType) => void;
  disabled?: boolean;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  selected,
  onSelect,
  disabled,
  geminiApiKey,
  setGeminiApiKey,
  selectedModel,
  setSelectedModel,
}) => {
  const [testing, setTesting] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, 'online' | 'offline' | null>>({});
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const testConnection = async (type: ProviderType) => {
    setTesting(type);
    let url = '';
    if (type === ProviderType.OLLAMA) url = 'http://localhost:11434/api/tags';
    if (type === ProviderType.LM_STUDIO) url = 'http://localhost:1234/v1/models';

    try {
      const res = await fetch(url);
      const ok = res.ok;
      setStatus(prev => ({ ...prev, [type]: ok ? 'online' : 'offline' }));
      if (ok && type === selected) {
        loadModels(type);
      }
    } catch (e) {
      setStatus(prev => ({ ...prev, [type]: 'offline' }));
    } finally {
      setTesting(null);
    }
  };

  const loadModels = async (type: ProviderType) => {
    setLoadingModels(true);
    setModels([]);
    try {
      if (type === ProviderType.OLLAMA) {
        const res = await fetch('http://localhost:11434/api/tags');
        if (res.ok) {
          const data = await res.json();
          const list = data.models.map((m: any) => m.name);
          setModels(list);
          if (list.length > 0 && !list.includes(selectedModel)) {
            // Autoselect a good default
            const preferred = list.find((m: string) => m.startsWith('qwen2.5:7b') || m.startsWith('gemma2:9b') || m.startsWith('llama3'));
            setSelectedModel(preferred || list[0]);
          }
        }
      } else if (type === ProviderType.LM_STUDIO) {
        const res = await fetch('http://localhost:1234/v1/models');
        if (res.ok) {
          const data = await res.json();
          const list = data.data.map((m: any) => m.id);
          setModels(list);
          if (list.length > 0 && !list.includes(selectedModel)) {
            setSelectedModel(list[0]);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load models:", e);
    } finally {
      setLoadingModels(false);
    }
  };

  useEffect(() => {
    if (selected === ProviderType.OLLAMA || selected === ProviderType.LM_STUDIO) {
      loadModels(selected);
    }
  }, [selected]);

  const providers = [
    { id: ProviderType.GEMINI, name: 'Google Gemini', icon: '☁️', description: 'Cloud-based, high performance' },
    { id: ProviderType.OLLAMA, name: 'Ollama', icon: '🦙', description: 'Local, sovereign AI', testable: true },
    { id: ProviderType.LM_STUDIO, name: 'LM Studio', icon: '💻', description: 'Local GUI engine', testable: true },
  ];

  return (
    <div className="space-y-4">
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

      {/* Provider-Specific Settings Panel */}
      <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100/80 animate-in fade-in slide-in-from-top-1 duration-200">
        {selected === ProviderType.GEMINI ? (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gemini API Key</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[10px] text-blue-600 hover:underline font-semibold"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="Enter your Gemini API Key..."
              disabled={disabled}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black font-mono transition-all"
            />
            <p className="text-[10px] text-gray-400 leading-tight">
              Leave empty if set in the environment variables. The key is saved locally in your browser/app.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {selected === ProviderType.OLLAMA ? 'Ollama' : 'LM Studio'} Model Selection
              </label>
              <button
                type="button"
                onClick={() => loadModels(selected)}
                disabled={loadingModels || disabled}
                className="text-[10px] text-blue-600 hover:underline font-semibold flex items-center space-x-1"
              >
                {loadingModels ? (
                  <span>Loading...</span>
                ) : (
                  <>
                    <svg className="w-3 h-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3" />
                    </svg>
                    <span>Refresh Models</span>
                  </>
                )}
              </button>
            </div>

            {models.length > 0 ? (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all font-medium"
              >
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  placeholder={selected === ProviderType.OLLAMA ? "e.g., qwen2.5:7b, gemma2:9b" : "e.g., model-identifier"}
                  disabled={disabled}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                />
                <p className="text-[10px] text-red-500 font-semibold leading-tight bg-red-50 border border-red-100 rounded-lg p-2">
                  Unable to fetch model lists. Ensure {selected === ProviderType.OLLAMA ? 'Ollama (localhost:11434)' : 'LM Studio (localhost:1234)'} is running, or type the model name manually.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderSelector;

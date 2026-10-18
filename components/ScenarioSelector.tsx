import React, { useState } from 'react';
import { SCENARIOS, Scenario } from '../constants/scenarios';

interface ScenarioSelectorProps {
  selected: Scenario;
  onSelect: (scenario: Scenario) => void;
  disabled?: boolean;
}

const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({ selected, onSelect, disabled = false }) => {
  const [showVocab, setShowVocab] = useState(false);

  const getDifficultyColor = (diff: Scenario['difficulty']) => {
    switch (diff) {
      case 'A1': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'A2': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'B1': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'B2': return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Scenario Lab</h2>
          <p className="text-xs text-gray-500">Pick a real-world German situation to practice</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getDifficultyColor(selected.difficulty)}`}>
          Level {selected.difficulty}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {SCENARIOS.map((sc) => {
          const isSelected = selected.id === sc.id;
          return (
            <button
              key={sc.id}
              disabled={disabled}
              onClick={() => onSelect(sc)}
              className={`
                p-3 rounded-2xl text-left transition-all border flex flex-col justify-between h-28 relative
                ${isSelected 
                  ? 'border-black bg-black text-white shadow-md scale-[1.02]' 
                  : 'border-gray-100 bg-gray-50/70 hover:bg-gray-100/80 text-gray-800 hover:border-gray-200'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-2xl">{sc.icon}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-white text-gray-600 border border-gray-100'
                }`}>
                  {sc.difficulty}
                </span>
              </div>
              <div>
                <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                  {sc.title}
                </p>
                <p className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                  {sc.category}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Scenario Details Card */}
      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-gray-800 flex items-center gap-1.5">
            <span>🎯</span>
            <span>Ziel: {selected.goal}</span>
          </p>
          <button
            type="button"
            onClick={() => setShowVocab(prev => !prev)}
            className="text-[11px] font-bold text-blue-600 hover:underline"
          >
            {showVocab ? 'Hide Vocab' : `Key Vocab (${selected.keyVocabulary.length})`}
          </button>
        </div>
        <p className="text-gray-600 leading-relaxed text-[11px]">{selected.description}</p>

        {showVocab && (
          <div className="pt-2 border-t border-gray-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in duration-200">
            {selected.keyVocabulary.map((v, i) => (
              <div key={i} className="bg-white p-2 rounded-xl border border-gray-100 shadow-2xs">
                <p className="font-bold text-gray-900 text-[11px]">{v.de}</p>
                <p className="text-gray-400 text-[10px]">{v.en}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScenarioSelector;

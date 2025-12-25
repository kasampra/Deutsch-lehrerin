import React from 'react';
import { Language, LanguageConfig } from '../types';

interface LanguageSelectorProps {
  selected: LanguageConfig;
  onSelect: (config: LanguageConfig) => void;
  disabled?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selected, onSelect, disabled = false }) => {
  const languages: LanguageConfig[] = [
    {
      code: Language.GERMAN,
      name: 'German',
      flag: '🇩🇪',
      teacherName: 'Frau Müller',
      systemInstruction: '', // Will be filled from constants
      voiceName: '', // Will be filled from constants
      primaryColor: '#EF4444',
      secondaryColor: '#FBBF24',
    },
    {
      code: Language.ENGLISH,
      name: 'English',
      flag: '🇬🇧',
      teacherName: 'Mr. Williams',
      systemInstruction: '', // Will be filled from constants
      voiceName: '', // Will be filled from constants
      primaryColor: '#3B82F6',
      secondaryColor: '#8B5CF6',
    },
  ];

  return (
    <div className="flex gap-4 justify-center">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => onSelect(lang)}
          disabled={disabled}
          className={`
            relative flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition-all
            ${selected.code === lang.code 
              ? 'border-black bg-gray-900 text-white shadow-lg scale-105' 
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-md'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span className="text-4xl">{lang.flag}</span>
          <span className="font-bold text-lg">{lang.name}</span>
          <span className="text-sm opacity-75">with {lang.teacherName}</span>
          {selected.code === lang.code && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;

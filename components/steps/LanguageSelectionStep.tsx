




import React from 'react';
import LanguageSelector from '../LanguageSelector';
import { Language, UIText } from '../../types';

interface LanguageSelectionStepProps {
  selectedLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
  uiText: UIText['languageStep'];
  onNext: () => void;
  onQuickStart: () => void;
  onHostAdmin: () => void;
}

const LanguageSelectionStep: React.FC<LanguageSelectionStepProps> = ({
  selectedLanguage,
  onSelectLanguage,
  uiText,
  onNext,
  onQuickStart,
  onHostAdmin
}) => {
  return (
    <div className="w-full max-w-md bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-8 shadow-2xl backdrop-blur-sm animate-fade-in relative">
        <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-white">{uiText.title}</h2>
            <p className="text-slate-400 text-sm">{uiText.subtitle}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm">
          <LanguageSelector 
              selectedLanguage={selectedLanguage} 
              onSelect={onSelectLanguage} 
              disabled={false} 
              label={uiText.yourLanguageLabel}
          />
        </div>
        <div className="flex space-x-3">
             <button
                onClick={onQuickStart}
                className="flex-[0.4] py-3 px-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center shadow-lg shadow-green-900/30 group"
                title="Start immediately with defaults"
            >
                <div className="flex items-center space-x-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-bold uppercase hidden sm:inline">Start</span>
                </div>
            </button>
            <button
                onClick={onNext}
                className="flex-1 py-3 px-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-cyan-900/30"
            >
                <span>{uiText.nextButton}</span>
            </button>
        </div>

        {/* Host Admin Link */}
        <div className="text-center pt-2">
            <button 
                onClick={onHostAdmin}
                className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors uppercase font-bold tracking-widest"
            >
                Meeting Host
            </button>
        </div>
    </div>
  );
};

export default LanguageSelectionStep;
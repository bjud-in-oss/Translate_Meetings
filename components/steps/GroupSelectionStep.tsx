
import React from 'react';
import { UIText } from '../../types';

interface GroupSelectionStepProps {
  isGroupMode: boolean; // false = Small, true = Large
  onToggle: () => void;
  uiText: UIText['groupStep'];
  onNext: () => void;
  onBack: () => void;
  onQuickStart: () => void;
}

const GroupSelectionStep: React.FC<GroupSelectionStepProps> = ({
  isGroupMode,
  onToggle,
  uiText,
  onNext,
  onBack,
  onQuickStart
}) => {
  return (
    <div className="w-full max-w-3xl bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-6 shadow-2xl backdrop-blur-sm animate-fade-in flex flex-col max-h-[80vh] overflow-hidden">
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-6">
            <div className="space-y-2 text-center shrink-0">
                <h2 className="text-2xl font-bold text-white">{uiText.title}</h2>
                <p className="text-slate-400 text-sm">{uiText.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    onClick={() => { 
                        if (isGroupMode) onToggle(); // Switch to Small if currently Large
                        onNext();
                    }}
                    className={`p-6 rounded-xl border-2 text-center transition-all relative overflow-hidden flex flex-col items-center gap-4 group ${
                        !isGroupMode 
                        ? 'border-cyan-500 bg-cyan-900/20 shadow-lg shadow-cyan-900/20' 
                        : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                    }`}
                >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${!isGroupMode ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-400 group-hover:text-slate-200'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg mb-1">{uiText.smallTitle}</h3>
                        <p className="text-xs text-slate-400">{uiText.smallDesc}</p>
                        <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                            {uiText.smallDetail}
                        </p>
                    </div>
                </button>

                <button
                    onClick={() => { 
                        if (!isGroupMode) onToggle(); // Switch to Large if currently Small
                        onNext(); 
                    }}
                    className={`p-6 rounded-xl border-2 text-center transition-all relative overflow-hidden flex flex-col items-center gap-4 group ${
                        isGroupMode 
                        ? 'border-green-500 bg-green-900/20 shadow-lg shadow-green-900/20' 
                        : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                    }`}
                >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${isGroupMode ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-400 group-hover:text-slate-200'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg mb-1">{uiText.largeTitle}</h3>
                        <p className="text-xs text-slate-400">{uiText.largeDesc}</p>
                        <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                            {uiText.largeDetail}
                        </p>
                    </div>
                </button>
            </div>
        </div>

        <div className="flex space-x-3 pt-4 shrink-0 border-t border-slate-700/50 mt-2">
            <button
                onClick={onBack}
                className="flex-[0.3] py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
                {uiText.backButton}
            </button>
            
            <button
                onClick={onQuickStart}
                className="flex-[0.3] py-3 px-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center shadow-lg shadow-green-900/30 group"
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
                className="flex-1 py-3 px-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-cyan-900/30"
            >
                {uiText.nextButton}
            </button>
        </div>
    </div>
  );
};

export default GroupSelectionStep;
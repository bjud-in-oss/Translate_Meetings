
import React, { useState } from 'react';
import { TranslationMode, UIText } from '../../types';

interface TranslationModeStepProps {
  selectedMode: TranslationMode;
  onSelectMode: (mode: TranslationMode) => void;
  uiText: UIText['modeStep'];
  onNext: () => void;
  onBack: () => void;
  onQuickStart: () => void;
}

const TranslationModeStep: React.FC<TranslationModeStepProps> = ({
  selectedMode,
  onSelectMode,
  uiText,
  onNext,
  onBack,
  onQuickStart
}) => {
  
  // Helper to resolve dynamic subtitle
  const subtitle = uiText.subtitleTemplate?.replace('{{lang}}', 'Target Language') || uiText.subtitleTemplate;

  // Determine which category is active for highlighting (optional, primarily driven by sub-buttons now)
  const isConversational = selectedMode === TranslationMode.SEQUENTIAL || selectedMode === TranslationMode.FLUID || selectedMode === TranslationMode.PRESENTATION;
  const isSimultaneous = selectedMode === TranslationMode.SIMULTANEOUS;

  return (
    <div className="w-full max-w-4xl bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-6 shadow-2xl backdrop-blur-sm animate-fade-in flex flex-col max-h-[80vh] overflow-hidden">
        <div className="space-y-2 text-center shrink-0">
            <h2 className="text-2xl font-bold text-white">{uiText.title}</h2>
            <p className="text-slate-400 text-sm">{subtitle}</p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-hide">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* CATEGORY 2: SIMULTANEOUS (Pratar samtidigt) - NOW FIRST */}
                <div 
                    className={`relative p-6 rounded-2xl border transition-all flex flex-col items-center text-center space-y-4 ${
                        isSimultaneous
                        ? 'border-pink-500/50 bg-slate-800/80 shadow-lg shadow-pink-900/10' 
                        : 'border-slate-700 bg-slate-800/50 opacity-80 hover:opacity-100'
                    }`}
                >
                    {/* Visual: Whispering / Headphones */}
                    <div className="w-full h-32 bg-slate-900/50 rounded-xl flex items-center justify-center relative overflow-hidden">
                         <div className="flex items-center justify-center space-x-6">
                             {/* User */}
                             <div className="relative">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                 </svg>
                                 {/* Headphones ON Ears (Centered on Head) */}
                                 <div className="absolute top-[2px] left-1/2 -translate-x-1/2">
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-pink-400 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                                         <path d="M12 2C6.48 2 2 6.48 2 12v6c0 1.1.9 2 2 2h4v-8H4v-6c0-4.42 3.58-8 8-8s8 3.58 8 8v6h-4v8h4c1.1 0 2-.9 2-2v-6c0-5.52-4.48-10-10-10z"/>
                                     </svg>
                                 </div>
                             </div>
                         </div>
                         <div className="absolute bottom-2 left-0 right-0 text-center">
                            <span className="text-[10px] uppercase font-bold text-pink-500">Whispering...</span>
                         </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">{uiText.categorySimultaneousTitle}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">{uiText.categorySimultaneousDesc}</p>
                    </div>

                    {/* Sub-options: Always visible */}
                    <div className="w-full mt-4 pt-4 border-t border-slate-700/50 flex justify-center">
                            <button 
                            onClick={() => onSelectMode(TranslationMode.SIMULTANEOUS)}
                            className={`w-full p-3 rounded-lg border text-center transition-colors flex flex-col items-center justify-center ${selectedMode === TranslationMode.SIMULTANEOUS ? 'bg-pink-600 border-pink-400 text-white shadow-md' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.536 8.464a5 5 0 000 7.072m-2.828-9.9a9 9 0 000 12.728M12 12h.01" />
                                </svg>
                                <span className="text-[10px] font-bold block">{uiText.subOptionAudio}</span>
                            </button>
                    </div>
                </div>

                {/* CATEGORY 1: CONVERSATIONAL (Turas om) - NOW SECOND */}
                <div 
                    className={`relative p-6 rounded-2xl border transition-all flex flex-col items-center text-center space-y-4 ${
                        isConversational
                        ? 'border-cyan-500/50 bg-slate-800/80 shadow-lg shadow-cyan-900/10' 
                        : 'border-slate-700 bg-slate-800/50 opacity-80 hover:opacity-100'
                    }`}
                >
                    {/* Visual: Two people talking */}
                    <div className="w-full h-32 bg-slate-900/50 rounded-xl flex items-center justify-center relative overflow-hidden">
                         <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                             <svg className="w-full h-full text-cyan-500" viewBox="0 0 100 100" fill="none">
                                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="animate-spin-slow" />
                             </svg>
                         </div>
                         <div className="flex items-end space-x-4">
                             <div className="flex flex-col items-center">
                                 <div className="bg-white/10 p-2 rounded-t-lg mb-1 animate-pulse">
                                     <div className="w-6 h-4 bg-cyan-400/50 rounded-full"></div>
                                 </div>
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                 </svg>
                                 <span className="text-[10px] uppercase font-bold text-slate-500 mt-1">You</span>
                             </div>
                             <div className="flex flex-col items-center">
                                 <div className="bg-white/10 p-2 rounded-t-lg mb-1 delay-700 animate-pulse">
                                     <div className="w-6 h-4 bg-green-400/50 rounded-full"></div>
                                 </div>
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                 </svg>
                                 <span className="text-[10px] uppercase font-bold text-cyan-600 mt-1">Interpreter</span>
                             </div>
                         </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">{uiText.categoryConversationalTitle}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">{uiText.categoryConversationalDesc}</p>
                    </div>

                    {/* Sub-options: Always visible */}
                    <div className="w-full grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-700/50">
                            <button 
                            onClick={() => onSelectMode(TranslationMode.SEQUENTIAL)}
                            className={`p-2 rounded-lg border text-center transition-colors ${selectedMode === TranslationMode.SEQUENTIAL ? 'bg-cyan-600 border-cyan-400 text-white shadow-md' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'}`}
                            >
                                <div className="text-lg mb-1">💬</div>
                                <span className="text-[10px] font-bold block">{uiText.subOptionSequential}</span>
                            </button>
                            <button 
                            onClick={() => onSelectMode(TranslationMode.FLUID)}
                            className={`p-2 rounded-lg border text-center transition-colors ${selectedMode === TranslationMode.FLUID ? 'bg-purple-600 border-purple-400 text-white shadow-md' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'}`}
                            >
                                <div className="text-lg mb-1">⚡</div>
                                <span className="text-[10px] font-bold block">{uiText.subOptionFluid}</span>
                            </button>
                            <button 
                            onClick={() => onSelectMode(TranslationMode.PRESENTATION)}
                            className={`p-2 rounded-lg border text-center transition-colors ${selectedMode === TranslationMode.PRESENTATION ? 'bg-green-600 border-green-400 text-white shadow-md' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'}`}
                            >
                                <div className="text-lg mb-1">🎤</div>
                                <span className="text-[10px] font-bold block">{uiText.subOptionPresentation}</span>
                            </button>
                    </div>
                </div>

            </div>
        </div>

        <div className="flex space-x-3 pt-4 shrink-0">
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

export default TranslationModeStep;

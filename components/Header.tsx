
import React from 'react';

interface HeaderProps {
  isConnected: boolean;
  statusText?: string;
  isAiSpeaking?: boolean;
  analyser?: AnalyserNode | null;
  onOpenSpecs?: () => void;
  onToggleDebug?: () => void;
  showDebug?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  isConnected, 
  onOpenSpecs
}) => {
  return (
    <header className="bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center shrink-0 z-10 h-16">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
        </div>
        <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight leading-none">MeetingBridge <span className="font-light text-cyan-400">Live</span></h1>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {/* EDIT BUTTON (Always Visible) */}
        <button 
            onClick={onOpenSpecs}
            className="p-2 rounded-full transition-colors border border-transparent text-slate-400 hover:text-white hover:bg-slate-700"
            title="Edit Plan & Specs"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;

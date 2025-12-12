
import React from 'react';

interface TranslationOverlayProps {
  isVisible: boolean;
  message: string;
}

const TranslationOverlay: React.FC<TranslationOverlayProps> = ({ isVisible, message }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/90 backdrop-blur-md animate-fade-in">
        <div className="flex flex-col items-center space-y-6">
            <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
                <div className="absolute inset-0 rounded-full border-t-4 border-cyan-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                </div>
            </div>
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white tracking-widest uppercase animate-pulse">
                    {message}
                </h2>
                <p className="text-slate-400 text-sm">Optimizing interface language...</p>
            </div>
        </div>
    </div>
  );
};

export default TranslationOverlay;

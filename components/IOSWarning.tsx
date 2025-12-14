
import React, { useState, useEffect } from 'react';

const IOSWarning: React.FC = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Simple iOS detection
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setIsIOS(true);
    }
  }, []);

  if (!isIOS || !isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-600/90 text-white px-4 py-3 shadow-lg backdrop-blur-sm flex items-center justify-between animate-fade-in">
      <div className="flex items-center gap-3">
        <span className="text-xl">⚠️</span>
        <div className="flex flex-col">
            <span className="text-sm font-bold">iOS Device Detected</span>
            <span className="text-xs opacity-90">Audio playback may crackle over time on Safari. If this happens, please reload.</span>
        </div>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        className="p-2 hover:bg-black/20 rounded-full transition-colors"
      >
        ✕
      </button>
    </div>
  );
};

export default IOSWarning;

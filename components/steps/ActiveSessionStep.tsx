
import React from 'react';
import { Language, TranslationMode, UIText } from '../../types';
import SimultaneousDashboard from '../SimultaneousDashboard';

interface ActiveSessionStepProps {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  selectedMode: TranslationMode;
  isAiSpeaking: boolean;
  isPaused: boolean; 
  togglePause: () => void;
  isGroupMode: boolean; 
  toggleGroupMode: () => void; 
  isTriggerActive: boolean;
  
  // New props for Input Mute and Mutex
  isInputMuted?: boolean;
  toggleInputMute?: () => void;
  mutexState?: 'OPEN' | 'LOCKED';
  mutexOwner?: string;

  analyser: AnalyserNode | null;
  dashboardState: any; 
  systemLag: number;
  bufferLagFrames: number;
  sidecarTranscript: string;
  polishedSegments: Array<{id: number, text: string, isSolemn: boolean}>;
  lastBurstSize: number; 
  inspectorMessage: string;
  aiEfficiency: number; 
  totalLag: number;
  lagTrend: 'STABLE' | 'RISING' | 'FALLING';
  uiText: UIText['sessionStep'];
  onEndSession: () => void;
  
  // New Prop for Debug Toggle
  showDebug?: boolean;
}

const ActiveSessionStep: React.FC<ActiveSessionStepProps> = ({
  selectedLanguage,
  onLanguageChange,
  selectedMode,
  isAiSpeaking,
  isPaused,
  togglePause,
  isGroupMode,
  toggleGroupMode,
  isInputMuted,
  toggleInputMute,
  dashboardState,
  lastBurstSize,
  inspectorMessage,
  aiEfficiency,
  totalLag,
  lagTrend,
  onEndSession,
  showDebug,
  analyser
}) => {
  
  // Performance & Normalization Logic:
  // 1. Group Mode "Large" uses Hardware AGC, which usually compresses the signal -> Low RMS.
  //    We need to BOOST the visual sensitivity so the circle moves visibly.
  // 2. Group Mode "Small" uses Digital Pre-Amp -> High RMS.
  //    We need to DAMPEN the visual sensitivity so it doesn't explode.
  const visualSensitivity = isGroupMode ? 3.5 : 1.0; 
  
  // Apply scaling transform via CSS for max performance (no layout thrashing).
  // We clamp the scale to keep it aesthetic (1.0 to 1.4).
  const scale = 1 + Math.min(dashboardState.rms * visualSensitivity, 0.4);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
        
        {/* Minimalist Card Container */}
        <div className="w-full max-w-md bg-slate-800/50 border border-slate-700 rounded-2xl p-8 shadow-2xl backdrop-blur-sm flex flex-col items-center space-y-8 animate-fade-in relative">
            
            {/* 1. LANGUAGE SELECTOR (Top) */}
            <div className="w-full">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block text-center mb-2">Target Language</label>
                <div className="relative">
                    <select 
                        value={selectedLanguage}
                        onChange={(e) => onLanguageChange(e.target.value as Language)}
                        className="w-full bg-slate-900 border border-slate-600 text-white text-center font-bold text-lg rounded-lg py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
                    >
                        {Object.values(Language).map((lang) => (
                            <option key={lang} value={lang}>
                                {lang}
                            </option>
                        ))}
                    </select>
                    {/* Custom Arrow Center */}
                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>

            {/* 2. THE CIRCLE (Visualizer & Action) */}
            {selectedMode === TranslationMode.SIMULTANEOUS && showDebug ? (
                // Debug View (Original Dashboard)
                <div className="scale-75 -my-8">
                    <SimultaneousDashboard 
                        rms={dashboardState.rms}
                        vadProb={dashboardState.vadProb}
                        isGated={dashboardState.isGated}
                        bufferSize={dashboardState.bufferSize}
                        outputQueueSize={dashboardState.outputQueueSize}
                        trafficLight={dashboardState.trafficLight}
                        isUploading={dashboardState.isUploading}
                        lastBurstSize={lastBurstSize}
                        inspectorMessage={inspectorMessage}
                        aiEfficiency={aiEfficiency}
                        totalLag={totalLag}
                        lagTrend={lagTrend}
                        onTogglePause={togglePause}
                        analyser={analyser} // Pass Analyser
                    />
                </div>
            ) : (
                // Minimalist View (Whole Object Scaling)
                <div className="relative flex items-center justify-center">
                    
                    {/* THE BREATHING CIRCLE (Toggles Group Mode) */}
                    <button
                        onClick={toggleGroupMode}
                        title={isGroupMode ? "Large Group (AGC On)" : "Small Group (Boost On)"}
                        className={`relative w-32 h-32 rounded-full flex items-center justify-center outline-none will-change-transform transition-colors duration-300 border-4 ${
                            isGroupMode 
                            ? 'bg-slate-900 border-green-500/30 hover:border-green-500/50' 
                            : 'bg-slate-900 border-cyan-500/30 hover:border-cyan-500/50'
                        } ${isPaused ? 'opacity-50' : 'opacity-100'}`}
                        style={{
                            // Hardware accelerated scaling
                            transform: !isPaused ? `scale(${scale})` : 'scale(1)',
                            transition: 'transform 75ms ease-out'
                        }}
                    >
                        {/* Inner content scales with parent, effectively keeping icon centered and breathing */}
                        <div 
                            className="relative z-20 p-4 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent toggling Group Mode when clicking Icon
                                if (toggleInputMute) toggleInputMute();
                            }}
                        >
                            {/* CLASSIC SPEAKER ICON (Replaces Microphone) */}
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 ${isInputMuted ? 'text-slate-600' : (isAiSpeaking ? 'text-green-400' : 'text-slate-200')}`} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                                <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                            </svg>

                            {/* RED SLASH (Mute Indicator) */}
                            {isInputMuted && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <svg className="h-12 w-12 text-red-500 drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </button>
                    
                    {/* Status Label (Below Circle) */}
                    <div className="absolute -bottom-8 text-[10px] font-bold tracking-widest text-slate-500 uppercase pointer-events-none flex flex-col items-center gap-1">
                        {isPaused ? (
                            <span className="text-slate-500">PAUSED</span>
                        ) : (
                            <>
                                {isAiSpeaking && <span className="text-green-400 animate-pulse mb-1">SPEAKING</span>}
                                <span>{isInputMuted ? 'MUTED' : (isGroupMode ? 'LARGE GROUP' : 'SMALL GROUP')}</span>
                            </>
                        )}
                    </div>

                </div>
            )}

            {/* 3. END BUTTON (Bottom) */}
            <button
                onClick={onEndSession}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-red-900/30 active:scale-95 flex items-center justify-center gap-2"
            >
                <div className="w-2 h-2 bg-white rounded-full"></div>
                End
            </button>

            {/* 4. MODE DISPLAY (Footer) */}
            <div className="text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Mode</span>
                <p className="text-xs text-slate-400 capitalize mt-0.5">{selectedMode}</p>
            </div>

        </div>
    </div>
  );
};

export default ActiveSessionStep;

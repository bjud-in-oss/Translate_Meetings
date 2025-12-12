
import React, { useState, useEffect, useRef } from 'react';
import { Language, TranslationMode, TranslationTempo, UIText } from './types';
import Header from './components/Header';
import SimultaneousDashboard from './components/SimultaneousDashboard';
import MicrophoneSelector from './components/MicrophoneSelector';
import SpeakerSelector from './components/SpeakerSelector';
import SpecEditor from './components/SpecEditor';
import TranslationOverlay from './components/TranslationOverlay';
import TranscriptView from './components/TranscriptView';
import { useAudioSession } from './hooks/useAudioSession';
import { DEFAULT_UI_TEXT } from './constants/uiConstants';
import { uiTranslationService } from './services/uiTranslationService';
import { getLanguageFromBrowser } from './utils/languageUtils';
import { gatewayService, GatewayStatus } from './services/gatewayService';

const App: React.FC = () => {
  // --- State ---
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(Language.ENGLISH);
  const [selectedMode, setSelectedMode] = useState<TranslationMode>(TranslationMode.SIMULTANEOUS);
  const [selectedTempo, setSelectedTempo] = useState<TranslationTempo>('standard');
  const [selectedMicId, setSelectedMicId] = useState<string>('default');
  const [selectedTriggerMicId, setSelectedTriggerMicId] = useState<string>(''); 
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>('default');
  
  // UI Logic
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  
  const [uiText, setUiText] = useState<UIText>(DEFAULT_UI_TEXT);
  const [isTranslatingUI, setIsTranslatingUI] = useState(false);
  
  // Debug & Spec Editor State
  const [isSpecEditorOpen, setIsSpecEditorOpen] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus>('DISCONNECTED');

  const {
      connectionState,
      isAiSpeaking,
      isPaused,
      togglePause,
      isInputMuted,
      toggleInputMute,
      startSession,
      endSession,
      setLanguage,
      audioOutputElRef,
      analyserRef,
      dashboardState,
      lastBurstSize,
      inspectorMessage,
      aiEfficiency,
      totalLag,
      lagTrend,
      liveTranscript
  } = useAudioSession();

  const isLive = connectionState === 'CONNECTED' || connectionState === 'RECONNECTING';
  
  // Visualizer sensitivity logic
  const visualSensitivity = 3.5; 
  const scale = 1 + Math.min(dashboardState.rms * visualSensitivity, 0.3);

  // --- Effects ---

  useEffect(() => {
      const unsub = gatewayService.onStatusChange(setGatewayStatus);
      return unsub;
  }, []);

  useEffect(() => {
     const initBrowserLang = async () => {
         const detectedLang = getLanguageFromBrowser();
         if (detectedLang && detectedLang !== Language.ENGLISH) {
             setIsTranslatingUI(true);
             try {
                const translated = await uiTranslationService.translateUI(detectedLang, DEFAULT_UI_TEXT);
                setUiText(translated);
             } catch(e) {
                 console.warn("Auto-translate UI failed", e);
             } finally {
                 setIsTranslatingUI(false);
             }
         }
     };
     initBrowserLang();
  }, []);

  // --- Handlers ---

  const handleLanguageSelect = async (lang: Language) => {
      setSelectedLanguage(lang);
      if (isLive) {
          setLanguage(lang);
      }
  };

  const handleModeSelect = async (mode: TranslationMode) => {
      setSelectedMode(mode);
      // Hot Swap: If live, restart session immediately with new mode
      if (isLive) {
          await startSession(
              selectedLanguage,
              mode,
              selectedTempo,
              selectedMicId,
              selectedTriggerMicId,
              selectedSpeakerId,
              showTranscription // Pass current transcription state
          );
      }
  };

  const handleToggleLive = async () => {
      if (isLive) {
          // Go to Smart Standby (Mute)
          await endSession(false); // false = SLEEP (Standby)
          // Do not auto-collapse configs, let user control it
      } else {
          // Go Live (Unmute)
          await startSession(
              selectedLanguage, 
              selectedMode, 
              selectedTempo,
              selectedMicId,    
              selectedTriggerMicId, 
              selectedSpeakerId,
              showTranscription // Pass current transcription state
          );
      }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      <audio ref={audioOutputElRef} className="hidden" />
      <TranslationOverlay isVisible={isTranslatingUI} message={uiText.loadingOverlay.translating} />

      <Header 
          isConnected={isLive || connectionState === 'SLEEP'} 
          isAiSpeaking={isAiSpeaking}
          analyser={analyserRef.current}
          onOpenSpecs={() => setIsSpecEditorOpen(true)}
      />

      {/* MAIN CONTENT - Scrollable */}
      <main className="flex-1 flex flex-col p-4 pb-32 relative overflow-y-auto scrollbar-hide items-center w-full max-w-3xl mx-auto">
        
        {/* Background Glow */}
        <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none transition-all duration-1000 ${isLive ? 'bg-cyan-900/20' : 'bg-slate-800/10'}`}></div>

        {/* 1. TOP: YOUR LANGUAGE */}
        <div className="w-full mb-6 shrink-0 z-10">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block text-center mb-2">{uiText.dashboard.yourLanguageLabel}</label>
            <div className="relative">
                <select 
                    value={selectedLanguage}
                    onChange={(e) => handleLanguageSelect(e.target.value as Language)}
                    className="w-full bg-slate-800/80 border border-slate-600 text-white text-center font-bold text-lg rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none cursor-pointer hover:bg-slate-700 transition-colors shadow-lg"
                >
                    {Object.values(Language).map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
            </div>
        </div>

        {/* 2. TRANSLATION MODE */}
        <div className="w-full mb-6 shrink-0 z-10">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block text-center mb-2">{uiText.dashboard.modeLabel}</label>
            <div className="flex justify-center gap-3">
                <button
                    onClick={() => handleModeSelect(TranslationMode.SIMULTANEOUS)}
                    className={`flex-1 py-4 px-2 rounded-xl font-bold transition-all shadow-lg text-lg ${selectedMode === TranslationMode.SIMULTANEOUS ? 'bg-slate-700 text-white border border-slate-600' : 'bg-slate-800/50 text-slate-400 border border-transparent hover:bg-slate-800'}`}
                >
                    {uiText.dashboard.modeSimultaneous}
                </button>
                <button
                    onClick={() => handleModeSelect(TranslationMode.SEQUENTIAL)}
                    className={`flex-1 py-4 px-2 rounded-xl font-bold transition-all shadow-lg text-lg ${selectedMode === TranslationMode.SEQUENTIAL ? 'bg-slate-700 text-white border border-slate-600' : 'bg-slate-800/50 text-slate-400 border border-transparent hover:bg-slate-800'}`}
                >
                    {uiText.dashboard.modeTakeTurns}
                </button>
            </div>
        </div>

        {/* GATEWAY STATUS TEXT (Hidden if Disconnected to avoid clutter unless debug is on, but explicitly shown in metrics below) */}
        {gatewayStatus !== 'DISCONNECTED' && (
            <div className={`text-xs font-bold font-mono tracking-wider mb-4 animate-pulse ${gatewayStatus === 'CONNECTED' ? 'text-green-500' : 'text-red-500'}`}>
                {gatewayStatus === 'CONNECTED' ? 'GATEWAY: CONNECTED' : 'GATEWAY: DISCONNECTED / ERROR'}
            </div>
        )}

        {/* TRANSCRIPT VIEW (Visible if toggled) */}
        {/* Only show when LIVE, otherwise it might look empty and confusing */}
        {showTranscription && isLive && (
            <div className="w-full mb-6 z-10 bg-slate-900/50 border border-slate-700 rounded-xl h-64 shadow-inner overflow-hidden animate-fade-in flex flex-col">
                <TranscriptView items={liveTranscript} />
            </div>
        )}

        {/* 3. DETAILS ACCORDION */}
        <div className="w-full z-10 mb-4 animate-fade-in">
            <button 
                onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                className="w-full flex items-center justify-center relative bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 hover:bg-slate-800 transition-colors group"
            >
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-white">Details</span>
                <div className="absolute right-4">
                    <svg 
                        className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isDetailsExpanded ? 'rotate-180' : ''}`} 
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isDetailsExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {/* Content Container - Grayed out when LIVE */}
                <div className="bg-slate-800/30 border-x border-b border-slate-700 rounded-b-xl p-6 shadow-inner backdrop-blur-sm space-y-6 mt-1">
                    
                    {/* Inner Configs (Grayed out if live) */}
                    <div className={`space-y-6 transition-opacity duration-300 ${isLive ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                        {/* Tempo Toggle */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">{uiText.dashboard.tempoLabel}</label>
                            <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
                                {(['standard', 'fast', 'presentation'] as TranslationTempo[]).map(tempo => (
                                    <button
                                        key={tempo}
                                        onClick={() => setSelectedTempo(tempo)}
                                        className={`py-2 rounded-md text-[10px] font-bold transition-all capitalize ${selectedTempo === tempo ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        {tempo}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Audio Config */}
                        <div className="space-y-3 pt-2 border-t border-slate-700/50">
                            <MicrophoneSelector selectedDeviceId={selectedMicId} onSelect={setSelectedMicId} disabled={false} label={uiText.dashboard.micLabel} />
                            {(selectedMode === TranslationMode.SIMULTANEOUS || selectedTempo === 'fast') && (
                                <MicrophoneSelector selectedDeviceId={selectedTriggerMicId} onSelect={setSelectedTriggerMicId} disabled={false} optional={true} label={uiText.dashboard.triggerLabel} />
                            )}
                            <SpeakerSelector selectedDeviceId={selectedSpeakerId} onSelect={setSelectedSpeakerId} disabled={false} label={uiText.dashboard.speakerLabel} />
                        </div>
                    </div>

                    {/* View Toggles (Always Active) */}
                    <div className="pt-2 border-t border-slate-700/50 space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={showTranscription} 
                                onChange={(e) => setShowTranscription(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-600 focus:ring-cyan-500" 
                            />
                            <span className="text-xs text-slate-400 font-bold">{uiText.dashboard.textModeLabel}</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={showMetrics} 
                                onChange={(e) => setShowMetrics(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-600 focus:ring-cyan-500" 
                            />
                            <span className="text-xs text-slate-400 font-bold">Show System Metrics</span>
                        </label>
                    </div>
                    
                </div>
            </div>
        </div>

        {/* 4. SYSTEM METRICS (Merged Debug View) */}
        {showMetrics && (
            <div className="w-full z-10 mb-6 animate-fade-in">
                <div className="w-full flex items-center justify-center bg-slate-800/50 border border-slate-700 rounded-t-xl px-4 py-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">System metrics</span>
                </div>

                <div className="bg-slate-800/30 border-x border-b border-slate-700 rounded-b-xl p-4 shadow-inner backdrop-blur-sm space-y-4">
                    
                    {/* VISUALIZER */}
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
                    />

                    {/* THE MATRIX (Merged, No Header) */}
                    <div className="w-full bg-black/80 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-y-auto max-h-64 shadow-inner">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-slate-400">
                            <div className="flex justify-between"><span>Connection:</span> <span className="text-white">{connectionState}</span></div>
                            
                            <div className="flex justify-between"><span>Gateway:</span> <span className={gatewayStatus === 'CONNECTED' ? 'text-green-500' : 'text-red-500'}>{gatewayStatus}</span></div>

                            <div className="flex justify-between"><span>RMS (Vol):</span> <span className="text-white">{dashboardState.rms.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>VAD Prob:</span> <span className="text-white">{dashboardState.vadProb.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Input Buffer:</span> <span className="text-white">{dashboardState.bufferSize} chunks</span></div>
                            <div className="flex justify-between"><span>Output Queue:</span> <span className="text-white">{dashboardState.outputQueueSize.toFixed(2)}s</span></div>
                            <div className="flex justify-between"><span>Total Lag:</span> <span className={`font-bold ${totalLag > 5 ? 'text-red-500' : 'text-green-500'}`}>{totalLag.toFixed(2)}s</span></div>
                            <div className="flex justify-between"><span>Burst Size:</span> <span className="text-white">{lastBurstSize}</span></div>
                            <div className="flex justify-between"><span>AI Efficiency:</span> <span className="text-white">{aiEfficiency.toFixed(2)}%</span></div>
                            <div className="flex justify-between"><span>Status Msg:</span> <span className="text-cyan-300">{inspectorMessage}</span></div>
                            
                            {gatewayStatus !== 'CONNECTED' && (
                                <div className="col-span-2 text-red-500 font-bold text-center border-t border-slate-700 pt-2 mt-1 animate-pulse">
                                    ⚠️ GATEWAY DISCONNECTED - CHECK SERVER
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

      </main>

      {/* FOOTER - FIXED BOTTOM */}
      <footer className="fixed bottom-0 w-full p-6 pb-8 bg-gradient-to-t from-slate-950 via-slate-900/95 to-transparent z-50 flex flex-col items-center justify-end pointer-events-none">
          <div className="pointer-events-auto flex flex-col items-center gap-2">
                {/* THE ROUND BUTTON */}
                <button
                    onClick={handleToggleLive}
                    title={isLive ? "Mute (Standby)" : "Go Live"}
                    className={`relative w-24 h-24 rounded-full flex items-center justify-center outline-none will-change-transform transition-all duration-300 border-4 shadow-2xl ${
                        isLive 
                        ? 'bg-slate-900 border-cyan-500/50 shadow-cyan-500/20' 
                        : 'bg-slate-800 border-slate-600 hover:border-slate-400 shadow-black/50 hover:scale-105'
                    }`}
                    style={{
                        transform: isLive ? `scale(${scale})` : 'scale(1)',
                    }}
                >
                    {/* Inner content */}
                    <div className="relative z-20">
                        {/* MICROPHONE ICON */}
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 transition-colors duration-300 ${isLive ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            
                            {/* RED SLASH (Visible when Muted / Standby) */}
                            {!isLive && (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4l16 16" className="text-red-500/70" />
                            )}
                        </svg>
                    </div>
                    
                    {/* Ripples when Live */}
                    {isLive && (
                        <>
                            <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-ping-slow"></div>
                            <div className="absolute inset-0 rounded-full border border-cyan-500/10 animate-ping delay-150"></div>
                        </>
                    )}
                </button>

                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">
                    {isLive ? 'LIVE' : 'MUTED'}
                </span>
          </div>
      </footer>

      {/* Spec Editor Modal */}
      <SpecEditor 
          isOpen={isSpecEditorOpen}
          onClose={() => setIsSpecEditorOpen(false)}
      />
    </div>
  );
};

export default App;

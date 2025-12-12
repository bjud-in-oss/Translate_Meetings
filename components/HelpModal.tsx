
import React from 'react';

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">?</span> 
              System & API Guide
           </h2>
           <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-12">
            
            {/* SECTION 1: API LIFECYCLE GRAPH */}
            <section>
                <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-700 pb-2">1. Connection Lifecycle Graph</h3>
                <div className="flex flex-col items-center justify-center space-y-4 font-mono text-sm">
                    
                    {/* Setup Phase */}
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-600 w-64 text-center">
                        <div className="text-slate-400 text-xs uppercase mb-1">Phase 1: Setup</div>
                        <div className="font-bold text-white">CONFIGURATION</div>
                        <div className="text-[10px] text-slate-500 mt-2">
                           User selects Language, Mode, Mic.<br/>
                           (No API connection yet)
                        </div>
                    </div>

                    <div className="h-8 w-px bg-slate-600"></div>

                    {/* Init Phase */}
                    <div className="bg-cyan-900/30 p-4 rounded-lg border border-cyan-700/50 w-64 text-center shadow-lg shadow-cyan-900/20">
                         <div className="text-cyan-400 text-xs uppercase mb-1">Phase 2: Initialization</div>
                         <div className="font-bold text-white">START SESSION</div>
                         <ul className="text-[10px] text-cyan-200 mt-2 text-left list-disc pl-4 space-y-1">
                             <li>Request Mic Permission</li>
                             <li>Initialize VAD (Voice Activity)</li>
                             <li>WebSocket Handshake (Gemini)</li>
                         </ul>
                    </div>

                    <div className="h-8 w-px bg-slate-600"></div>

                    {/* Active Loop */}
                    <div className="bg-green-900/20 p-6 rounded-xl border border-green-700/50 w-full max-w-lg relative">
                        <div className="absolute top-2 right-3 text-[10px] text-green-400 animate-pulse">LIVE</div>
                        <div className="text-center font-bold text-lg text-white mb-4">Phase 3: ACTIVE SESSION</div>
                        
                        <div className="grid grid-cols-2 gap-8">
                             <div className="bg-slate-900 p-3 rounded border border-slate-700 text-center">
                                 <div className="text-xs text-slate-400 font-bold mb-1">LISTENING</div>
                                 <div className="text-[10px] text-slate-500">
                                     VAD detects user speech.<br/>
                                     Buffering audio chunks.
                                 </div>
                             </div>
                             
                             <div className="flex items-center justify-center">
                                 <div className="h-px bg-slate-600 flex-1"></div>
                                 <span className="text-[10px] px-2 text-slate-500">Trigger</span>
                                 <div className="h-px bg-slate-600 flex-1"></div>
                             </div>

                             <div className="bg-slate-900 p-3 rounded border border-slate-700 text-center col-span-2">
                                 <div className="text-xs text-slate-400 font-bold mb-1">THINKING / GENERATING</div>
                                 <div className="text-[10px] text-slate-500">
                                     Audio uploaded to Gemini.<br/>
                                     Model generates Audio Response.
                                 </div>
                             </div>

                             <div className="bg-slate-900 p-3 rounded border border-slate-700 text-center col-span-2 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                                 <div className="text-xs text-green-400 font-bold mb-1">SPEAKING</div>
                                 <div className="text-[10px] text-slate-500">
                                     App plays returned audio.<br/>
                                     Mic might be suppressed (Echo Cancel).
                                 </div>
                             </div>
                        </div>
                    </div>

                     <div className="h-8 w-px bg-slate-600"></div>
                     
                     {/* End Phase */}
                     <div className="bg-red-900/20 p-4 rounded-lg border border-red-700/50 w-64 text-center">
                        <div className="text-red-400 text-xs uppercase mb-1">Phase 4: Terminate</div>
                        <div className="font-bold text-white">END SESSION</div>
                        <div className="text-[10px] text-red-200 mt-2">
                           Socket Closed. Resources Freed.<br/>
                           Return to Setup.
                        </div>
                    </div>

                </div>
            </section>

            {/* SECTION 2: SETTINGS EXPLAINED */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2">2. Translation Modes</h3>
                    <ul className="space-y-4">
                        <li className="bg-slate-800/50 p-4 rounded-lg">
                            <span className="text-cyan-400 font-bold text-sm block mb-1">Sequential (Dialog)</span>
                            <p className="text-xs text-slate-400">
                                Best for: <strong>Conversations</strong>.<br/>
                                The AI waits politely for you to finish speaking (silence detection) before it starts translating. It mimics a human interpreter taking turns.
                            </p>
                        </li>
                        <li className="bg-slate-800/50 p-4 rounded-lg">
                            <span className="text-pink-400 font-bold text-sm block mb-1">Simultaneous (Half-Duplex)</span>
                            <p className="text-xs text-slate-400">
                                Best for: <strong>Speeches / Sermons</strong>.<br/>
                                The AI uses a "Buffer & Burst" strategy. It collects audio while you speak and translates in chunks. If it falls behind, it summarizes to catch up.
                            </p>
                        </li>
                        <li className="bg-slate-800/50 p-4 rounded-lg">
                            <span className="text-purple-400 font-bold text-sm block mb-1">Fluid</span>
                            <p className="text-xs text-slate-400">
                                Best for: <strong>Fast-paced Chat</strong>.<br/>
                                Aggressive latency. It interrupts and translates as fast as possible, often sacrificing some grammar for speed.
                            </p>
                        </li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2">3. Audio Settings</h3>
                    <ul className="space-y-4">
                         <li className="bg-slate-800/50 p-4 rounded-lg">
                            <span className="text-green-400 font-bold text-sm block mb-1">Group Mode (Small vs Large)</span>
                            <p className="text-xs text-slate-400 mb-2">
                                Controls the Microphone Sensitivity (AGC).
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div className="bg-slate-900 p-2 rounded">
                                    <strong className="block text-slate-300">Small Group (Digital Pre-Amp)</strong>
                                    Software boost enabled. Good for picking up quiet voices in a small circle.
                                </div>
                                <div className="bg-slate-900 p-2 rounded">
                                    <strong className="block text-slate-300">Large Group (Hardware AGC)</strong>
                                    Uses the device's native Auto Gain. Better for loud rooms or PA systems to avoid clipping.
                                </div>
                            </div>
                        </li>
                         <li className="bg-slate-800/50 p-4 rounded-lg">
                            <span className="text-amber-400 font-bold text-sm block mb-1">Source Language</span>
                            <p className="text-xs text-slate-400">
                                Currently, the system is optimized to translate <strong>FROM</strong> Swedish <strong>TO</strong> the selected language. 
                                <br/><br/>
                                <em>Note: The AI can technically detect other input languages, but specifying Swedish ensures better accuracy for local dialects.</em>
                            </p>
                        </li>
                    </ul>
                </div>
            </section>

        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end">
            <button onClick={onClose} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors">
                Close Guide
            </button>
        </div>

      </div>
    </div>
  );
};

export default HelpModal;

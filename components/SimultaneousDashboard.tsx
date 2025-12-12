
import React from 'react';

interface SimultaneousDashboardProps {
  rms: number;           
  vadProb: number;       
  isGated: boolean;      
  bufferSize: number;    // Input Buffer (Chunks)
  outputQueueSize: number; // Output Queue (Seconds)
  trafficLight: 'OPEN' | 'TALK' | 'PAUSE' | 'SLEEP';
  isUploading: boolean;  
  lastBurstSize: number; 
  inspectorMessage: string;
  totalLag: number;
  lagTrend: 'STABLE' | 'RISING' | 'FALLING';
  onTogglePause: () => void;
  aiEfficiency: number;
}

const SimultaneousDashboard: React.FC<SimultaneousDashboardProps> = ({
  bufferSize,
  outputQueueSize,
  trafficLight,
  isUploading,
  lastBurstSize,
  inspectorMessage,
  totalLag,
  lagTrend,
  onTogglePause,
  aiEfficiency
}) => {

  // Spiral Visualization Logic
  const baseRadius = 70; // Outside the button
  // Center coordinates for the SVG viewbox (240x240)
  const centerX = 120;   
  const centerY = 120;
  
  // Logic to determine spiral color and size
  let ringColor = '#22d3ee'; // Cyan (< 8s)
  if (outputQueueSize > 15) ringColor = '#ef4444'; // Red (> 15s)
  else if (outputQueueSize > 8) ringColor = '#a855f7'; // Purple (8-15s)

  const circumference = 2 * Math.PI * baseRadius;
  
  // Create multi-turn spiral effect by modulating stroke-dashoffset
  const fillPerc = Math.min(outputQueueSize / 15, 1); 
  const dashOffset = circumference - (fillPerc * circumference);
  
  // Dynamic stroke width adds "weight" or "spiral depth"
  const dynamicStroke = 4 + (outputQueueSize > 15 ? 4 : (outputQueueSize / 5));

  // Core Style
  let centerColor = 'bg-white border-slate-200 text-slate-900'; // OPEN
  let glowClass = '';
  let label = 'OPEN';
  
  if (trafficLight === 'TALK') {
      centerColor = 'bg-blue-600 border-blue-400 text-white'; 
      label = 'TALK';
      glowClass = 'shadow-[0_0_30px_rgba(37,99,235,0.4)]';
  } else if (trafficLight === 'PAUSE') {
      centerColor = 'bg-red-600 border-red-400 text-white'; 
      label = 'PAUSE';
      glowClass = 'shadow-[0_0_20px_rgba(220,38,38,0.3)]';
  } else if (trafficLight === 'SLEEP') {
      centerColor = 'bg-slate-700 border-slate-600 text-slate-400'; 
      label = 'SLEEP';
  }

  const uplinkColor = isUploading ? 'bg-cyan-400 shadow-[0_0_15px_cyan]' : 'bg-slate-700';

  return (
    <div className="w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl relative overflow-hidden font-mono flex flex-col p-6">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

      {/* PIPELINE ROW */}
      <div className="relative z-10 flex items-end justify-center gap-4 sm:gap-12 h-48">
        
        {/* INPUT STACK */}
        <div className="flex flex-col items-center justify-end h-full w-16 pb-4">
            <div className="relative w-full h-32 bg-slate-800/50 border border-slate-600 rounded-lg flex flex-col-reverse p-1 gap-[2px] overflow-hidden">
                {Array.from({ length: 16 }).map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-full h-1.5 rounded-sm transition-all duration-200 ${
                            i < bufferSize 
                            ? 'bg-blue-500' 
                            : 'bg-transparent'
                        }`}
                    ></div>
                ))}
            </div>
            <span className="text-[10px] text-slate-500 mt-2 font-bold tracking-wider">INPUT</span>
        </div>

        {/* UPLINK */}
        <div className="flex flex-col items-center justify-center h-full w-8 pb-10">
            <div className={`h-1 w-full transition-all duration-300 ${uplinkColor}`}></div>
            {isUploading && <span className="text-[9px] text-cyan-400 absolute mt-4 animate-pulse">SEND</span>}
        </div>

        {/* THE CORE */}
        <div className="flex flex-col items-center justify-center h-full w-48 pb-4 relative">
            
            {/* Concentric Wrapper: Ensures Button and Ring share exact center */}
            <div className="relative flex items-center justify-center w-28 h-28">
                
                {/* Output Ring (Spiral) - Absolutely centered on the wrapper */}
                <svg 
                    className="absolute z-0 pointer-events-none overflow-visible"
                    style={{ 
                        width: '240px', 
                        height: '240px', 
                        top: '50%', 
                        left: '50%',
                        transform: 'translate(-50%, -50%) rotate(-90deg)' 
                    }}
                    viewBox="0 0 240 240"
                >
                    <circle
                        cx={centerX}
                        cy={centerY}
                        r={baseRadius}
                        stroke="rgba(30, 41, 59, 0.5)" 
                        strokeWidth="4"
                        fill="transparent"
                    />
                    <circle
                        cx={centerX}
                        cy={centerY}
                        r={baseRadius}
                        stroke={ringColor} 
                        strokeWidth={dynamicStroke}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                        className="transition-all duration-200 ease-linear"
                    />
                </svg>

                <button 
                    onClick={onTogglePause}
                    className={`relative w-28 h-28 rounded-full flex items-center justify-center border-4 z-20 transition-all duration-300 transform active:scale-95 ${centerColor} ${glowClass}`}
                >
                    <div className="flex flex-col items-center">
                        <span className="font-bold text-lg tracking-widest">{label}</span>
                        {trafficLight === 'SLEEP' && <span className="text-[9px] mt-1 opacity-70">AUTO-WAKE</span>}
                        {trafficLight === 'PAUSE' && <span className="text-[9px] mt-1 opacity-70">TAP RESUME</span>}
                    </div>
                </button>
            </div>

            <span className="text-[10px] text-slate-500 mt-6 font-bold tracking-wider">CORE</span>
        </div>

        {/* TREND / LAG METER */}
        <div className="flex flex-col items-center justify-end h-full w-16 pb-4">
             <div className="relative w-8 h-32 bg-slate-800/50 border border-slate-600 rounded-lg flex flex-col justify-end p-2 items-center">
                 
                 {/* Arrow Indicator */}
                 <div className={`transition-all duration-500 mb-2 ${
                     lagTrend === 'RISING' ? 'text-red-500 translate-y-0 opacity-100' : 
                     lagTrend === 'FALLING' ? 'text-green-500 rotate-180 translate-y-0 opacity-100' : 
                     'text-slate-600 opacity-50'
                 }`}>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                     </svg>
                 </div>

                 {/* Lag Bar */}
                 <div className="w-2 bg-slate-700 h-20 rounded-full relative overflow-hidden">
                     <div 
                        className={`absolute bottom-0 w-full transition-all duration-500 ${
                            totalLag > 15 ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        style={{ height: `${Math.min((totalLag / 15) * 100, 100)}%` }}
                     ></div>
                 </div>

             </div>
             <span className="text-xs font-bold text-white mt-2">{totalLag.toFixed(1)}s</span>
             <span className="text-[10px] text-slate-500 font-bold tracking-wider text-center">LAG</span>
        </div>

      </div>

      {/* INSPECTOR */}
      <div className="border-t border-slate-700/50 bg-slate-900/50 mt-4 pt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
              <span className={`w-1.5 h-1.5 rounded-full ${trafficLight === 'TALK' || isUploading ? 'bg-cyan-500 animate-pulse' : 'bg-slate-600'}`}></span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">STATUS</span>
          </div>
          <span className="text-xs font-mono text-cyan-300 truncate max-w-[400px]">
              {inspectorMessage}
          </span>
          <span className="text-[9px] text-slate-600 font-mono">
              BURST: {lastBurstSize}
          </span>
      </div>
    </div>
  );
};

export default SimultaneousDashboard;

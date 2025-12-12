
import React from 'react';

interface InputMeterProps {
  level: number; // 0.0 to 1.0 (RMS)
  isMuted: boolean;
  label?: string;
}

const InputMeter: React.FC<InputMeterProps> = ({ level, isMuted, label = "INPUT" }) => {
  // Scale level for visualization (RMS is usually low, so we boost it)
  const displayLevel = Math.min(Math.max(level * 5, 0), 1);
  const percent = displayLevel * 100;

  // Determine color based on level
  let colorClass = 'bg-green-500';
  if (displayLevel > 0.8) colorClass = 'bg-red-500';
  else if (displayLevel > 0.6) colorClass = 'bg-yellow-500';

  if (isMuted) colorClass = 'bg-slate-600';

  return (
    <div className="flex flex-col items-center justify-end h-32 w-8 space-y-2">
      <div className="relative w-4 h-24 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
         {/* Background Grid */}
         <div className="absolute inset-0 flex flex-col justify-between py-1 opacity-30">
            {Array.from({length: 10}).map((_, i) => (
                <div key={i} className="w-full h-px bg-slate-500"></div>
            ))}
         </div>
         
         {/* The Meter Bar */}
         <div 
            className={`absolute bottom-0 w-full transition-all duration-75 ease-out ${colorClass}`}
            style={{ height: `${percent}%` }}
         ></div>

         {/* Peak Hold Indicator (Optional refinement for later) */}
      </div>
      <span className="text-[9px] font-bold text-slate-500 tracking-wider rotate-[-90deg] whitespace-nowrap mb-2">
          {isMuted ? 'MUTED' : label}
      </span>
    </div>
  );
};

export default InputMeter;

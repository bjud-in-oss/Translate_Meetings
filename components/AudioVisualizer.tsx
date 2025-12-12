
import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  isMuted: boolean; // Visual indicator if we are suppressing mic
  analyser?: AnalyserNode;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isActive, isMuted, analyser }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser || !isActive) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Style based on state
      let barColor = 'rgb(6, 182, 212)'; // Cyan
      if (isMuted) {
        barColor = 'rgb(148, 163, 184)'; // Grey/Slate (muted)
      }

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2; // Scale down

        ctx.fillStyle = barColor;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isActive, isMuted]);

  return (
    <div className="w-full h-16 bg-slate-800 rounded-lg overflow-hidden border border-slate-700 relative">
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={64} 
        className="w-full h-full"
      />
      {isMuted && isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Mic Suppressed (Speaker Active)</span>
        </div>
      )}
    </div>
  );
};

export default AudioVisualizer;

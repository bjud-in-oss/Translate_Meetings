
import React, { useEffect, useRef } from 'react';
import { TranscriptItem } from '../types';

interface TranscriptViewProps {
  items: TranscriptItem[];
}

const TranscriptView: React.FC<TranscriptViewProps> = ({ items }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom whenever items change
    if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm italic">
        No conversation yet. Connect to start.
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex flex-col space-y-4 h-full overflow-y-auto p-4 scrollbar-hide"
    >
      {items.map((item) => {
        if (item.role === 'system') {
          return (
             <div key={item.id} className="flex items-center justify-center w-full my-4">
                <span className="text-[10px] uppercase tracking-widest text-slate-600 bg-slate-800/50 px-3 py-1 rounded-full">
                   {item.text}
                </span>
             </div>
          );
        }

        return (
          <div
            key={item.id}
            className={`flex flex-col max-w-[85%] ${
              item.role === 'user' ? 'self-end items-end' : 'self-start items-start'
            }`}
          >
            <div
              className={`rounded-2xl px-4 py-2 text-sm shadow-sm transition-all duration-300 ${
                item.role === 'user'
                  ? 'bg-cyan-600 text-white rounded-br-none'
                  : 'bg-slate-700 text-slate-100 rounded-bl-none'
              } ${!item.isFinal ? 'opacity-80 border-2 border-dashed border-white/20' : ''}`}
            >
              {item.text}
              {!item.isFinal && <span className="animate-pulse inline-block ml-1">...</span>}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 px-1 flex gap-1">
              <span>{item.role === 'user' ? 'Original' : 'Translation'}</span>
              {!item.isFinal && <span className="italic text-cyan-400">(Drafting)</span>}
            </span>
          </div>
        );
      })}
      <div ref={bottomRef}></div>
    </div>
  );
};

export default TranscriptView;

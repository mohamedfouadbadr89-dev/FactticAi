'use client';

import React from 'react';

interface DriftIndicatorProps {
  drift: number;
}

export const DriftIndicator: React.FC<DriftIndicatorProps> = ({ drift }) => {
  const isPositive = drift > 0;
  
  return (
    <div className="flex items-center gap-4 bg-zinc-950/50 border border-zinc-800 p-4 rounded-lg">
      <div className="flex-1">
        <h4 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-1">Session Drift</h4>
        <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-mono font-bold ${drift > 0.2 ? 'text-red-400' : 'text-zinc-100'}`}>
                {drift.toFixed(2)}
            </span>
            <span className="text-[10px] font-mono text-zinc-600 uppercase">Delta</span>
        </div>
      </div>
      
      <div className="h-10 w-[1px] bg-zinc-800" />
      
      <div className="flex flex-col items-center">
        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter ${
          drift > 0.4 ? 'bg-red-500/10 text-red-400' : 
          drift > 0.2 ? 'bg-orange-500/10 text-orange-400' : 'bg-emerald-500/10 text-emerald-400'
        }`}>
          {drift > 0.4 ? 'CRITICAL_VARIANCE' : drift > 0.2 ? 'STABLE_DRIFT' : 'LOW_DRIFT'}
        </div>
        <div className="mt-2 flex items-center gap-1">
            <svg className={`w-3 h-3 ${isPositive ? 'text-red-400 rotate-0' : 'text-emerald-400 rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 3a1 1 0 01.707.293l6 6a1 1 0 01-1.414 1.414L11 6.414V17a1 1 0 11-2 0V6.414L4.707 10.707a1 1 0 01-1.414-1.414l6-6A1 1 0 0110 3z" />
            </svg>
            <span className="text-[9px] text-zinc-600 font-mono">{(drift * 100).toFixed(0)}% Variance</span>
        </div>
      </div>
    </div>
  );
};

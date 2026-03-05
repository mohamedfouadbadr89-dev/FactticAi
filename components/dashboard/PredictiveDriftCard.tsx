"use client";

import React from 'react';
import { AlertTriangle, TrendingUp, Clock, ShieldCheck } from 'lucide-react';

interface PredictiveDriftProps {
  model: string;
  driftScore: number;
  momentum: number;
  predictedHours: number;
  escalation: 'watch' | 'warning' | 'critical';
}

export function PredictiveDriftCard({ 
  model, 
  driftScore, 
  momentum, 
  predictedHours, 
  escalation 
}: PredictiveDriftProps) {
  
  const statusStyles = {
    watch: {
      border: 'border-slate-800',
      bg: 'bg-[#111]',
      text: 'text-slate-400',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
      label: 'Stable Observation'
    },
    warning: {
      border: 'border-amber-900/50',
      bg: 'bg-amber-950/10',
      text: 'text-amber-400',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      label: 'Early Warning Warning'
    },
    critical: {
      border: 'border-red-900/50',
      bg: 'bg-red-950/20',
      text: 'text-red-400',
      icon: <TrendingUp className="w-5 h-5 text-red-500 animate-pulse" />,
      label: 'Critical Threshold Imminent'
    }
  };

  const currentStatus = statusStyles[escalation];

  return (
    <div className={`p-6 rounded-2xl border ${currentStatus.border} ${currentStatus.bg} transition-all duration-300`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-slate-500 text-xs font-mono uppercase tracking-widest mb-1">Predictive Drift</h3>
          <p className="text-lg font-bold text-slate-100">{model}</p>
        </div>
        <div className="p-2 bg-black/50 rounded-lg border border-slate-800">
          {currentStatus.icon}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-1">
          <span className="text-[10px] text-slate-500 uppercase font-mono">Drift Score</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-mono text-slate-200">{(driftScore * 100).toFixed(1)}%</span>
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] text-slate-500 uppercase font-mono">Momentum</span>
          <div className="flex items-center gap-2">
            <span className={`text-xl font-mono ${momentum > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {momentum > 0 ? '+' : ''}{(momentum * 100).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-black/30 rounded-xl border border-slate-800/50">
        <div className="flex items-center gap-3 mb-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-400 font-medium">Critical Breach Forecast</span>
        </div>
        
        <div className="flex items-baseline gap-2">
          {predictedHours > 168 ? (
            <span className="text-lg font-bold text-emerald-400">Stable Layer</span>
          ) : (
            <>
              <span className={`text-2xl font-bold ${currentStatus.text}`}>
                {predictedHours}
              </span>
              <span className="text-sm text-slate-500">hours remaining</span>
            </>
          )}
        </div>
      </div>

      <div className={`mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between`}>
         <span className={`text-[10px] font-bold uppercase tracking-thicker ${currentStatus.text}`}>
           {currentStatus.label}
         </span>
         <div className="flex items-center gap-1">
           <div className={`w-2 h-2 rounded-full ${currentStatus.text.replace('text-', 'bg-')} animate-pulse`}></div>
           <span className="text-[10px] text-slate-500 font-mono">Live Feed</span>
         </div>
      </div>
    </div>
  );
}

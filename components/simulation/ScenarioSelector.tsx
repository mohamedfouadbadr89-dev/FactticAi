"use client";

import React from 'react';
import { SCENARIOS } from '@/lib/testing/scenarios';
import { useInteractionMode } from '@/store/interactionMode';
import { Zap, ShieldAlert, AlertTriangle, Cpu, Activity, Play } from 'lucide-react';

interface ScenarioSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
  volume: number;
  onVolumeChange: (v: number) => void;
  onRun: () => void;
  loading: boolean;
}

export default function ScenarioSelector({ 
  selectedId, 
  onSelect, 
  volume, 
  onVolumeChange, 
  onRun, 
  loading 
}: ScenarioSelectorProps) {
  const { mode } = useInteractionMode();

  const getIcon = (id: string) => {
    switch(id) {
      case 'hallucination': return <Cpu className="w-5 h-5 text-blue-500" />;
      case 'injection': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case 'violation': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'overflow': return <Activity className="w-5 h-5 text-purple-500" />;
      case 'toxic': return <Zap className="w-5 h-5 text-yellow-500" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
          {mode === 'voice' ? 'Acoustic Threat Scenario' : 'Simulation Scenario'}
        </label>
        <div className="grid grid-cols-1 gap-3">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`flex items-start gap-4 p-5 rounded-2xl border transition-all text-left ${
                selectedId === s.id 
                ? 'bg-[var(--accent)]/5 border-[var(--accent)] ring-4 ring-[var(--accent)]/5' 
                : 'bg-[var(--bg-primary)] border-[var(--border-primary)] hover:border-[var(--text-secondary)]/20'
              }`}
            >
              <div className={`p-3 rounded-xl ${selectedId === s.id ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-secondary)]'}`}>
                {getIcon(s.id)}
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm tracking-tight">{s.name}</div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{s.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Traffic Volume</label>
          <span className="text-[10px] font-black text-[var(--accent)]">{volume} REQUESTS</span>
        </div>
        <input 
          type="range"
          min="1"
          max="50"
          value={volume}
          onChange={(e) => onVolumeChange(parseInt(e.target.value))}
          className="w-full accent-[var(--accent)]"
        />
        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-50">
          <span>Single Unit</span>
          <span>Batch Burst</span>
        </div>
      </div>

      <button
        onClick={onRun}
        disabled={loading || !selectedId}
        className="w-full py-4 bg-[var(--accent)] text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-[var(--accent)]/90 flex items-center justify-center gap-2 transition-all shadow-lg shadow-[var(--accent)]/10 disabled:opacity-50"
      >
        {loading ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
        {loading ? 'Simulating...' : 'Execute Simulation'}
      </button>
    </div>
  );
}

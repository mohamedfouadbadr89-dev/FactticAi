"use client";

import { 
  AlertCircle, 
  Zap, 
  UserX, 
  Cpu, 
  Waves,
  ShieldAlert
} from "lucide-react";

interface BehaviorSignals {
  intent_drift_score: number;
  instruction_override: boolean;
  confidence_score: number;
  context_saturation: number;
  signals: string[];
}

export default function BehaviorAnomalySignals({ signals }: { signals: BehaviorSignals | null }) {
  if (!signals) {
    return (
      <div className="p-8 text-center bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
        <AlertCircle className="w-12 h-12 text-[var(--text-secondary)]/30 mx-auto mb-4" />
        <p className="text-[var(--text-secondary)] italic">No behavioral anomalies detected.</p>
      </div>
    );
  }

  const getMetricColor = (val: number, inverse = false) => {
    const threshold = inverse ? val : 100 - val;
    if (threshold > 70) return 'text-red-500';
    if (threshold > 40) return 'text-amber-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] px-2">
        Behavioral Forensics
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Intent Drift */}
        <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-primary)]">
          <div className="flex items-center gap-2 mb-3">
            <Waves className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-tighter text-[var(--text-secondary)]">Intent Drift</span>
          </div>
          <div className={`text-2xl font-black ${getMetricColor(signals.intent_drift_score, true)}`}>
            {signals.intent_drift_score}%
          </div>
        </div>

        {/* Confidence */}
        <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-primary)]">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-[10px] font-black uppercase tracking-tighter text-[var(--text-secondary)]">Confidence</span>
          </div>
          <div className={`text-2xl font-black ${getMetricColor(signals.confidence_score)}`}>
            {signals.confidence_score}%
          </div>
        </div>

        {/* Instruction Override */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between ${
          signals.instruction_override 
            ? 'bg-red-500/5 border-red-500/20' 
            : 'bg-[var(--bg-secondary)] border-[var(--border-primary)]'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <UserX className={`w-4 h-4 ${signals.instruction_override ? 'text-red-500' : 'text-[var(--text-secondary)]'}`} />
            <span className="text-[10px] font-black uppercase tracking-tighter text-[var(--text-secondary)]">Override Detect</span>
          </div>
          <div className={`text-sm font-bold ${signals.instruction_override ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>
            {signals.instruction_override ? 'DETECTED' : 'CLEAR'}
          </div>
        </div>

        {/* Context Saturation */}
        <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-primary)]">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-4 h-4 text-purple-500" />
            <span className="text-[10px] font-black uppercase tracking-tighter text-[var(--text-secondary)]">Saturation</span>
          </div>
          <div className={`text-2xl font-black ${getMetricColor(signals.context_saturation, true)}`}>
            {signals.context_saturation}%
          </div>
        </div>
      </div>

      {/* Signal Badges */}
      {signals.signals && signals.signals.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {signals.signals.map((sig, idx) => (
            <div key={idx} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20">
              <ShieldAlert className="w-3 h-3 text-red-500" />
              <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter">{sig}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

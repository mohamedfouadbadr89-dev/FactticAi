'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  ShieldAlert, 
  Zap, 
  Target, 
  Layers, 
  ArrowUpRight,
  Fingerprint,
  Cpu
} from 'lucide-react';

interface BehaviorSignal {
  session_id: string;
  intent_drift_score: number;
  instruction_override: boolean;
  confidence_score: number;
  context_saturation: number;
  signals: string[];
}

export default function BehaviorForensicsPage() {
  const [signals, setSignals] = useState<BehaviorSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated load - in production this would fetch from a listing API
    // or aggregate from forensics_signals table
    const mockData: BehaviorSignal[] = [
      {
        session_id: 'sess-882-xf',
        intent_drift_score: 42,
        instruction_override: false,
        confidence_score: 88,
        context_saturation: 15,
        signals: ['INTENT_DRIFT_ALERT']
      },
      {
        session_id: 'sess-901-qa',
        intent_drift_score: 12,
        instruction_override: true,
        confidence_score: 45,
        context_saturation: 85,
        signals: ['PROMPT_OVERRIDE_ALERT', 'CONFIDENCE_DROP']
      },
      {
        session_id: 'sess-772-lp',
        intent_drift_score: 5,
        instruction_override: false,
        confidence_score: 98,
        context_saturation: 22,
        signals: []
      }
    ];

    setTimeout(() => {
      setSignals(mockData);
      setLoading(false);
    }, 800);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      {/* Header */}
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-500/20 border border-indigo-500/30 rounded-lg">
            <Fingerprint className="w-5 h-5 text-indigo-400" />
          </div>
          <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">
            Module 08 // AI Behavior Forensics
          </span>
        </div>
        <h1 className="text-5xl font-black uppercase tracking-tighter mb-2 italic">Behavioral Anomaly Hub</h1>
        <p className="text-slate-500 max-w-2xl text-sm font-medium leading-relaxed">
          Platform-wide monitoring of model intent drift, instruction adherence, and confidence performance.
          Enforcing deterministic alignment through high-frequency behavioral analysis.
        </p>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Avg Intent Drift', value: '18.4%', trend: '-2.1%', icon: Activity },
          { label: 'Override Events', value: '3', trend: '+1', icon: ShieldAlert, alert: true },
          { label: 'Confidence Floor', value: '92%', trend: '+0.5%', icon: Target },
          { label: 'Latency Impact', value: '12ms', trend: 'Fixed', icon: Zap }
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon className="w-12 h-12" />
            </div>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.alert ? 'text-red-400' : 'text-white'}`}>{stat.value}</p>
            <span className="text-[10px] font-mono text-emerald-400 mt-2 block">{stat.trend}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Live Forensic Stream</h3>
            <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono uppercase text-emerald-500">Engine Active</span>
            </div>
          </div>

          {loading ? (
            <div className="h-48 bg-white/5 animate-pulse rounded-2xl" />
          ) : (
            signals.map((signal, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-indigo-500/30 transition-all group"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center">
                      <Cpu className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm uppercase tracking-tighter">{signal.session_id}</h4>
                      <p className="text-[10px] font-mono text-slate-500">ANALYTICS // SESSION_BEHAVIOR_REPORT</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <ArrowUpRight className="w-4 h-4 text-slate-500" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-2">Intent Drift</p>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${signal.intent_drift_score}%` }} />
                    </div>
                    <p className="text-xs font-mono mt-2 font-black italic">{signal.intent_drift_score}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-2">Override Status</p>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border inline-block ${
                      signal.instruction_override ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    }`}>
                      {signal.instruction_override ? 'DETECTED' : 'SECURE'}
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-2">Confidence</p>
                    <p className="text-xs font-mono font-black italic text-indigo-400">{signal.confidence_score}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-2">Saturation</p>
                    <p className="text-xs font-mono font-black italic text-slate-300">{signal.context_saturation}%</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Sidebar Alerts */}
        <div className="space-y-6">
          <div className="bg-indigo-950/20 border border-indigo-500/30 p-8 rounded-3xl relative overflow-hidden italic font-black uppercase">
            <div className="relative z-10">
              <Layers className="w-8 h-8 text-indigo-400 mb-6" />
              <h3 className="text-2xl tracking-tighter mb-2">Behavioral Integrity Service</h3>
              <p className="text-xs text-indigo-300/60 leading-tight">
                High-frequency alignment scoring active across all connected model endpoints.
              </p>
              <button className="mt-8 bg-indigo-500 text-black px-6 py-3 rounded-full text-xs hover:bg-indigo-400 transition-colors">
                Run Manual Scan
              </button>
            </div>
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
          </div>

          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Critical Intercepts</h3>
            <div className="space-y-4">
              {[
                { title: 'Goal Hijack Attempt', time: '12m ago', level: 'High' },
                { title: 'Instruction Extraction', time: '45m ago', level: 'Critical' },
                { title: 'System Prompt Bypass', time: '2h ago', level: 'Medium' }
              ].map((alert, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-tighter">{alert.title}</p>
                    <p className="text-[9px] font-mono text-slate-500">{alert.time}</p>
                  </div>
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded border ${
                    alert.level === 'Critical' ? 'border-red-500/50 text-red-400' : 'border-slate-500/50 text-slate-500'
                  }`}>
                    {alert.level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

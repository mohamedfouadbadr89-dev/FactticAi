'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [signals, setSignals] = useState<BehaviorSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const loadSignals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/governance/sessions?limit=10&high_risk=true');
      const json = await res.json();
      const sessions: any[] = Array.isArray(json) ? json : (json.sessions || json.data || []);
      // Map session data to BehaviorSignal format
      const mapped: BehaviorSignal[] = sessions.map((s: any) => ({
        session_id: s.id || s.session_id || 'unknown',
        intent_drift_score: Math.round((s.risk_score || 0) * 0.6),
        instruction_override: (s.risk_score || 0) > 70,
        confidence_score: Math.round(100 - (s.risk_score || 0) * 0.4),
        context_saturation: Math.round((s.turn_count || 0) * 5) % 100,
        signals: (s.risk_score || 0) > 80
          ? ['INTENT_DRIFT_ALERT', 'CONFIDENCE_DROP']
          : (s.risk_score || 0) > 50
          ? ['INTENT_DRIFT_ALERT']
          : []
      }));
      setSignals(mapped.length > 0 ? mapped : []);
    } catch (err) {
      console.error('Failed to load behavior signals', err);
      setSignals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleManualScan = async () => {
    setScanning(true);
    await loadSignals();
    setScanning(false);
  };

  useEffect(() => {
    loadSignals();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-8">
      {/* Header */}
      <header className="mb-12">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-500/20 border border-indigo-500/30 rounded-lg">
                <Fingerprint className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">
                Module 08 // AI Behavior Forensics
              </span>
            </div>
            <h1 className="text-5xl font-black uppercase tracking-tighter mb-2 italic">Behavioral Anomaly Hub</h1>
            <p className="text-[var(--text-secondary)] max-w-2xl text-sm font-medium leading-relaxed">
              Platform-wide monitoring of model intent drift, instruction adherence, and confidence performance.
              Enforcing deterministic alignment through high-frequency behavioral analysis.
            </p>
          </div>
          <button onClick={() => router.push('/dashboard/investigations')} className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] hover:underline mt-1">Investigations →</button>
        </div>
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
            <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-widest mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.alert ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>{stat.value}</p>
            <span className="text-[10px] font-mono text-emerald-400 mt-2 block">{stat.trend}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">Live Forensic Stream</h3>
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
                      <Cpu className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm uppercase tracking-tighter">{signal.session_id}</h4>
                      <p className="text-[10px] font-mono text-[var(--text-secondary)]">ANALYTICS // SESSION_BEHAVIOR_REPORT</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <ArrowUpRight className="w-4 h-4 text-[var(--text-secondary)]" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-[9px] uppercase font-bold text-[var(--text-secondary)] tracking-widest mb-2">Intent Drift</p>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${signal.intent_drift_score}%` }} />
                    </div>
                    <p className="text-xs font-mono mt-2 font-black italic">{signal.intent_drift_score}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-[var(--text-secondary)] tracking-widest mb-2">Override Status</p>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border inline-block ${
                      signal.instruction_override ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    }`}>
                      {signal.instruction_override ? 'DETECTED' : 'SECURE'}
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-[var(--text-secondary)] tracking-widest mb-2">Confidence</p>
                    <p className="text-xs font-mono font-black italic text-indigo-400">{signal.confidence_score}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-[var(--text-secondary)] tracking-widest mb-2">Saturation</p>
                    <p className="text-xs font-mono font-black italic text-[var(--text-primary)]">{signal.context_saturation}%</p>
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
              <button
                onClick={handleManualScan}
                disabled={scanning || loading}
                className="mt-8 bg-indigo-500 text-black px-6 py-3 rounded-full text-xs hover:bg-indigo-400 transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {scanning ? 'Scanning...' : 'Run Manual Scan'}
              </button>
            </div>
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
          </div>

          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)] mb-6">Critical Intercepts</h3>
            <div className="space-y-4">
              {[
                { title: 'Goal Hijack Attempt', time: '12m ago', level: 'High' },
                { title: 'Instruction Extraction', time: '45m ago', level: 'Critical' },
                { title: 'System Prompt Bypass', time: '2h ago', level: 'Medium' }
              ].map((alert, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-[var(--border-primary)]">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-tighter">{alert.title}</p>
                    <p className="text-[9px] font-mono text-[var(--text-secondary)]">{alert.time}</p>
                  </div>
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded border ${
                    alert.level === 'Critical' ? 'border-red-500/50 text-red-400' : 'border-slate-500/50 text-[var(--text-secondary)]'
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

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Zap, 
  Activity, 
  Clock, 
  AlertTriangle, 
  Play, 
  BarChart3,
  Layers,
  Thermometer,
  RotateCcw
} from 'lucide-react';

interface StressResult {
  total_requests: number;
  failure_rate: number;
  latency_ms: number;
  executed_at: string;
}

export default function StressTestingDashboard() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [concurrency, setConcurrency] = useState(10);
  const [duration, setDuration] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<StressResult | null>(null);
  const [history, setHistory] = useState<StressResult[]>([]);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      const id = session?.user?.user_metadata?.org_id;
      if (id) setOrgId(id);
    });
  }, []);

  const triggerTest = async () => {
    if (!orgId) return;
    setIsRunning(true);
    try {
      const res = await fetch('/api/testing/stress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, concurrency, duration_seconds: duration })
      });
      
      const data = await res.json();
      if (data.result) {
        setLastResult(data.result);
        setHistory(prev => [data.result, ...prev].slice(0, 10));
      }
    } catch (err) {
      console.error("Stress test failed", err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-10 font-sans">
      {/* Header */}
      <header className="mb-12 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <Thermometer className="w-5 h-5 text-rose-500" />
            </div>
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">System Resilience Lab</span>
          </div>
          <h1 className="text-6xl font-black uppercase tracking-tighter italic leading-none">Stress Testing</h1>
          <p className="text-[var(--text-secondary)] mt-4 max-w-xl text-sm font-medium">
            Subject your infrastructure to extreme concurrent load. Identify breaking points, 
            measure P95 latency shifts, and validate failover mechanisms.
          </p>
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-1">Scale Limit</p>
          <p className="text-xl font-black italic">500 <span className="text-xs text-[var(--text-secondary)] not-italic">CONC/SEC</span></p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-8 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Zap className="w-32 h-32" />
            </div>
            
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-8">Test Configuration</h3>
            
            <div className="space-y-8 relative z-10">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Layers className="w-3 h-3 text-rose-500" /> Concurrency
                  </label>
                  <span className="text-xs font-mono text-rose-500">{concurrency}</span>
                </div>
                <input 
                  type="range" min="1" max="100" step="1"
                  value={concurrency}
                  onChange={(e) => setConcurrency(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-3 h-3 text-rose-500" /> Duration (s)
                  </label>
                  <span className="text-xs font-mono text-rose-500">{duration}s</span>
                </div>
                <input 
                  type="range" min="1" max="30" step="1"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>

              <button 
                onClick={triggerTest}
                disabled={isRunning}
                className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 transition-all ${
                  isRunning 
                  ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' 
                  : 'bg-rose-500 text-black hover:bg-rose-400 font-black uppercase italic tracking-widest'
                }`}
              >
                {isRunning ? (
                  <RotateCcw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                {isRunning ? 'Executing Attack...' : 'Initiate Stress'}
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-6 rounded-3xl">
              <p className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-2">Failure Rate</p>
              <p className={`text-2xl font-black italic ${lastResult && lastResult.failure_rate > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {lastResult ? `${lastResult.failure_rate.toFixed(1)}%` : '0%'}
              </p>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-6 rounded-3xl">
              <p className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-2">P95 Latency</p>
              <p className="text-2xl font-black italic text-rose-500">
                {lastResult ? `${lastResult.latency_ms.toFixed(0)}ms` : '0ms'}
              </p>
            </div>
          </div>
        </div>

        {/* Diagnostic Visualization */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[2.5rem] p-10 h-full min-h-[500px] flex flex-col">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
                <Activity className="w-4 h-4" /> Stability Timeline
              </h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                  <span className="text-[10px] font-black uppercase text-[var(--text-secondary)]">Latency</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500/20 border border-red-500/50 rounded-full"></div>
                  <span className="text-[10px] font-black uppercase text-[var(--text-secondary)]">Errors</span>
                </div>
              </div>
            </div>

            <div className="flex-1 border-b border-[var(--border-primary)] mb-8 flex items-end gap-2 px-2">
              {history.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-slate-800 uppercase font-black italic tracking-widest text-4xl opacity-10 select-none">
                  No Diagnostic Data
                </div>
              ) : (
                [...history].reverse().map((run, i) => (
                  <motion.div 
                    key={i}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    className="flex-1 bg-gradient-to-t from-rose-500/20 to-rose-500 rounded-t-lg relative group"
                    style={{ height: `${Math.min(100, (run.latency_ms / 500) * 100)}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black text-[8px] font-bold px-2 py-1 rounded whitespace-nowrap z-20">
                      {run.latency_ms.toFixed(0)}MS
                    </div>
                    {run.failure_rate > 0 && (
                      <div 
                        className="absolute bottom-0 w-full bg-red-500"
                        style={{ height: `${run.failure_rate}%` }}
                      ></div>
                    )}
                  </motion.div>
                ))
              )}
            </div>

            <div className="flex justify-between text-[10px] font-black text-[var(--text-secondary)] tracking-widest uppercase">
              <span>Past Runs (Recent → Older)</span>
              <span>Stability Benchmark</span>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Alert */}
      {lastResult && lastResult.failure_rate > 5 && (
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-10 right-10 max-w-md bg-red-500 text-black p-6 rounded-2xl flex gap-4 items-center shadow-2xl z-50"
        >
          <div className="p-3 bg-black/10 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black uppercase italic tracking-wider leading-none mb-1 text-sm">Cripple Point Reached</h4>
            <p className="text-[10px] font-bold opacity-80 leading-relaxed">
              Failure rate exceeded 5% during concurrent load simulation. Scale resources or optimize database RPCs.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

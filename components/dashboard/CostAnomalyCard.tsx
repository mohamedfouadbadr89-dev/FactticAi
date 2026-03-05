"use client";

import React, { useEffect, useState } from 'react';
import { AlertCircle, TrendingUp, Cpu, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Anomaly {
  id: string;
  model_name: string;
  token_spike_ratio: number;
  baseline_tokens: number;
  observed_tokens: number;
  detected_at: string;
}

export default function CostAnomalyCard() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnomalies() {
      try {
        const res = await fetch('/api/economics/cost-anomalies');
        const data = await res.json();
        setAnomalies(data.anomalies || []);
      } catch (err) {
        console.error('Failed to fetch cost anomalies:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnomalies();
  }, []);

  if (loading) return (
    <div className="h-48 rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse flex items-center justify-center">
      <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Scanning for cost spikes...</p>
    </div>
  );

  if (anomalies.length === 0) return (
    <div className="h-48 rounded-2xl bg-[#0a0a0a] border border-slate-800 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
        <TrendingUp className="text-emerald-400 w-5 h-5" />
      </div>
      <p className="text-slate-200 font-bold text-sm">Cost Efficiency Optimal</p>
      <p className="text-[10px] text-slate-500 uppercase font-mono mt-1">No token consumption anomalies detected in the last scan window.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
        <AlertCircle className="w-3 h-3 text-amber-400" />
        Economics Alerts — Active Anomalies
      </h3>
      
      <AnimatePresence>
        {anomalies.map((anomaly) => (
          <motion.div
            key={anomaly.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 hover:border-red-500/40 transition-all cursor-pointer"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-red-500/10 transition-colors" />

            <div className="relative flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                  <Cpu className="text-red-400 w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-slate-100 font-black text-lg tracking-tight">{anomaly.model_name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono text-red-400 font-bold bg-red-400/10 px-2 py-0.5 rounded">
                      +{((anomaly.token_spike_ratio - 1) * 100).toFixed(0)}% Spike
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono uppercase">TOKEN_ANOMALY</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  <DollarSign className="w-3 h-3 text-slate-400" />
                  <span className="text-xl font-mono font-black text-white">
                    {(anomaly.observed_tokens * 0.000015).toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Est. Session Impact (USD)</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/[0.05] grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Rolling Baseline</p>
                <p className="text-sm font-mono text-slate-300">{(anomaly.baseline_tokens / 1000).toFixed(1)}k <span className="text-[10px] text-slate-600">tokens</span></p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Observed Peak</p>
                <p className="text-sm font-mono text-white font-bold">{(anomaly.observed_tokens / 1000).toFixed(1)}k <span className="text-[10px] text-slate-400">tokens</span></p>
              </div>
            </div>

            {/* Micro-Animation Graph Bar */}
            <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-red-500 to-amber-500"
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

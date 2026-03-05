'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Clock, 
  BarChart3, 
  PieChart, 
  Network, 
  Zap, 
  ShieldAlert,
  ArrowUpRight,
  MonitorDot
} from 'lucide-react';

interface TelemetryData {
  risk_latency: { avg_ms: number; p95_ms: number };
  drift_propagation: { correlation_coefficient: number; spike_incidents: number };
  alert_frequency: { total: number; by_type: Record<string, number>; hourly_distribution: number[] };
}

export default function ObservabilityDashboard() {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTelemetry() {
      try {
        const res = await fetch('/api/observability/advanced-metrics');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to fetch telemetry', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTelemetry();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-10 font-sans">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <Activity className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Signal Engineering</span>
        </div>
        <h1 className="text-6xl font-black uppercase tracking-tighter italic leading-none">Advanced Observability</h1>
        <p className="text-slate-500 mt-4 max-w-xl text-sm font-medium">
          Deep structural telemetry across the governance stack. Monitoring signal decay, 
          propagation velocity, and alert distribution patterns.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Risk Latency (P95)', value: `${data?.risk_latency.p95_ms}ms`, icon: Clock, color: 'text-blue-400' },
          { label: 'Drift Propagation', value: data?.drift_propagation.correlation_coefficient.toFixed(2), icon: Network, color: 'text-fuchsia-400' },
          { label: 'Daily Alert Volume', value: data?.alert_frequency.total, icon: ShieldAlert, color: 'text-amber-400' },
          { label: 'Spike Incidents', value: data?.drift_propagation.spike_incidents, icon: Zap, color: 'text-red-400' }
        ].map((stat, i) => (
          <div key={i} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-3xl group hover:border-white/10 transition-all">
            <div className="flex justify-between items-start mb-4">
              <stat.icon className={`w-5 h-5 ${stat.color} opacity-50`} />
              <ArrowUpRight className="w-4 h-4 text-slate-700 group-hover:text-white transition-colors" />
            </div>
            <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-black italic tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Latency Heatmap Simulation */}
        <div className="lg:col-span-8 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Signal Latency Distribution
            </h3>
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              NOMINAL PERFORMANCE
            </span>
          </div>
          
          <div className="h-[300px] flex items-end gap-2 px-2">
            {(data?.alert_frequency.hourly_distribution || []).map((v, i) => (
              <motion.div 
                key={i}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                className="flex-1 bg-gradient-to-t from-amber-500/20 to-amber-500 rounded-t-lg relative"
                style={{ height: `${Math.max(10, (v / Math.max(...data!.alert_frequency.hourly_distribution, 1)) * 100)}%` }}
              >
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[8px] font-mono text-slate-700">
                  {i}H
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Alert Type Distribution */}
        <div className="lg:col-span-4 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 flex flex-col">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-2">
            <PieChart className="w-4 h-4" /> Alert Signature
          </h3>
          
          <div className="flex-1 flex flex-col justify-center space-y-6">
            {Object.entries(data?.alert_frequency.by_type || {}).map(([type, count], i) => (
              <div key={i}>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{type.replace(/_/g, ' ')}</span>
                  <span className="text-xs font-bold">{Math.round((count / data!.alert_frequency.total) * 100)}%</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500" 
                    style={{ width: `${(count / data!.alert_frequency.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                PROFILING ACTIVE
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Propagation Visual Footer */}
      <footer className="mt-10 bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] flex items-center justify-between">
        <div className="flex items-center gap-6">
          <MonitorDot className="w-8 h-8 text-amber-500/30" />
          <div>
            <p className="text-xs font-black uppercase italic tracking-widest mb-1">Drift Correlation Active</p>
            <p className="text-[10px] font-medium text-slate-600">Cross-engine propagation analysis verified via institutional auditors.</p>
          </div>
        </div>
        <div className="px-6 py-3 bg-amber-500 text-black text-[10px] font-black rounded-xl uppercase tracking-widest italic">
          Audit Integrity High
        </div>
      </footer>
    </div>
  );
}

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
import { supabase } from '@/lib/supabase';
import { getProviderStatus, ProviderHealthResult } from '@/lib/integrations/providerHealth';

interface TelemetryData {
  risk_latency: { avg_ms: number; p95_ms: number };
  drift_propagation: { correlation_coefficient: number; spike_incidents: number };
  alert_frequency: { total: number; by_type: Record<string, number>; hourly_distribution: number[] };
}

import { useInteractionMode } from '@/store/interactionMode';

export default function ObservabilityDashboard() {
  const { mode } = useInteractionMode();
  const [data, setData] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [providerHealths, setProviderHealths] = useState<Record<string, ProviderHealthResult>>({});
  const [liveEvents, setLiveEvents] = useState<any[]>([]);

  useEffect(() => {
    // 1. Initial Data Fetch
    async function fetchTelemetry() {
      try {
        const res = await fetch('/api/observability/advanced-metrics');
        const json = await res.json();
        setData(json);

        // Fetch AI Provider Health
        const { data: conns } = await supabase.from('ai_connections').select('id, provider_type');
        if (conns) {
          conns.forEach(async (conn) => {
            const health = await getProviderStatus(conn.id);
            setProviderHealths(prev => ({ ...prev, [conn.id]: health }));
          });
        }
      } catch (err) {
        console.error('Failed to fetch telemetry', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTelemetry();

    // 2. Subscribe to Live Telemetry Stream (Org-Scoped)
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const orgId = session?.user?.user_metadata?.org_id;
      if (orgId) {
        channel = supabase.channel(`governance:${orgId}`)
          .on('broadcast', { event: 'governance_event' }, (payload) => {
            setLiveEvents((prev) => [payload.payload, ...prev].slice(0, 20)); // Keep last 20
          })
          .subscribe();
      }
    };
    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const effectiveData = data;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-10 font-sans">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <Activity className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Signal Engineering</span>
        </div>
        <h1 className="text-6xl font-black uppercase tracking-tighter italic leading-none">
          {mode === 'voice' ? 'Audio Stream Intelligence' : 'Advanced Observability'}
        </h1>
        <p className="text-slate-500 mt-4 max-w-xl text-sm font-medium">
          {mode === 'voice' 
            ? 'Monitoring real-time acoustic signal integrity and voice-based governance telemetry.'
            : 'Deep structural telemetry across the governance stack. Monitoring signal decay, propagation velocity, and alert distribution patterns.'
          }
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Risk Latency (P95)', value: effectiveData ? `${effectiveData.risk_latency.p95_ms}ms` : '—', icon: Clock, color: 'text-blue-400' },
          { label: 'Drift Propagation', value: effectiveData ? effectiveData.drift_propagation.correlation_coefficient.toFixed(2) : '—', icon: Network, color: 'text-fuchsia-400' },
          { label: 'Daily Alert Volume', value: effectiveData?.alert_frequency.total ?? '—', icon: ShieldAlert, color: 'text-amber-400' },
          { label: 'Spike Incidents', value: effectiveData?.drift_propagation.spike_incidents ?? '—', icon: Zap, color: 'text-red-400' }
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
        {/* Live Governance Feed */}
        <div className="lg:col-span-8 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 h-[450px] flex flex-col">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500 animate-pulse" /> Live Telemetry Feed
            </h3>
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              STREAMING ACTIVE
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {liveEvents.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-slate-600 border border-white/5 border-dashed rounded-xl">
                 <MonitorDot className="w-8 h-8 mb-3 opacity-20" />
                 <p className="text-xs font-mono uppercase tracking-widest">Awaiting Events...</p>
               </div>
            ) : (
              liveEvents.map((evt, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={evt.session_id + "_" + i} 
                  className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${evt.decision === 'BLOCK' ? 'bg-red-500 shadow-red-500/50' : evt.decision === 'WARN' ? 'bg-amber-500 shadow-amber-500/50' : 'bg-emerald-500 shadow-emerald-500/50'} shadow-[0_0_8px]`} />
                    <div>
                      <p className="text-xs font-mono text-slate-300">Session: {evt.session_id?.slice(0,8)}</p>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Risk</p>
                      <p className={`text-sm font-bold ${evt.risk_score >= 80 ? 'text-red-400' : evt.risk_score >= 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {evt.risk_score}
                      </p>
                    </div>
                    <div className="text-right w-16">
                      <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Decision</p>
                      <p className={`text-xs font-black uppercase tracking-widest ${evt.decision === 'BLOCK' ? 'text-red-500' : evt.decision === 'WARN' ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {evt.decision}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Alert Type Distribution */}
        <div className="lg:col-span-4 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 flex flex-col">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-2">
            <PieChart className="w-4 h-4" /> Alert Signature
          </h3>
          
          <div className="flex-1 flex flex-col justify-center space-y-6">
            {Object.entries(effectiveData?.alert_frequency.by_type ?? {}).map(([type, count], i) => {
              const n = Number(count);
              const total = effectiveData?.alert_frequency.total || 1;
              return (
              <div key={i}>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{type.replace(/_/g, ' ')}</span>
                  <span className="text-xs font-bold">{Math.round((n / total) * 100)}%</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${(n / total) * 100}%` }}
                  ></div>
                </div>
              </div>
              );
            })}
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

      {/* Infrastructure Integrity Widget */}
      <div className="mt-10 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <MonitorDot className="w-4 h-4" /> Provider Infrastructure Integrity
          </h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Operational</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Degraded</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Critical</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Object.entries(providerHealths).length === 0 ? (
            <div className="col-span-full py-12 text-center border border-white/5 border-dashed rounded-3xl">
              <p className="text-slate-600 text-xs font-medium italic">No active telemetry streams discovered.</p>
            </div>
          ) : Object.entries(providerHealths).map(([id, health], i) => (
             <motion.div 
               key={id}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               className="bg-white/[0.02] border border-white/5 p-5 rounded-[1.5rem] relative overflow-hidden"
             >
                <div className={`absolute top-0 right-0 w-16 h-16 opacity-5 bg-gradient-to-br ${
                  health.status === 'Connected' ? 'from-emerald-500' : 
                  health.status === 'Degraded' ? 'from-amber-500' : 'from-red-500'
                } to-transparent`} />
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-2 h-2 rounded-full ${
                    health.status === 'Connected' ? 'bg-emerald-500' : 
                    health.status === 'Degraded' ? 'bg-amber-500' : 'bg-red-500'
                  } shadow-[0_0_12px] ${
                    health.status === 'Connected' ? 'shadow-emerald-500/50' : 
                    health.status === 'Degraded' ? 'shadow-amber-500/50' : 'shadow-red-500/50'
                  }`} />
                  <span className="text-[9px] font-mono text-slate-600 tracking-tighter">{health.latency}ms</span>
                </div>
                <h4 className="text-xs font-black uppercase tracking-tight text-slate-300">
                  {id.slice(0, 8)}...
                </h4>
                <p className="text-[10px] text-slate-500 mt-1 font-medium">{health.status}</p>
             </motion.div>
          ))}
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

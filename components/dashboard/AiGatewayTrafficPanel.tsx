'use client';

import React from 'react';
import { Globe, Zap, RefreshCw, Activity } from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';

const PROVIDER_COLORS: Record<string, string> = {
  openai: '#10b981',
  anthropic: '#3b82f6',
  google: '#ef4444',
  mistral: '#f59e0b'
};

export default function AiGatewayTrafficPanel() {
  const [data, setData] = React.useState<{ recent: any[], stats: any } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [seeding, setSeeding] = React.useState(false);

  const fetchData = React.useCallback(async (seed = false) => {
    if (seed) setSeeding(true); else if (!data) setLoading(true);
    try {
      const res = await fetch(`/api/gateway/ai${seed ? '?seed=true' : ''}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (e) {
      console.error('[AiGatewayTrafficPanel]', e);
    } finally {
      setLoading(false);
      setSeeding(false);
    }
  }, [data]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const pieData = data?.stats?.by_provider
    ? Object.entries(data.stats.by_provider).map(([name, value]) => ({ name, value: value as number }))
    : [];

  const latencyData = data?.recent.map((r: any, i: number) => ({
    index: i,
    latency: Number(r.latency_ms),
    time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  })).reverse() || [];

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 h-64 flex items-center justify-center animate-pulse">
        <Globe className="w-8 h-8 text-[#333] animate-bounce" />
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#2d2d2d]">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-[#3b82f6]" />
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase text-white">AI Gateway Traffic</h2>
            <p className="text-[10px] text-[#9ca3af] font-mono mt-0.5">Centralized routing telemetry — provider distribution and latency.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#444] hover:border-[#3b82f6] text-[#555] hover:text-[#3b82f6] rounded text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            {seeding ? <Activity className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            Seed Demo
          </button>
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#444] hover:border-[#3b82f6] text-[#9ca3af] hover:text-[#3b82f6] rounded text-[9px] font-black uppercase tracking-widest transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {!data || data.recent.length === 0 ? (
        <div className="text-center py-16">
          <Globe className="w-12 h-12 text-[#333] mx-auto mb-4" />
          <p className="text-xs font-black uppercase tracking-widest text-[#555]">No gateway traffic logged</p>
          <p className="text-[10px] text-[#444] font-mono mt-1">Route LLM requests through /api/gateway/ai to see metrics.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#555]">Provider Distribution</p>
                <div className="flex items-center gap-4">
                   {Object.keys(PROVIDER_COLORS).map(p => (
                     <div key={p} className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PROVIDER_COLORS[p] }} />
                        <span className="text-[8px] font-black uppercase tracking-widest text-[#555] font-mono">{p}</span>
                     </div>
                   ))}
                </div>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PROVIDER_COLORS[entry.name as string] || '#333'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4">
                 <p className="text-[9px] font-black uppercase tracking-widest text-[#555] mb-1">Avg Latency</p>
                 <p className="text-xl font-black text-white">{data.stats.avg_latency_ms}ms</p>
               </div>
               <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4">
                 <p className="text-[9px] font-black uppercase tracking-widest text-[#555] mb-1">Avg Risk</p>
                 <p className="text-xl font-black text-[#3b82f6]">{data.stats.avg_risk_score.toFixed(1)}%</p>
               </div>
            </div>
          </div>

          <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#555] mb-6">Execution Latency (Last 100)</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={latencyData}>
                  <defs>
                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis stroke="#444" fontSize={10} tickFormatter={(v) => `${v}ms`} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '10px' }} />
                  <Area type="monotone" dataKey="latency" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLatency)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 pt-4 border-t border-[#222]">
               <p className="text-[10px] font-black uppercase tracking-widest text-[#555] mb-3">Live Traffic Stream</p>
               <div className="space-y-2">
                 {data.recent.slice(0, 3).map((r: any) => (
                   <div key={r.id} className="flex items-center justify-between text-[10px] font-mono">
                      <div className="flex items-center gap-2 text-white">
                         <span className="uppercase font-black" style={{ color: PROVIDER_COLORS[r.provider] }}>{r.provider}</span>
                         <span className="text-[#555]">{r.model}</span>
                      </div>
                      <div className="flex gap-4">
                         <span className="text-[#9ca3af]">{r.latency_ms}ms</span>
                         <span style={{ color: Number(r.risk_score) > 70 ? '#ef4444' : '#3b82f6' }}>{Number(r.risk_score).toFixed(0)}%</span>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

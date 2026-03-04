'use client';

import React from 'react';
import { ShieldAlert, Activity, RefreshCw, ShieldCheck, ShieldX, Edit3, AlertTriangle } from 'lucide-react';

export default function RuntimeInterceptsPanel() {
  const [data, setData] = React.useState<{ events: any[], stats: any } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [seeding, setSeeding] = React.useState(false);

  const fetchData = React.useCallback(async (seed = false) => {
    if (seed) setSeeding(true); else setLoading(true);
    try {
      const res = await fetch(`/api/runtime/intercept${seed ? '?seed=true' : ''}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (e) {
      console.error('[RuntimeInterceptsPanel]', e);
    } finally {
      setLoading(false);
      setSeeding(false);
    }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const actionStyle = (action: string) => {
    switch (action) {
      case 'allow':   return { color: '#10b981', icon: ShieldCheck, badge: 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/30' };
      case 'warn':    return { color: '#3b82f6', icon: ShieldAlert, badge: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30' };
      case 'block':   return { color: '#ef4444', icon: ShieldX,     badge: 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30' };
      case 'rewrite': return { color: '#f59e0b', icon: Edit3,       badge: 'text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/30' };
      case 'escalate':return { color: '#a855f7', icon: AlertTriangle, badge: 'text-[#a855f7] bg-[#a855f7]/10 border-[#a855f7]/30' };
      default:        return { color: '#9ca3af', icon: Activity,     badge: 'text-[#9ca3af] bg-[#9ca3af]/10 border-[#9ca3af]/30' };
    }
  };

  if (loading && !data) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 h-64 flex items-center justify-center animate-pulse">
        <ShieldAlert className="w-8 h-8 text-[#333] animate-bounce" />
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#2d2d2d]">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-[#ef4444]" />
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase text-white">Runtime Intercepts</h2>
            <p className="text-[10px] text-[#9ca3af] font-mono mt-0.5">Active AI response control — blocking and rewriting hazardous signals.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#444] hover:border-[#ef4444] text-[#555] hover:text-[#ef4444] rounded text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            {seeding ? <Activity className="w-3 h-3 animate-spin" /> : <ShieldAlert className="w-3 h-3" />}
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

      {!data || data.events.length === 0 ? (
        <div className="text-center py-16">
          <ShieldAlert className="w-12 h-12 text-[#333] mx-auto mb-4" />
          <p className="text-xs font-black uppercase tracking-widest text-[#555]">No active intercepts detected</p>
          <p className="text-[10px] text-[#444] font-mono mt-1">Runtime control layer is monitoring Stage 7.75.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Scanned', val: data.stats.total, color: 'text-white' },
              { label: 'Blocked',       val: data.stats.blocked, color: 'text-[#ef4444]' },
              { label: 'Rewritten',     val: data.stats.rewritten, color: 'text-[#f59e0b]' },
              { label: 'Avg Risk',      val: `${data.stats.avg_risk.toFixed(1)}%`, color: 'text-[#3b82f6]' },
            ].map((s) => (
              <div key={s.label} className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#555] mb-1">{s.label}</p>
                <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#555] mb-4">Active Decision Feed</p>
            {data.events.map((event: any) => {
              const s = actionStyle(event.action);
              const Icon = s.icon;
              return (
                <div key={event.id} className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 hover:border-[#444] transition-colors group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-[#1a1a1a] border border-[#2d2d2d] group-hover:border-[#444] transition-colors">
                        <Icon className="w-4 h-4" style={{ color: s.color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${s.badge}`}>
                            {event.action}
                          </span>
                          <span className="text-xs font-black text-white font-mono">{event.model_name}</span>
                        </div>
                        <p className="text-[10px] text-[#9ca3af] font-mono leading-relaxed max-w-xl">
                          {event.payload?.reason || 'System decision enacted.'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#555] mb-0.5">Risk Score</p>
                      <p className="text-sm font-black text-white" style={{ color: Number(event.risk_score) > 70 ? '#ef4444' : '#3b82f6' }}>
                        {Number(event.risk_score).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="h-1 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${event.risk_score}%`, backgroundColor: Number(event.risk_score) > 70 ? '#ef4444' : s.color }} 
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[9px] font-mono text-[#444] uppercase tracking-widest font-black">
                    <div className="flex gap-4">
                      <span>SID: {event.session_id.slice(0, 8)}...</span>
                      {event.payload?.was_rewritten && <span className="text-[#f59e0b]">Safety Rewrite Active</span>}
                    </div>
                    <span>{new Date(event.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

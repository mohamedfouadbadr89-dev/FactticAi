'use client';

import React, { useState, useEffect } from 'react';
import { Network, ServerOff, CheckCircle2, RotateCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ConnectorHealthStatus } from '@/src/connectors/types';

export default function IntegrationsClient() {
  const [statuses, setStatuses] = useState<ConnectorHealthStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatuses = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const res = await fetch('/api/integrations/status');
      if (!res.ok) {
        if (res.status === 403) throw new Error('Requires Administrative Priveleges.');
        throw new Error('Failed to fetch telemetry states.');
      }
      const data = await res.json();
      setStatuses(data.statuses);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />;
      case 'degraded': return <AlertTriangle className="w-5 h-5 text-[var(--warning)]" />;
      case 'down': return <ServerOff className="w-5 h-5 text-red-500" />;
      default: return <ShieldCheck className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <RotateCw className="w-8 h-8 animate-spin text-[var(--accent)] opacity-50" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-[fadeIn_.4s_ease-in-out]">
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Active Telemetry Bindings</h2>
          <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">Real-time health reporting for institutional integrations.</p>
        </div>
        <button 
          onClick={fetchStatuses}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-xs font-bold uppercase tracking-widest hover:border-[var(--accent)] transition-all disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Ping Mesh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {statuses.length === 0 && !error ? (
          <div className="col-span-full p-12 text-center rounded-2xl border border-dashed border-[var(--border-primary)]">
            <Network className="w-8 h-8 text-[var(--text-secondary)] mx-auto mb-4 opacity-50" />
            <div className="text-sm font-bold text-[var(--text-primary)]">No Subsystems Registered</div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">The connector registry is currently empty.</div>
          </div>
        ) : (
          statuses.map((s) => (
            <div key={s.service} className="card p-6 relative overflow-hidden group hover:border-[var(--accent)]/50 transition-colors duration-500">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    s.status === 'healthy' ? 'bg-[var(--success)]/10 border-[var(--success)]/20' :
                    s.status === 'down' ? 'bg-red-500/10 border-red-500/20' :
                    'bg-[var(--bg-secondary)] border-[var(--border-primary)]'
                  }`}>
                    {getStatusIcon(s.status)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tighter uppercase">{s.service}</h3>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] opacity-50" />
                      Connector Hub V1
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-xs font-black uppercase tracking-widest ${
                    s.status === 'healthy' ? 'text-[var(--success)]' :
                    s.status === 'down' ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {s.status}
                  </div>
                  {s.latencyMs !== undefined && (
                    <div className="text-[10px] text-[var(--text-secondary)] font-mono mt-1">
                      {s.latencyMs}ms ping
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-[var(--border-primary)]">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--text-secondary)] font-medium">Last Verified</span>
                  <span className="font-mono">{new Date(s.lastChecked).toLocaleTimeString()}</span>
                </div>
                
                {s.details && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-mono text-red-400 break-words">
                    {s.details}
                  </div>
                )}
                
                <div className="flex gap-3 pt-2">
                  <button className="flex-1 bg-[var(--bg-secondary)] py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[var(--accent)] hover:text-white transition-colors border border-[var(--border-primary)]">
                    Configure
                  </button>
                  <button className="flex-1 bg-[var(--bg-secondary)] py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-colors border border-[var(--border-primary)]">
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

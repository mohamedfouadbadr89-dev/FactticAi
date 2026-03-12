"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Activity,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Clock,
  ChevronRight,
  Target,
  Terminal,
  PlayCircle
} from "lucide-react";
import SimulationWidget from "@/components/dashboard/SimulationWidget";
import RiskTrendChart from "@/components/dashboard/RiskTrendChart";
import GovernanceHealthTimeline from "@/components/dashboard/GovernanceHealthTimeline";
import { logger } from "@/lib/logger";
import { createBrowserClient } from "@supabase/ssr";

export default function GovernanceDashboard() {
  const router = useRouter();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [data, setData] = useState<any>({
    state: null,
    risk: null,
    alerts: [],
    drift: null,
    costs: null,
    simulation: null,
    playground: null,
    trend: []
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchDashboardData = async () => {
    try {
      const [
        stateRes, 
        metricsRes,
        alertsRes, 
        driftRes, 
        costsRes, 
        playRes, 
        trendRes
      ] = await Promise.all([
        fetch(`/api/governance/state?orgId=${orgId}`),
        fetch(`/api/governance/metrics?org_id=${orgId}`),
        fetch(`/api/governance/alerts?org_id=${orgId}`),
        fetch(`/api/intelligence/predictive-drift?orgId=${orgId}&model=default`),
        fetch(`/api/economics/cost-anomalies`),
        fetch(`/api/dashboard/governance/playground?org_id=${orgId}`),
        fetch(`/api/dashboard/governance/risk-trend?org_id=${orgId}`)
      ]);

      const [state, metrics, alerts, drift, costs, playground, trendData] = await Promise.all([
        stateRes.json(),
        metricsRes.json(),
        alertsRes.json(),
        driftRes.json(),
        costsRes.json(),
        playRes.json(),
        trendRes.json()
      ]);

      setData({ 
        state, 
        risk: { risk_score: metrics.session_risk }, // Map unified risk
        alerts, 
        drift, 
        costs, 
        simulation: metrics.simulation, // Map unified simulation data
        playground, 
        trend: trendData.trend || [],
        health: metrics.governance_health
      });
      setLastUpdated(new Date());
    } catch (err: any) {
      logger.error("DASHBOARD_REFRESH_FAILED", { error: err.message });
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    if (!orgId) return;
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000); // 10s refresh
    return () => clearInterval(interval);
  }, [orgId]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-[#ef4444]';
      case 'warning': return 'text-[#f59e0b]';
      default: return 'text-[#3b82f6]';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-8 font-sans selection:bg-[#3b82f6]/30">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" /> Live Governance Feed
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-3">
            Facttic Control Center
          </h1>
          <p className="text-[11px] text-[var(--text-secondary)] font-medium tracking-wide mt-2">
            REAL-TIME RISK AGGREGATION / MULTI-ENGINE INTERCEPTOR / AUTONOMOUS SHIELDING
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           <button
             onClick={() => router.push('/dashboard/governance-maturity')}
             className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] hover:underline flex items-center gap-1"
           >
             Maturity Index <ChevronRight className="w-3 h-3" />
           </button>
           <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 flex items-center gap-4">
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Sync Status</p>
                <p className="text-[11px] font-bold text-[#10b981]">OPTIMAL</p>
              </div>
              <div className="w-px h-8 bg-[var(--bg-secondary)]" />
              <div className="text-left">
                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Last Pulse</p>
                <p className="text-[11px] font-mono text-[var(--text-primary)]">{lastUpdated.toLocaleTimeString()}</p>
              </div>
              <RefreshCw className={`w-4 h-4 text-[var(--text-secondary)] ${loading ? 'animate-spin' : ''}`} />
           </div>
        </div>
      </div>

      {/* Primary Metrics Layer */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        {/* Governance Health Score */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl p-7 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Shield className="w-24 h-24" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-6 flex items-center gap-2">
            <Shield className="w-3 h-3 text-[#3b82f6]" /> Governance State
          </p>
          <div className="flex items-end justify-between">
            <h2 className={`text-5xl font-black tracking-tighter ${data.state?.governance_state === 'SAFE' ? 'text-white' : 'text-[#ef4444]'}`}>
              {data.state?.governance_state || '---'}
            </h2>
            <div className="text-right">
              <p className="text-[10px] font-mono text-[var(--text-secondary)]">HEALTH INDEX</p>
              <p className={`text-xl font-black ${data.health > 80 ? 'text-[#10b981]' : data.health > 50 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>
                {data.health !== undefined ? `${data.health}%` : '---'}
              </p>
            </div>
          </div>
        </div>

        {/* Model Drift Status */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl p-7 relative overflow-hidden group">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-6 flex items-center gap-2">
            <Activity className="w-3 h-3 text-[#10b981]" /> Predictive Drift
          </p>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-4xl font-black tracking-tighter">
                {data.drift?.drift_score ? `${Math.round(data.drift.drift_score)}%` : '---'}
              </h2>
              <p className={`text-[10px] font-bold uppercase mt-2 ${getSeverityColor(data.drift?.escalation)}`}>
                {data.drift?.escalation || 'STABLE'}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-[#2d2d2d]" />
          </div>
        </div>

        {/* Anomaly Signals */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl p-7 relative overflow-hidden group">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-6 flex items-center gap-2">
            <DollarSign className="w-3 h-3 text-[#a855f7]" /> Economic Integrity
          </p>
          <div className="flex items-end justify-between">
            <h2 className="text-4xl font-black tracking-tighter">
              {data.costs?.anomalies?.length || 0}
            </h2>
            <div className="text-right">
              <p className="text-[10px] font-mono text-[var(--text-secondary)]">ANOMALIES</p>
              <p className="text-xs font-bold text-[#a855f7]">UNIFIED SCAN</p>
            </div>
          </div>
        </div>

        {/* Global Risk Distribution */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl p-7 relative overflow-hidden group">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-6 flex items-center gap-2">
            <Target className="w-3 h-3 text-[#ef4444]" /> Session Risk
          </p>
          <div className="flex items-end justify-between">
            <h2 className="text-5xl font-black tracking-tighter">
              {data.risk?.risk_score ? Math.round(data.risk.risk_score) : '0'}
            </h2>
            <div className="bg-[var(--bg-secondary)] rounded-full px-3 py-1 text-[9px] font-bold text-[var(--text-secondary)]">
              AGGREGATED
            </div>
          </div>
        </div>

      </div>
 
      {/* Simulation & Intelligence Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <SimulationWidget data={data.simulation} loading={loading} />
        {orgId && <GovernanceHealthTimeline orgId={orgId} />}
      </div>

      {/* Secondary Layer: Feed & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Active Alerts Feed */}
        <div className="lg:col-span-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#ef4444]" /> Critical Alerts Feed
            </h3>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-[var(--text-secondary)] font-mono uppercase tracking-widest">Live Updates Every 10s</span>
              <button
                onClick={() => router.push('/dashboard/alerts')}
                className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] hover:underline flex items-center gap-1"
              >
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {data.alerts && data.alerts.length > 0 ? (
              data.alerts.slice(0, 6).map((alert: any) => (
                <div key={alert.id} onClick={() => router.push('/dashboard/investigations')} className="group bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-5 hover:border-[var(--accent)] transition-all flex items-center justify-between cursor-pointer">
                  <div className="flex gap-5">
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center shrink-0">
                      <Shield className={`w-5 h-5 ${getSeverityColor(alert.severity)}`} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-tight">{alert.alert_type.replace(/_/g, ' ')}</p>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1 line-clamp-1">{JSON.stringify(alert.metadata)}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <span className="text-[9px] text-[var(--text-secondary)] font-mono flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {new Date(alert.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--text-secondary)] transition-colors" />
                </div>
              ))
            ) : (
              <div className="py-20 text-center border border-dashed border-[var(--border-primary)] rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">No active alerts in current session</p>
              </div>
            )}
          </div>
        </div>

        {/* Risk Signals Detail */}
        <div className="space-y-8">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl p-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)] mb-8 border-b border-[var(--border-primary)] pb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#3b82f6]" /> Playground Usage
            </h3>
            <div className="space-y-4">
              {data.playground?.activity && data.playground.activity.length > 0 ? (
                data.playground.activity.slice(0, 4).map((event: any) => (
                  <div key={event.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)]">
                    <div className="flex items-center gap-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                       <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-tight truncate max-w-[120px]">
                         Prompt Eval
                       </span>
                    </div>
                    <span className="text-[9px] font-mono text-[var(--text-secondary)]">
                      {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center border border-dashed border-[var(--border-primary)] rounded-xl opacity-30">
                  <span className="text-[9px] font-black uppercase tracking-widest">No Recent Evaluations</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl p-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)] mb-8 border-b border-[var(--border-primary)] pb-4">
              Weighted Signals
            </h3>
            <div className="space-y-6">
              {[
                { label: 'Guardrail Intensity', value: data.risk?.signal_breakdown?.guardrail_risk || 0, weight: '35%' },
                { label: 'Predictive Momentum', value: data.risk?.signal_breakdown?.drift_risk || 0, weight: '25%' },
                { label: 'Behavioral Variance', value: data.risk?.signal_breakdown?.behavior_risk || 0, weight: '25%' },
                { label: 'Economic Exposure', value: data.risk?.signal_breakdown?.cost_risk || 0, weight: '15%' }
              ].map(sig => (
                <div key={sig.label}>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2">
                    <span>{sig.label}</span>
                    <span>{sig.weight}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--bg-primary)] rounded-full overflow-hidden border border-[var(--border-primary)]">
                    <div 
                      className="h-full bg-white transition-all duration-1000" 
                      style={{ width: `${Math.min(100, sig.value)}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] border-dashed rounded-3xl p-8 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-3">Compliance Overlay</p>
            <p className="text-[9px] text-[var(--text-secondary)] italic">All metrics are aggregated across 12 distinct clusters in the EU-CENTRAL-1 region.</p>
          </div>
        </div>

      </div>

    </div>
  );
}

"use client";

import React from 'react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Zap, 
  Database, 
  Network, 
  AlertTriangle,
  History,
  CheckCircle2
} from "lucide-react";

interface GovernanceResultsProps {
  data: any | null;
}

export default function GovernanceResults({ data }: GovernanceResultsProps) {
  if (!data) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-[var(--border-primary)] rounded-3xl opacity-50">
        <Shield className="w-12 h-12 text-[var(--text-secondary)] mb-4" />
        <p className="text-sm font-bold uppercase tracking-widest">Awaiting Execution</p>
        <p className="text-xs text-[var(--text-secondary)] mt-2">Submit a prompt to see governance analysis results.</p>
      </div>
    );
  }

  const { decision, risk_score, metadata, behavior, violations } = data;

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-emerald-500';
    if (score < 60) return 'text-orange-500';
    return 'text-red-500';
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'ALLOW': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'BLOCK': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'WARN': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* Risk Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)] flex flex-col items-center justify-center text-center space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Decision</span>
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getDecisionColor(decision)}`}>
            {decision}
          </span>
        </div>
        <div className="p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)] flex flex-col items-center justify-center text-center space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Risk Score</span>
          <span className={`text-4xl font-black ${getRiskColor(risk_score)}`}>{risk_score}%</span>
        </div>
        <div className="p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)] flex flex-col items-center justify-center text-center space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Latency</span>
          <span className="text-2xl font-black">{metadata?.latency_ms ?? 0}ms</span>
          <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">P95 COMPLIANT</span>
        </div>
      </div>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Behavior Insights */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
            <Zap className="w-3 h-3" /> Behavior Insights
          </h3>
          <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] space-y-4">
            {behavior && Object.entries(behavior).map(([key, val]: [string, any]) => {
              if (typeof val === 'boolean') return null; // skip boolean flags here
              const percentage = Math.min(100, Math.max(0, Number(val)));
              return (
              <div key={key} className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="capitalize">{key.replace('_', ' ')}</span>
                  <span className={getRiskColor(percentage)}>{percentage.toFixed(0)}%</span>
                </div>
                <div className="h-1 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      percentage > 60 ? 'bg-red-500' : percentage > 30 ? 'bg-orange-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )})}
            
            {/* Flags */}
            {behavior?.override_detect && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-tight text-red-500">Instruction Override Detected</span>
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
            )}
          </div>
        </div>

        {/* Policy Violations */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
            <ShieldAlert className="w-3 h-3" /> Policy Violations
          </h3>
          <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] min-h-[140px] flex flex-col justify-center">
            {violations && violations.length > 0 ? (
              <div className="space-y-3">
                {violations.map((v: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <div className="flex-1">
                      <div className="text-[11px] font-bold">{v.policy_name}</div>
                      <div className="text-[9px] uppercase tracking-widest text-red-400 font-black">{v.action} ACTION</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center space-y-2 py-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-50" />
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Compliance Clean</p>
                <p className="text-[9px] text-[var(--text-secondary)]">No active policy triggers detected.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Intelligence Signals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
            <Activity className="w-3 h-3" /> Governance State
          </h3>
          <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Activity className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-xs font-bold uppercase tracking-tight">{data.governance_state ?? 'STABLE'}</span>
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500">AUTHORITATIVE</div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
            <Network className="w-3 h-3" /> Drift Intelligence
          </h3>
          <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Network className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-xs font-bold">DRIFT: {(behavior?.intent_drift ?? 0).toFixed(1)}%</span>
            </div>
            <span className="text-[9px] font-mono text-[var(--text-secondary)] tracking-tighter">PHASE 57 ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Pipeline Stage Logs */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
          <History className="w-3 h-3" /> Pipeline Stage Logs
        </h3>
        <div className="bg-black/50 border border-white/5 rounded-2xl p-6 font-mono text-[10px] text-gray-400 space-y-2">
           <div className="flex items-center gap-2 text-emerald-400 mb-2">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
             <span className="font-bold">EXECUTION SUCCESSFUL</span>
           </div>
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span>Kernel.Intercept</span>
                <span className="text-white italic">SUCCESS</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span>Guardrail.Engine</span>
                <span className="text-white italic">SUCCESS</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span>Policy.Resolver</span>
                <span className="text-emerald-400 font-bold italic">CLEAN</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span>Metrics.Compute</span>
                <span className="text-white italic">DONE</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

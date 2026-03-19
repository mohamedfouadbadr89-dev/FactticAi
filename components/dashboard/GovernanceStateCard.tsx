"use client";

import React, { useEffect, useState } from "react";
import { Shield, AlertTriangle, Activity, Zap, CheckCircle } from "lucide-react";

interface ContributingFactors {
  drift: number;
  hallucination: number;
  policy: number;
  guardrail: number;
}

interface GovernanceData {
  governance_state: "SAFE" | "WATCH" | "WARNING" | "CRITICAL" | "BLOCKED";
  risk_score: number;
  contributing_factors: ContributingFactors;
}

/**
 * GovernanceStateCard Component
 * 
 * Visualization of the Deterministic Governance State.
 * Displays risk index, state classification, and contributing factors.
 */
export default function GovernanceStateCard() {
  const [data, setData] = useState<GovernanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchState() {
      try {
        const res = await fetch(`/api/governance/state`);
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch governance state", err);
      } finally {
        setLoading(false);
      }
    }
    fetchState();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse bg-[var(--bg-secondary)] h-64 rounded-xl border border-[var(--border-primary)]" />
    );
  }

  if (!data) return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-6 flex flex-col items-center justify-center gap-3 min-h-[200px] animate-[fadeIn_.4s_ease-in-out]">
      <Shield className="w-8 h-8 text-[var(--text-secondary)] opacity-30" />
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-50 text-center">
        Governance State<br />Unavailable
      </p>
      <a href="/dashboard/governance" className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] hover:underline mt-1">
        Configure →
      </a>
    </div>
  );

  const stateColors = {
    SAFE: "text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/20",
    WATCH: "text-[var(--accent)] bg-[var(--accent)]/10 border-[var(--accent)]/20",
    WARNING: "text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/20",
    CRITICAL: "text-[var(--danger)] bg-[var(--danger)]/10 border-[var(--danger)]/20",
    BLOCKED: "text-white bg-[var(--danger)] border-[var(--danger)]/40 shadow-[0_0_15px_rgba(var(--danger-rgb),0.3)]",
  };

  const stateIcons = {
    SAFE: <CheckCircle className="w-5 h-5" />,
    WATCH: <Activity className="w-5 h-5" />,
    WARNING: <AlertTriangle className="w-5 h-5" />,
    CRITICAL: <AlertTriangle className="w-5 h-5" />,
    BLOCKED: <Shield className="w-5 h-5" />,
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-6 transition-all hover:border-[var(--accent)]/30 animate-[fadeIn_.4s_ease-in-out]">
      {/* Background Glow */}
      <div className="absolute -inset-1 opacity-[0.03] bg-gradient-to-br from-white to-transparent pointer-events-none" />

      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[var(--accent)]" />
          Governance Status
        </h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-tighter transition-all ${stateColors[data.governance_state]}`}>
          {stateIcons[data.governance_state]}
          {data.governance_state}
        </div>
      </div>

      <div className="flex items-end gap-4 mb-8">
        <div className="text-7xl font-bold text-[var(--text-primary)] tracking-tighter leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
          {data.risk_score}
        </div>
        <div className="pb-1.5 w-full max-w-[120px]">
          <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] opacity-60 mb-1.5">Risk Exposure</div>
          <div className="h-1.5 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--danger)] transition-all duration-1000 ease-out"
              style={{ width: `${data.risk_score}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Drift", value: data.contributing_factors.drift, max: 25, color: "var(--accent)" },
          { label: "Hallucination", value: data.contributing_factors.hallucination, max: 30, color: "var(--warning)" },
          { label: "Policy", value: data.contributing_factors.policy, max: 25, color: "var(--danger)" },
          { label: "Guardrail", value: data.contributing_factors.guardrail, max: 20, color: "var(--success)" },
        ].map((factor) => (
          <div key={factor.label} className="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--border-primary)] transition-colors hover:bg-[var(--bg-primary)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] uppercase tracking-widest text-[var(--text-secondary)] opacity-50">{factor.label}</span>
              <span className="text-[11px] font-mono text-[var(--text-primary)] opacity-70">{(factor.value).toFixed(1)}</span>
            </div>
            <div className="h-1 bg-[var(--bg-primary)] rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ 
                  width: `${(factor.value / factor.max) * 100}%`,
                  backgroundColor: `var(--${factor.color})`, // Fixing variable lookup if needed, but factor.color is already a string
                  filter: `drop-shadow(0 0 2px ${factor.color})` // Simple glow
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Decorative background element */}
      <div className="absolute -right-4 -bottom-4 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
        <Shield className="w-32 h-32 text-[var(--text-primary)]" />
      </div>
    </div>
  );
}

"use client";

import React from "react";
import type { HealthData } from "@/lib/dashboard/types";
import { CountUp } from "@/components/ui/CountUp";

interface Props {
  data?: HealthData | undefined;
}

export default function ExecutiveHealthCard({ data }: Props) {
  const d = data ?? {
    governance_score: 84,
    sessions_today: 428,
    voice_calls: 87,
    drift_freq: "2.4%",
    rca_confidence: "91%",
    policy_adherence: "96.2% compliant",
    behavioral_drift: "Monitor",
    open_alerts: 3,
    tamper_integrity: "Verified",
  };

  return (
    <div 
      className="health-card relative overflow-hidden rounded-xl bg-gradient-to-br from-[var(--accent)] to-[color-mix(in_srgb,var(--accent)_70%,black)] dark:from-[color-mix(in_srgb,var(--accent)_80%,black)] dark:to-[color-mix(in_srgb,var(--accent)_60%,black)] p-8 text-white transition-all duration-300 animate-[fadeIn_.4s_ease-in-out]"
    >
      <div className="absolute inset-0 bg-[var(--card-bg)]/5 rounded-2xl pointer-events-none" />
      <div className="grid grid-cols-3 gap-8">

        {/* LEFT — Score */}
        <div className="flex flex-col items-center justify-center">
          <span 
            className="text-[52px] font-bold tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            <CountUp value={d.governance_score} />
          </span>
          <span className="text-lg text-white/70 mt-1">/ 100</span>
        </div>

        {/* CENTER — 2x2 Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 border border-white/15 rounded-[6px] p-4">
            <div className="text-xs uppercase tracking-widest text-white/70 mb-1">
              Sessions Today
            </div>
            <div className="text-lg font-bold"><CountUp value={d.sessions_today} /></div>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-[6px] p-4">
            <div className="text-xs uppercase tracking-widest text-white/70 mb-1">
              Voice Calls
            </div>
            <div className="text-lg font-bold"><CountUp value={d.voice_calls} /></div>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-[6px] p-4">
            <div className="text-xs uppercase tracking-widest text-white/70 mb-1">
              Drift Freq
            </div>
            <div className="text-lg font-bold"><CountUp value={parseFloat(d.drift_freq)} decimals={1} />%</div>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-[6px] p-4">
            <div className="text-xs uppercase tracking-widest text-white/70 mb-1">
              RCA Confidence
            </div>
            <div className="text-lg font-bold"><CountUp value={parseFloat(d.rca_confidence)} />%</div>
          </div>
        </div>

        {/* RIGHT — Status Indicators */}
        <div className="flex flex-col gap-3">
          <div className="bg-white/[0.06] rounded-[6px] p-3 border-l-4 border-[var(--success)]">
            <div className="text-xs uppercase tracking-widest text-white/70">
              Policy Adherence
            </div>
            <div className="text-sm font-bold mt-0.5">{d.policy_adherence}</div>
          </div>
          <div className="bg-white/[0.06] rounded-[6px] p-3 border-l-4 border-[var(--warning)]">
            <div className="text-xs uppercase tracking-widest text-white/70">
              Behavioral Drift
            </div>
            <div className="text-sm font-bold mt-0.5">{d.behavioral_drift}</div>
          </div>
          <div className="bg-white/[0.06] rounded-[6px] p-3 border-l-4 border-[var(--danger)]">
            <div className="text-xs uppercase tracking-widest text-white/70">
              Open Alerts
            </div>
            <div className="text-sm font-bold mt-0.5"><CountUp value={d.open_alerts} /> active</div>
          </div>
          <div className="bg-white/[0.06] rounded-[6px] p-3 border-l-4 border-[var(--success)]">
            <div className="text-xs uppercase tracking-widest text-white/70">
              Tamper Integrity
            </div>
            <div className="text-sm font-bold mt-0.5">{d.tamper_integrity}</div>
          </div>
        </div>

      </div>
    </div>
  );
}

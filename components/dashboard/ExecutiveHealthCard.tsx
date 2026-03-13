"use client";

import React from "react";
import type { HealthData } from "@/lib/dashboard/types";
import { CountUp } from "@/components/ui/CountUp";
import { computeHealthConfidence } from "@/lib/metrics/healthConfidence";
import { Info } from "lucide-react";

interface Props {
  data?: HealthData | undefined;
}

export default function ExecutiveHealthCard({ data }: Props) {
  const isLive = !!data;
  const d = data ?? {
    governance_score: 100,
    sessions_today: 0,
    voice_calls: 0,
    drift_freq: "0.0%",
    rca_confidence: "91%",
    policy_adherence: "100% compliant",
    behavioral_drift: "Stable",
    open_alerts: 0,
    tamper_integrity: "Verified",
  };

  // Show the real score — confidence is shown as a secondary badge only
  const displayedScore = d.governance_score;
  const confidence = computeHealthConfidence(d.sessions_today);
  const isLowSignal = d.sessions_today < 50;

  return (
    <div
      className="health-card relative overflow-hidden rounded-xl bg-gradient-to-br from-[var(--accent)] to-[color-mix(in_srgb,var(--accent)_70%,black)] dark:from-[color-mix(in_srgb,var(--accent)_80%,black)] dark:to-[color-mix(in_srgb,var(--accent)_60%,black)] p-8 text-white transition-all duration-300 animate-[fadeIn_.4s_ease-in-out]"
    >
      <div className="absolute inset-0 bg-[var(--card-bg)]/5 rounded-2xl pointer-events-none" />
      <div className="grid grid-cols-3 gap-8">

        {/* LEFT — Score */}
        <div className="flex flex-col items-center justify-center relative group/health">
          <span
            className="text-[52px] font-bold tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            <CountUp value={displayedScore} />
          </span>
          <span className="text-lg text-white/70 mt-1">/ 100</span>

          {/* Live vs fallback badge */}
          <div className="mt-2 flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'}`} />
            <span className="text-[9px] font-black uppercase tracking-widest text-white/60">
              {isLive ? 'Live' : 'No Data'}
            </span>
          </div>

          {isLowSignal && isLive && (
            <div className="absolute -top-2 -right-2 flex flex-col items-center group">
              <Info className="w-3 h-3 text-white/40 hover:text-white/80 transition-colors cursor-help" />
              <div className="absolute bottom-full mb-2 hidden group-hover:block w-52 p-2 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg text-[10px] font-medium leading-tight text-center shadow-xl z-50">
                Low signal volume ({d.sessions_today} interactions). Score confidence: {Math.round(confidence * 100)}%.
              </div>
            </div>
          )}
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

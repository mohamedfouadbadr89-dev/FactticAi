"use client";

import React from "react";
import type { HealthData } from "@/lib/dashboard/types";
import { useCountUp } from "@/lib/dashboard/useCountUp";

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

  const animatedScore = useCountUp(d.governance_score, 250);
  const animatedSessions = useCountUp(d.sessions_today, 250);
  const animatedCalls = useCountUp(d.voice_calls, 250);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-xl shadow-xl shadow-blue-900/20 p-8 text-white hover:shadow-2xl transition-all duration-300 animate-[fadeIn_.4s_ease-in-out]">
      <div className="absolute inset-0 bg-white/5 rounded-2xl pointer-events-none" />
      <div className="grid grid-cols-3 gap-8">

        {/* LEFT — Score */}
        <div className="flex flex-col items-center justify-center">
          <span className="text-6xl font-bold tracking-tight">{animatedScore}</span>
          <span className="text-lg text-white/70 mt-1">/ 100</span>
        </div>

        {/* CENTER — 2x2 Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-xs uppercase tracking-widest text-white/70 mb-1">
              Sessions Today
            </div>
            <div className="text-lg font-bold">{animatedSessions}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-xs uppercase tracking-widest text-white/70 mb-1">
              Voice Calls
            </div>
            <div className="text-lg font-bold">{animatedCalls}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-xs uppercase tracking-widest text-white/70 mb-1">
              Drift Freq
            </div>
            <div className="text-lg font-bold">{d.drift_freq}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-xs uppercase tracking-widest text-white/70 mb-1">
              RCA Confidence
            </div>
            <div className="text-lg font-bold">{d.rca_confidence}</div>
          </div>
        </div>

        {/* RIGHT — Status Indicators */}
        <div className="flex flex-col gap-3">
          <div className="bg-white/10 rounded-lg p-3 border-l-4 border-l-emerald-400">
            <div className="text-xs uppercase tracking-widest text-white/70">
              Policy Adherence
            </div>
            <div className="text-sm font-bold mt-0.5">{d.policy_adherence}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 border-l-4 border-l-amber-400">
            <div className="text-xs uppercase tracking-widest text-white/70">
              Behavioral Drift
            </div>
            <div className="text-sm font-bold mt-0.5">{d.behavioral_drift}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 border-l-4 border-l-rose-400">
            <div className="text-xs uppercase tracking-widest text-white/70">
              Open Alerts
            </div>
            <div className="text-sm font-bold mt-0.5">{d.open_alerts} active</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 border-l-4 border-l-emerald-400">
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

"use client";

import React from "react";
import { CountUp } from "@/components/ui/CountUp";
import { logger } from "@/lib/logger";

interface VoiceDriftData {
  avg_risk_30d: number;
  percentage_change: number;
  trend: number[];
}

interface Props {
  data?: VoiceDriftData | undefined;
}

export default function VoiceDriftCard({ data }: Props) {
  const d = data ?? {
    avg_risk_30d: 0.14,
    percentage_change: -4.2,
    trend: [10, 15, 12, 18, 14, 16, 14, 12, 10, 8, 12, 14, 13, 15, 14]
  };

  const isPositive = d.percentage_change > 0;

  return (
    <div className="card h-full transition-all duration-300 hover:shadow-lg group">
      <div className="card-header flex items-center justify-between">
        <div>
          <h3 className="card-title select-none">Voice Governance Drift</h3>
          <p className="card-subtitle">30D Performance Analysis</p>
        </div>
        <a 
          href="/dashboard/voice/analysis" 
          className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] hover:underline"
        >
          View Details →
        </a>
      </div>

      <div className="px-6 pb-6 pt-2">
        <div className="flex items-end justify-between mb-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-secondary)]">Avg. Risk Score</p>
            <div className="flex items-baseline gap-2">
              <CountUp value={Math.round(d.avg_risk_30d * 100)} suffix="%" duration={1} className="text-3xl font-bold tracking-tight text-[var(--text-primary)]" />
              <span className={`text-[10px] font-black ${isPositive ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
                {isPositive ? '↑' : '↓'} {Math.abs(d.percentage_change)}%
              </span>
            </div>
          </div>
          
          {/* Sparkline */}
          <div className="flex items-end gap-[2px] h-12 w-32">
            {d.trend.map((val, i) => (
              <div 
                key={i}
                className="flex-1 bg-[var(--accent)]/40 rounded-t-[1px] hover:bg-[var(--accent)] transition-all"
                style={{ height: `${(val / Math.max(...d.trend)) * 100}%` }}
              />
            ))}
          </div>
        </div>

        <div className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2">
            <span>Integrity Level</span>
            <span className="text-[var(--success)]">99.8%</span>
          </div>
          <div className="w-full h-1.5 bg-[var(--bg-primary)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--success)] w-[99.8%] shadow-[0_0_8px_var(--success)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

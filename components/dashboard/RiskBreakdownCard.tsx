import React from "react";
import type { RiskMetric } from "@/lib/dashboard/types";
import { CountUp } from "@/components/ui/CountUp";

interface Props {
  data?: RiskMetric[] | undefined;
}

const defaultMetrics: RiskMetric[] = [
  { label: "Policy Adherence", value: "96.2%", percent: 96.2, color: "text-[var(--success)]", barColor: "bg-[var(--success)]" },
  { label: "Behavioral Drift", value: "2.4%", percent: 2.4, color: "text-[var(--warning)]", barColor: "bg-[var(--warning)]" },
  { label: "Tamper Events", value: "0", percent: 100, color: "text-[var(--success)]", barColor: "bg-[var(--success)]" },
  { label: "RCA Confidence", value: "91%", percent: 91, color: "text-[var(--accent)]", barColor: "bg-[var(--accent)]" },
  { label: "Escalation Rate", value: "0.7%", percent: 0.7, color: "text-[var(--success)]", barColor: "bg-[var(--success)]" },
  { label: "Open Investigations", value: "4", percent: 40, color: "text-[var(--warning)]", barColor: "bg-[var(--warning)]" },
];

export default function RiskBreakdownCard({ data }: Props) {
  const metrics = data ?? defaultMetrics;

  return (
    <div className="card animate-[fadeIn_.4s_ease-in-out]">

      {/* Header */}
      <div className="card-header flex items-center justify-between">
        <h3 className="card-title">Risk Breakdown</h3>
        <span className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs px-3 py-1 rounded-full font-medium">
          Phase 1–6 Composite
        </span>
      </div>

      {/* Body */}
      <div className="p-6 grid grid-cols-2 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="risk-card bg-[var(--bg-secondary)] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="risk-note text-xs font-medium text-[var(--text-secondary)]">{m.label}</span>
              <span className={`risk-val text-sm font-bold font-mono ${m.color}`}>
                <CountUp value={m.percent} decimals={m.value.includes('.') ? 1 : 0} />
                {m.value.includes('%') ? '%' : ''}
              </span>
            </div>
            <div className="risk-track h-2 rounded bg-[var(--border-color)] overflow-hidden">
              <div
                className={`h-full rounded ${m.barColor} transition-all duration-300`}
                style={{ width: `${Math.min(m.percent, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

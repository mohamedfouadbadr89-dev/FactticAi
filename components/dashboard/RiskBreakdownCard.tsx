import React from "react";
import type { RiskMetric } from "@/lib/dashboard/types";

interface Props {
  data?: RiskMetric[] | undefined;
}

const defaultMetrics: RiskMetric[] = [
  { label: "Policy Adherence", value: "96.2%", percent: 96.2, color: "text-emerald-700", barColor: "bg-emerald-500" },
  { label: "Behavioral Drift", value: "2.4%", percent: 2.4, color: "text-amber-700", barColor: "bg-amber-500" },
  { label: "Tamper Events", value: "0", percent: 100, color: "text-emerald-700", barColor: "bg-emerald-500" },
  { label: "RCA Confidence", value: "91%", percent: 91, color: "text-blue-700", barColor: "bg-blue-500" },
  { label: "Escalation Rate", value: "0.7%", percent: 0.7, color: "text-emerald-700", barColor: "bg-emerald-500" },
  { label: "Open Investigations", value: "4", percent: 40, color: "text-amber-700", barColor: "bg-amber-500" },
];

export default function RiskBreakdownCard({ data }: Props) {
  const metrics = data ?? defaultMetrics;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 animate-[fadeIn_.4s_ease-in-out]">

      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">Risk Breakdown</h3>
        <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full font-medium">
          Phase 1–6 Composite
        </span>
      </div>

      {/* Body */}
      <div className="p-6 grid grid-cols-2 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="risk-card bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="risk-note text-xs font-medium text-gray-600">{m.label}</span>
              <span className={`risk-val text-sm font-bold font-mono ${m.color}`}>{m.value}</span>
            </div>
            <div className="risk-track h-2 rounded bg-gray-200 overflow-hidden">
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

"use client";

import React, { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { CardSkeleton } from "@/components/ui/CardSkeleton";
import { ChartSkeleton } from "@/components/ui/ChartSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";

const heatmapData = [
  { agent: "Agent A", days: [0.1, 0.3, 0.8, 0.2, 0.5, 1.2, 0.4] },
  { agent: "Agent B", days: [0.2, 0.1, 0.3, 0.6, 0.2, 0.1, 0.3] },
  { agent: "Agent C", days: [1.4, 0.9, 0.7, 0.5, 0.8, 1.1, 0.6] },
  { agent: "Agent D", days: [0.1, 0.1, 0.2, 0.1, 0.1, 0.3, 0.1] },
  { agent: "Agent E", days: [0.6, 0.8, 1.0, 1.3, 0.9, 0.7, 0.5] },
];

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function heatColor(val: number): string {
  if (val >= 1.0) return "bg-red-50 text-red-600 border border-red-100";
  if (val >= 0.5) return "bg-amber-50 text-amber-600 border border-amber-100";
  if (val >= 0.2) return "bg-[var(--accent-soft)] text-[var(--accent)] border border-blue-100";
  return "bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-primary)]";
}

export default function AdvancedModePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-8 py-10 space-y-10">
        <div>
          <Skeleton height="36px" width="240px" className="mb-2" />
          <Skeleton height="14px" width="300px" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CardSkeleton className="min-h-[320px]" />
          <CardSkeleton className="min-h-[320px]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartSkeleton className="min-h-[320px]" />
          <CardSkeleton className="min-h-[320px]" />
        </div>
        <CardSkeleton className="min-h-[400px]" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-10 space-y-10">

      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-secondary)]">
          Advanced Mode
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Deep diagnostics · Model telemetry · Escalation analysis</p>
      </div>

      {/* Row 1: Drift Heatmap + Root Cause */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Drift Heatmap */}
        <div className="card animate-[fadeIn_.4s_ease-in-out]">
          <div className="card-header flex items-center justify-between">
            <div>
              <h3 className="card-title">Drift Heatmap</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">7-day agent deviation grid</p>
            </div>
            <span className="bg-[var(--bg-primary)] text-[var(--text-secondary)] text-xs px-3 py-1 rounded-full font-medium">Last 7 Days</span>
          </div>
          <div className="p-6">
            <EmptyState
              title="Sufficient Baseline Pending"
              description="Not enough live interaction data points gathered over the 7-day trailing edge to compute accurate multi-agent drift topology."
              className="py-10"
            />
          </div>
        </div>

        {/* Root Cause Breakdown */}
        <div className="card animate-[fadeIn_.4s_ease-in-out]">
          <div className="card-header">
            <h3 className="card-title">Root Cause Breakdown</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Top attribution factors · 30d</p>
          </div>
          <div className="p-6 space-y-4">
            {[
              { label: "Prompt Injection Attempt", pct: 34, color: "bg-[var(--danger)]" },
              { label: "Context Window Overflow", pct: 22, color: "bg-[var(--warning)]" },
              { label: "Hallucination — Factual", pct: 18, color: "bg-[var(--accent)]" },
              { label: "Policy Boundary Violation", pct: 14, color: "bg-[var(--warning)]" },
              { label: "Latency Degradation", pct: 8, color: "bg-[var(--text-muted)]" },
              { label: "Unknown / Other", pct: 4, color: "bg-[var(--border-secondary)]" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{item.label}</span>
                  <span className="text-sm font-mono font-semibold text-[var(--text-primary)]">{item.pct}%</span>
                </div>
                <div className="h-[6px] rounded-full bg-[var(--bg-primary)] overflow-hidden shadow-inner">
                  <div className={`h-full rounded-full ${item.color} shadow-sm`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 2: Model Confidence + Escalation Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Model Confidence Distribution */}
        <div className="card animate-[fadeIn_.4s_ease-in-out]">
          <div className="card-header">
            <h3 className="card-title">Model Confidence Distribution</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Response certainty histogram · 24h</p>
          </div>
          <div className="p-6">
            {/* Bar Chart */}
            <div className="flex items-end gap-2 h-40 mb-4">
              {[
                { range: "0–20", count: 3, pct: 7.5 },
                { range: "20–40", count: 8, pct: 20 },
                { range: "40–60", count: 15, pct: 37.5 },
                { range: "60–80", count: 42, pct: 100 },
                { range: "80–90", count: 38, pct: 90 },
                { range: "90–95", count: 28, pct: 67 },
                { range: "95–100", count: 12, pct: 28.5 },
              ].map((bar) => (
                <div key={bar.range} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)]">{bar.count}</span>
                  <div
                    className="w-full bg-[var(--accent)]/80 rounded-t-md transition-all duration-300"
                    style={{ height: `${bar.pct}%`, minHeight: "4px" }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {["0–20", "20–40", "40–60", "60–80", "80–90", "90–95", "95–100"].map((r) => (
                <div key={r} className="flex-1 text-center text-[9px] font-mono text-[var(--text-secondary)]">{r}%</div>
              ))}
            </div>
            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-[var(--border-primary)] flex items-center gap-8">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-0.5">Median</div>
                <div className="text-lg font-bold text-[var(--text-primary)]">74.2%</div>
              </div>
              <div className="h-8 w-px bg-[var(--border-primary)]" />
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-0.5">P95</div>
                <div className="text-lg font-bold text-[var(--success)]">96.8%</div>
              </div>
              <div className="h-8 w-px bg-[var(--border-primary)]" />
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-0.5">Below Threshold</div>
                <div className="text-lg font-bold text-[var(--warning)]">11</div>
              </div>
            </div>
          </div>
        </div>

        {/* Escalation Flow */}
        <div className="card animate-[fadeIn_.4s_ease-in-out]">
          <div className="card-header">
            <h3 className="card-title">Escalation Flow</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Pipeline stage distribution · 30d</p>
          </div>
          <div className="p-6 space-y-3">
            {[
              { stage: "Input Capture", count: 12847, status: "ok" },
              { stage: "Agent Routing", count: 12841, status: "ok" },
              { stage: "Drift Detection", count: 428, status: "warn" },
              { stage: "RCA Analysis", count: 127, status: "warn" },
              { stage: "Escalation Trigger", count: 23, status: "alert" },
              { stage: "Human Review", count: 8, status: "alert" },
              { stage: "Resolution", count: 5, status: "ok" },
            ].map((item, idx) => (
              <React.Fragment key={item.stage}>
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold ${
                    item.status === "ok" ? "bg-[var(--success)]/10 text-[var(--success)]" :
                    item.status === "warn" ? "bg-[var(--warning)]/10 text-[var(--warning)]" :
                    "bg-[var(--danger)]/10 text-[var(--danger)]"
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[var(--text-primary)]">{item.stage}</div>
                  </div>
                  <div className="text-sm font-mono font-bold text-[var(--text-primary)]">{item.count.toLocaleString()}</div>
                  <div className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                    item.status === "ok" ? "bg-[var(--success)]/10 text-[var(--success)]" :
                    item.status === "warn" ? "bg-[var(--warning)]/10 text-[var(--warning)]" :
                    "bg-[var(--danger)]/10 text-[var(--danger)]"
                  }`}>
                    {item.status === "ok" ? "Normal" : item.status === "warn" ? "Elevated" : "Critical"}
                  </div>
                </div>
                {idx < 6 && (
                  <div className="ml-4 h-4 border-l-2 border-dashed border-[var(--border-primary)]" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

      </div>

      {/* Row 3: Live Evaluation Logs */}
      <div className="card overflow-hidden animate-[fadeIn_.4s_ease-in-out]">
        <div className="card-header flex items-center justify-between">
          <div>
            <h3 className="card-title">Live Evaluation Logs</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Real-time model evaluation trace</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Streaming
          </span>
        </div>
        <div className="p-6">
          <EmptyState
            title="Trace Stream Paused"
            description="The live evaluation socket stream is currently paused or intercepting zero transactional traffic in this environment."
            className="py-12"
          />
        </div>
      </div>

    </div>
  );
}

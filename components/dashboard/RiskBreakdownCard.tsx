"use client";

import React, { useState } from "react";
import type { RiskMetric } from "@/lib/dashboard/types";
import { CountUp } from "@/components/ui/CountUp";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  data?: RiskMetric[] | undefined;
}

const defaultMetrics: RiskMetric[] = [
  { label: "Policy Adherence", value: "N/A", percent: 0, color: "text-[var(--text-secondary)]", barColor: "bg-[var(--text-secondary)]" },
  { label: "Tamper Integrity", value: "N/A", percent: 0, color: "text-[var(--text-secondary)]", barColor: "bg-[var(--text-secondary)]" },
  { label: "RCA Confidence", value: "N/A", percent: 0, color: "text-[var(--text-secondary)]", barColor: "bg-[var(--text-secondary)]" },
  { label: "Open Incidents", value: "0", percent: 0, color: "text-[var(--text-secondary)]", barColor: "bg-[var(--text-secondary)]" },
];

const PAGE_SIZE = 4;

export default function RiskBreakdownCard({ data }: Props) {
  const metrics = Array.isArray(data) ? data : defaultMetrics;
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(metrics.length / PAGE_SIZE));
  const pageMetrics = metrics.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="card animate-[fadeIn_.4s_ease-in-out] flex flex-col">

      {/* Header */}
      <div className="card-header flex items-center justify-between">
        <h3 className="card-title">Risk Breakdown</h3>
        <span className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs px-3 py-1 rounded-full font-medium">
          Phase 1–6 Composite
        </span>
      </div>

      {/* Body */}
      <div className="p-6 grid grid-cols-2 gap-4 flex-1">
        {pageMetrics.map((m) => (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-3 border-t border-[var(--border-color)] flex items-center justify-between mt-auto">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, metrics.length)} of {metrics.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg border border-[var(--border-primary)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="p-1.5 rounded-lg border border-[var(--border-primary)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

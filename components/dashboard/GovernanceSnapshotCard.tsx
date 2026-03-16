"use client";

import React from "react";
import { CountUp } from "@/components/ui/CountUp";
import { useSnapshotMetrics } from "@/lib/dashboard/useSnapshotMetrics";

/**
 * LiveCount
 * Renders a CountUp value when data is ready, a skeleton shimmer during load,
 * and an em dash when data is unavailable — all without touching the layout.
 */
function LiveCount({
  value,
  loading,
  error,
  decimals,
  suffix = "",
}: {
  value: number | null;
  loading: boolean;
  error: boolean;
  decimals?: number;
  suffix?: string;
}) {
  if (loading) {
    return (
      <span
        className="inline-block rounded bg-[var(--bg-secondary)] animate-pulse"
        style={{ width: "3rem", height: "1rem", verticalAlign: "middle" }}
        aria-label="Loading…"
      />
    );
  }
  if (error || value === null) {
    return <span className="text-[var(--text-secondary)]">—</span>;
  }
  return (
    <>
      <CountUp value={value} {...(decimals !== undefined ? { decimals } : {})} />
      {suffix}
    </>
  );
}

export default function GovernanceSnapshotCard() {
  const { metrics, loading, error } = useSnapshotMetrics();

  return (
    <div className="card animate-[fadeIn_.4s_ease-in-out]">

      {/* Header */}
      <div className="card-header flex items-center justify-between">
        <h3 className="card-title">
          Governance Snapshot — Phase 1–6
        </h3>
        <span className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs px-3 py-1 rounded-full font-medium">
          Executive View · Live
        </span>
      </div>

      {/* Body — 3-Column Grid */}
      <div className="snapshot-grid">

        {/* Column 1 — Phase Coverage (structural, not DB-derived) */}
        <div>
          <h4 className="text-[10px] font-bold font-mono uppercase tracking-widest text-[var(--text-secondary)] mb-4">
            Phase Coverage
          </h4>
          <ul>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">Phase 1 — Input Capture</span>
              <span className="text-sm font-bold text-[var(--success)]"><CountUp value={100} />%</span>
            </li>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">Phase 2 — Agent Routing</span>
              <span className="text-sm font-bold text-[var(--success)]"><CountUp value={100} />%</span>
            </li>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">Phase 3 — Execution</span>
              <span className="text-sm font-bold text-[var(--success)]"><CountUp value={98} />%</span>
            </li>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">Phase 4 — Monitoring</span>
              <span className="text-sm font-bold text-[var(--warning)]"><CountUp value={92} />%</span>
            </li>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">Phase 5 — RCA</span>
              <span className="text-sm font-bold text-[var(--success)]"><CountUp value={96} />%</span>
            </li>
            <li className="flex justify-between py-2">
              <span className="text-sm text-[var(--text-secondary)]">Phase 6 — Governance</span>
              <span className="text-sm font-bold text-[var(--success)]"><CountUp value={100} />%</span>
            </li>
          </ul>
        </div>

        {/* Column 2 — System Integrity (structural status labels) */}
        <div>
          <h4 className="text-[10px] font-bold font-mono uppercase tracking-widest text-[var(--text-secondary)] mb-4">
            System Integrity
          </h4>
          <ul>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">Tamper Detection</span>
              <span className="text-sm font-bold text-[var(--success)]">Sealed</span>
            </li>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">RBAC Enforcement</span>
              <span className="text-sm font-bold text-[var(--success)]">Active</span>
            </li>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">Encryption Status</span>
              <span className="text-sm font-bold text-[var(--success)]">AES-256</span>
            </li>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">Audit Trail</span>
              <span className="text-sm font-bold text-[var(--success)]">Complete</span>
            </li>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">PII Redaction</span>
              <span className="text-sm font-bold text-[var(--success)]">Enabled</span>
            </li>
            <li className="flex justify-between py-2">
              <span className="text-sm text-[var(--text-secondary)]">Data Residency</span>
              <span className="text-sm font-bold text-[var(--success)]">US-East</span>
            </li>
          </ul>
        </div>

        {/* Column 3 — 30-Day Summary (LIVE — Supabase aggregates) */}
        <div>
          <h4 className="text-[10px] font-bold font-mono uppercase tracking-widest text-[var(--text-secondary)] mb-4">
            30-Day Summary
          </h4>
          <ul>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">Total Sessions</span>
              <span className="text-sm font-bold text-[var(--text-primary)]">
                <LiveCount value={metrics?.total_sessions ?? null} loading={loading} error={error} />
              </span>
            </li>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">Governance Events</span>
              <span className="text-sm font-bold text-[var(--warning)]">
                <LiveCount value={metrics?.governance_events ?? null} loading={loading} error={error} />
              </span>
            </li>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">Incidents</span>
              <span className="text-sm font-bold text-[var(--danger)]">
                <LiveCount value={metrics?.incidents ?? null} loading={loading} error={error} />
              </span>
            </li>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">Organizations</span>
              <span className="text-sm font-bold text-[var(--text-primary)]">
                <LiveCount value={metrics?.organizations ?? null} loading={loading} error={error} />
              </span>
            </li>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">Failed Events</span>
              <span className="text-sm font-bold text-[var(--danger)]">
                <LiveCount value={metrics?.failed_jobs ?? null} loading={loading} error={error} />
              </span>
            </li>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">Replayed Failed Jobs</span>
              <span className="text-sm font-bold text-[var(--warning)]">
                <LiveCount value={metrics?.replayed_jobs ?? null} loading={loading} error={error} />
              </span>
            </li>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">Uptime SLA</span>
              <span className="text-sm font-bold text-[var(--success)]"><CountUp value={99.99} decimals={2} />%</span>
            </li>
            <li className="flex justify-between py-2">
              <span className="text-sm text-[var(--text-secondary)]">Compliance Score</span>
              <span className="text-sm font-bold text-[var(--success)]"><CountUp value={97.8} decimals={1} />%</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}

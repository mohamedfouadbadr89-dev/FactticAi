import React from "react";
import { CountUp } from "@/components/ui/CountUp";

export default function GovernanceSnapshotCard() {
  return (
    <div className="card animate-[fadeIn_.4s_ease-in-out]">

      {/* Header */}
      <div className="card-header flex items-center justify-between">
        <h3 className="card-title">
          Governance Snapshot — Phase 1–6
        </h3>
        <span className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs px-3 py-1 rounded-full font-medium">
          Executive View · Feb 26, 2026
        </span>
      </div>

      {/* Body — 3-Column Grid */}
      <div className="snapshot-grid">

        {/* Column 1 — Phase Coverage */}
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

        {/* Column 2 — System Integrity */}
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

        {/* Column 3 — 30-Day Summary */}
        <div>
          <h4 className="text-[10px] font-bold font-mono uppercase tracking-widest text-[var(--text-secondary)] mb-4">
            30-Day Summary
          </h4>
          <ul>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">Total Sessions</span>
              <span className="text-sm font-bold text-[var(--text-primary)]"><CountUp value={12847} /></span>
            </li>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">Escalations</span>
              <span className="text-sm font-bold text-[var(--warning)]"><CountUp value={23} /></span>
            </li>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">Avg. RCA Time</span>
              <span className="text-sm font-bold text-[var(--text-primary)]"><CountUp value={4.2} decimals={1} />m</span>
            </li>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">Policy Violations</span>
              <span className="text-sm font-bold text-[var(--danger)]"><CountUp value={3} /></span>
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

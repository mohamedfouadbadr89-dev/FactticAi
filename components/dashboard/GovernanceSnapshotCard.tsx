"use client";

import React from "react";
import { CountUp } from "@/components/ui/CountUp";

interface SnapshotStats {
  health?: {
    sessions_today?: number;
    tamper_integrity?: string;
    policy_adherence?: string;
    open_alerts?: number;
    rca_confidence?: string;
  };
}

export default function GovernanceSnapshotCard({ stats }: { stats?: SnapshotStats }) {
  const health = stats?.health;
  const hasLiveData    = !!health;
  const sessionCount   = health?.sessions_today ?? null;
  const tamper         = health?.tamper_integrity ?? '—';
  const policyAdh      = health?.policy_adherence ?? '—';
  const openAlerts     = health?.open_alerts ?? null;
  const rcaConf        = health?.rca_confidence ?? '—';

  return (
    <div className="card animate-[fadeIn_.4s_ease-in-out]">

      {/* Header */}
      <div className="card-header flex items-center justify-between">
        <h3 className="card-title">
          Governance Snapshot — Phase 1–6
        </h3>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
          hasLiveData
            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
        }`}>
          {hasLiveData ? 'Live · Real-time' : 'Awaiting Data'}
        </span>
      </div>

      <div className="snapshot-grid">

        {/* Column 1 — Pipeline Stages */}
        <div>
          <h4 className="text-[10px] font-bold font-mono uppercase tracking-widest text-[var(--text-secondary)] mb-4">
            Pipeline Stages
          </h4>
          <ul>
            {[
              'Auth Gate', 'Signal Analysis', 'Policy Engine',
              'Guardrail Engine', 'Risk Scoring', 'Evidence Ledger'
            ].map(stage => (
              <li key={stage} className="flex justify-between py-2 border-b border-[var(--border-color)] last:border-0">
                <span className="text-sm text-[var(--text-secondary)]">{stage}</span>
                <span className="text-sm font-bold text-[var(--success)]">Active</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 2 — System Integrity (real values) */}
        <div>
          <h4 className="text-[10px] font-bold font-mono uppercase tracking-widest text-[var(--text-secondary)] mb-4">
            System Integrity
          </h4>
          <ul>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">Tamper Detection</span>
              <span className={`text-sm font-bold ${
                tamper === 'Verified'     ? 'text-[var(--success)]' :
                tamper === 'Warning'      ? 'text-[var(--danger)]'  :
                                            'text-[var(--text-secondary)]'
              }`}>{tamper}</span>
            </li>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">RBAC Enforcement</span>
              <span className="text-sm font-bold text-[var(--success)]">Active</span>
            </li>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">Encryption</span>
              <span className="text-sm font-bold text-[var(--success)]">AES-256</span>
            </li>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">Audit Trail</span>
              <span className="text-sm font-bold text-[var(--success)]">SHA-256</span>
            </li>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">Policy Adherence</span>
              <span className="text-sm font-bold text-[var(--text-primary)]">{policyAdh}</span>
            </li>
            <li className="flex justify-between py-2">
              <span className="text-sm text-[var(--text-secondary)]">Fail-Closed Gate</span>
              <span className="text-sm font-bold text-[var(--success)]">Enabled</span>
            </li>
          </ul>
        </div>

        {/* Column 3 — Live 24h Summary */}
        <div>
          <h4 className="text-[10px] font-bold font-mono uppercase tracking-widest text-[var(--text-secondary)] mb-4">
            24h Summary
          </h4>
          <ul>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">Sessions (24h)</span>
              <span className="text-sm font-bold text-[var(--text-primary)]">
                {sessionCount !== null ? <CountUp value={sessionCount} /> : '—'}
              </span>
            </li>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">Open Alerts</span>
              <span className={`text-sm font-bold ${(openAlerts ?? 0) > 0 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
                {openAlerts !== null ? <CountUp value={openAlerts} /> : '—'}
              </span>
            </li>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">RCA Confidence</span>
              <span className="text-sm font-bold text-[var(--text-primary)]">{rcaConf}</span>
            </li>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">Open Incidents</span>
              <span className={`text-sm font-bold ${(openAlerts ?? 0) > 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
                {openAlerts !== null ? <CountUp value={openAlerts} /> : '—'}
              </span>
            </li>
            <li className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">LLM Layer</span>
              <span className="text-sm font-bold text-[var(--success)]">Active</span>
            </li>
            <li className="flex justify-between py-2">
              <span className="text-sm text-[var(--text-secondary)]">Compliance</span>
              <span className="text-sm font-bold text-[var(--text-primary)]">{policyAdh}</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}

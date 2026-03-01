import React from "react";

export default function GovernanceSnapshotCard() {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 animate-[fadeIn_.4s_ease-in-out]">

      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">
          Governance Snapshot — Phase 1–6
        </h3>
        <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full font-medium">
          Executive View · Feb 26, 2026
        </span>
      </div>

      {/* Body — 3-Column Grid */}
      <div className="snapshot-grid">

        {/* Column 1 — Phase Coverage */}
        <div>
          <h4 className="text-[10px] font-bold font-mono uppercase tracking-widest text-gray-400 mb-4">
            Phase Coverage
          </h4>
          <ul>
            <li className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700">Phase 1 — Input Capture</span>
              <span className="text-sm font-bold text-emerald-600">100%</span>
            </li>
            <li className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700">Phase 2 — Agent Routing</span>
              <span className="text-sm font-bold text-emerald-600">100%</span>
            </li>
            <li className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700">Phase 3 — Execution</span>
              <span className="text-sm font-bold text-emerald-600">98%</span>
            </li>
            <li className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700">Phase 4 — Monitoring</span>
              <span className="text-sm font-bold text-amber-600">92%</span>
            </li>
            <li className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700">Phase 5 — RCA</span>
              <span className="text-sm font-bold text-emerald-600">96%</span>
            </li>
            <li className="flex justify-between py-2">
              <span className="text-sm text-slate-700">Phase 6 — Governance</span>
              <span className="text-sm font-bold text-emerald-600">100%</span>
            </li>
          </ul>
        </div>

        {/* Column 2 — System Integrity */}
        <div>
          <h4 className="text-[10px] font-bold font-mono uppercase tracking-widest text-gray-400 mb-4">
            System Integrity
          </h4>
          <ul>
            <li className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700">Tamper Detection</span>
              <span className="text-sm font-bold text-emerald-600">Sealed</span>
            </li>
            <li className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700">RBAC Enforcement</span>
              <span className="text-sm font-bold text-emerald-600">Active</span>
            </li>
            <li className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700">Encryption Status</span>
              <span className="text-sm font-bold text-emerald-600">AES-256</span>
            </li>
            <li className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700">Audit Trail</span>
              <span className="text-sm font-bold text-emerald-600">Complete</span>
            </li>
            <li className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700">PII Redaction</span>
              <span className="text-sm font-bold text-emerald-600">Enabled</span>
            </li>
            <li className="flex justify-between py-2">
              <span className="text-sm text-slate-700">Data Residency</span>
              <span className="text-sm font-bold text-emerald-600">US-East</span>
            </li>
          </ul>
        </div>

        {/* Column 3 — 30-Day Summary */}
        <div>
          <h4 className="text-[10px] font-bold font-mono uppercase tracking-widest text-gray-400 mb-4">
            30-Day Summary
          </h4>
          <ul>
            <li className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700">Total Sessions</span>
              <span className="text-sm font-bold text-slate-900">12,847</span>
            </li>
            <li className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700">Escalations</span>
              <span className="text-sm font-bold text-amber-600">23</span>
            </li>
            <li className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700">Avg. RCA Time</span>
              <span className="text-sm font-bold text-slate-900">4.2m</span>
            </li>
            <li className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700">Policy Violations</span>
              <span className="text-sm font-bold text-red-600">3</span>
            </li>
            <li className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700">Uptime SLA</span>
              <span className="text-sm font-bold text-emerald-600">99.99%</span>
            </li>
            <li className="flex justify-between py-2">
              <span className="text-sm text-slate-700">Compliance Score</span>
              <span className="text-sm font-bold text-emerald-600">97.8%</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}

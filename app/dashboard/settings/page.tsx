import React from "react";

export default function SettingsPage() {
  return (
    <div className="space-y-10">
      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Engine Configuration */}
        <div className="card animate-[fadeIn_.4s_ease-in-out]">
          <div className="card-header">
            <h3 className="card-title">Engine Configuration</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Deterministic processing parameters</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-[var(--text-primary)]">Governance Mode</span><p className="text-xs text-[var(--text-secondary)] mt-0.5">Active enforcement level</p></div>
              <span className="bg-[var(--success)]/10 text-[var(--success)] text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-[20px]">Active</span>
            </div>
            <div className="h-px bg-[var(--border-primary)]" />
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-[var(--text-primary)]">Risk Threshold</span><p className="text-xs text-[var(--text-secondary)] mt-0.5">Escalation trigger point</p></div>
              <span className="text-sm font-mono font-bold text-[var(--text-primary)] text-right">0.85</span>
            </div>
            <div className="h-px bg-[var(--border-primary)]" />
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-[var(--text-primary)]">RCA Confidence Min</span><p className="text-xs text-[var(--text-secondary)] mt-0.5">Minimum resolution confidence</p></div>
              <span className="text-sm font-mono font-bold text-[var(--text-primary)] text-right">90%</span>
            </div>
            <div className="h-px bg-[var(--border-primary)]" />
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-[var(--text-primary)]">Drift Alert Threshold</span><p className="text-xs text-[var(--text-secondary)] mt-0.5">Behavioral deviation cap</p></div>
              <span className="text-sm font-mono font-bold text-[var(--warning)] text-right">3.0%</span>
            </div>
          </div>
        </div>

        {/* Security & Compliance */}
        <div className="card animate-[fadeIn_.4s_ease-in-out]">
          <div className="card-header">
            <h3 className="card-title">Security & Compliance</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">System integrity controls</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-[var(--text-primary)]">RBAC Enforcement</span><p className="text-xs text-[var(--text-secondary)] mt-0.5">Role-based access control</p></div>
              <span className="bg-[var(--success)]/10 text-[var(--success)] text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-[20px]">Enabled</span>
            </div>
            <div className="h-px bg-[var(--border-primary)]" />
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-[var(--text-primary)]">Tamper Detection</span><p className="text-xs text-[var(--text-secondary)] mt-0.5">Integrity verification layer</p></div>
              <span className="bg-[var(--success)]/10 text-[var(--success)] text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-[20px]">Sealed</span>
            </div>
            <div className="h-px bg-[var(--border-primary)]" />
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-[var(--text-primary)]">PII Redaction</span><p className="text-xs text-[var(--text-secondary)] mt-0.5">Data masking pipeline</p></div>
              <span className="bg-[var(--success)]/10 text-[var(--success)] text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-[20px]">Active</span>
            </div>
            <div className="h-px bg-[var(--border-primary)]" />
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-[var(--text-primary)]">Encryption Standard</span><p className="text-xs text-[var(--text-secondary)] mt-0.5">Data at rest / in transit</p></div>
              <span className="text-sm font-mono font-bold text-[var(--text-primary)] text-right">AES-256</span>
            </div>
          </div>
        </div>

        {/* Data Residency */}
        <div className="card animate-[fadeIn_.4s_ease-in-out]">
          <div className="card-header">
            <h3 className="card-title">Data Residency</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Regional storage configuration</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-[var(--text-primary)]">Primary Region</span><p className="text-xs text-[var(--text-secondary)] mt-0.5">Production data center</p></div>
              <span className="text-sm font-mono font-bold text-[var(--text-primary)] text-right">US-East-1</span>
            </div>
            <div className="h-px bg-[var(--border-primary)]" />
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-[var(--text-primary)]">Backup Region</span><p className="text-xs text-[var(--text-secondary)] mt-0.5">Disaster recovery</p></div>
              <span className="text-sm font-mono font-bold text-[var(--text-primary)] text-right">EU-West-1</span>
            </div>
            <div className="h-px bg-[var(--border-primary)]" />
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-[var(--text-primary)]">Retention Policy</span><p className="text-xs text-[var(--text-secondary)] mt-0.5">Log data lifecycle</p></div>
              <span className="text-sm font-mono font-bold text-[var(--text-primary)] text-right">90 days</span>
            </div>
          </div>
        </div>

        {/* System Version */}
        <div className="card animate-[fadeIn_.4s_ease-in-out]">
          <div className="card-header">
            <h3 className="card-title">System Information</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Build and deployment status</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-[var(--text-primary)]">Engine Version</span><p className="text-xs text-[var(--text-secondary)] mt-0.5">Governance core</p></div>
              <span className="text-sm font-mono font-bold text-[var(--text-primary)] text-right">v1.0.0</span>
            </div>
            <div className="h-px bg-[var(--border-primary)]" />
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-[var(--text-primary)]">Schema Version</span><p className="text-xs text-[var(--text-secondary)] mt-0.5">Database freeze</p></div>
              <span className="text-sm font-mono font-bold text-[var(--text-primary)] text-right">Core v1.0</span>
            </div>
            <div className="h-px bg-[var(--border-primary)]" />
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-[var(--text-primary)]">Uptime SLA</span><p className="text-xs text-[var(--text-secondary)] mt-0.5">30-day rolling</p></div>
              <span className="text-sm font-mono font-bold text-[var(--success)] text-right">99.99%</span>
            </div>
            <div className="h-px bg-[var(--border-primary)]" />
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-[var(--text-primary)]">Last Deploy</span><p className="text-xs text-[var(--text-secondary)] mt-0.5">Production release</p></div>
              <span className="text-sm font-mono font-bold text-[var(--text-primary)] text-right">Feb 26, 2026</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

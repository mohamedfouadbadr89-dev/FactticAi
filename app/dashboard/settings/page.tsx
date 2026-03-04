"use client";

import React, { useState, useEffect } from "react";
import { DEPLOYMENT_MODES, REGIONS, type DeploymentMode, type DataResidency, type ComplianceProfile } from "@/lib/config/deploymentMode";
import { Server, Cloud, Building2, Shield, Check, ChevronDown, Save, RefreshCw } from "lucide-react";

// ── Deployment Config Panel (Phase 42) ───────────────────────────────────────

const MODE_ICONS: Record<DeploymentMode, React.ReactNode> = {
  SAAS:        <Cloud className="w-5 h-5" />,
  VPC:         <Shield className="w-5 h-5" />,
  SELF_HOSTED: <Building2 className="w-5 h-5" />,
};

function DeploymentConfigPanel() {
  const [config, setConfig] = useState<{
    mode: DeploymentMode;
    region: string;
    data_residency: DataResidency;
    compliance_profile?: ComplianceProfile;
    region_label?: string;
    mode_features?: string[];
  } | null>(null);

  const [selected, setSelected] = useState<DeploymentMode>('SAAS');
  const [selectedRegion, setSelectedRegion] = useState('us-east-1');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/deployment/config')
      .then(r => r.json())
      .then(data => {
        if (!data.error) {
          setConfig(data);
          setSelected(data.mode);
          setSelectedRegion(data.region);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const residency = REGIONS.find(r => r.value === selectedRegion)?.residency ?? 'US';
      const res = await fetch('/api/deployment/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: selected, region: selectedRegion, data_residency: residency }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to save'); return; }
      setConfig(prev => prev ? { ...prev, ...data } : data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const compliance = config?.compliance_profile;

  const badgeStyle = (mode: DeploymentMode) =>
    selected === mode
      ? 'border-2 border-[' + DEPLOYMENT_MODES[mode].badge + '] bg-[' + DEPLOYMENT_MODES[mode].badge + ']/10'
      : 'border border-[#2d2d2d] hover:border-[#444]';

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 md:p-8 shadow-sm col-span-full animate-[fadeIn_.4s_ease-in-out]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#2d2d2d]">
        <Server className="w-5 h-5 text-[#3b82f6]" />
        <div>
          <h3 className="text-sm font-bold tracking-wide uppercase text-white">Deployment Configuration</h3>
          <p className="text-[10px] text-[#9ca3af] font-mono mt-0.5">Choose how Facttic is deployed within your infrastructure.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 animate-pulse">
          <RefreshCw className="w-7 h-7 text-[#555] animate-spin" />
        </div>
      ) : (
        <>
          {/* Mode selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {(Object.entries(DEPLOYMENT_MODES) as [DeploymentMode, typeof DEPLOYMENT_MODES[DeploymentMode]][]).map(([mode, meta]) => (
              <button
                key={mode}
                onClick={() => setSelected(mode)}
                className={`text-left p-5 rounded-xl transition-all ${badgeStyle(mode)}`}
              >
                <div className="flex items-center gap-2 mb-2" style={{ color: meta.badge }}>
                  {MODE_ICONS[mode]}
                  <span className="text-xs font-black uppercase tracking-widest">{meta.label}</span>
                  {selected === mode && <Check className="w-3.5 h-3.5 ml-auto" />}
                </div>
                <p className="text-[10px] text-[#9ca3af] font-mono leading-relaxed line-clamp-2">{meta.description}</p>
                <ul className="mt-3 space-y-1">
                  {meta.features.slice(0, 3).map((f, i) => (
                    <li key={i} className="text-[9px] text-[#555] font-mono flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-[#444]" />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          {/* Region selector */}
          <div className="mb-6">
            <label className="block text-[9px] font-black uppercase tracking-widest text-[#555] mb-2">Deployment Region</label>
            <div className="relative">
              <select
                value={selectedRegion}
                onChange={e => setSelectedRegion(e.target.value)}
                className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2.5 text-xs font-mono text-[#9ca3af] focus:outline-none focus:border-[#3b82f6] appearance-none"
              >
                {REGIONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label} ({r.residency})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555] pointer-events-none" />
            </div>
          </div>

          {/* Compliance profile */}
          {compliance && (
            <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 mb-6">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#9ca3af] mb-3">Compliance Profile</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                {([
                  { label: 'SOC 2',    val: compliance.soc2 },
                  { label: 'GDPR',     val: compliance.gdpr },
                  { label: 'HIPAA',    val: compliance.hipaa },
                  { label: 'ISO 27001',val: compliance.iso27001 },
                  { label: 'Priv. VPC',val: compliance.privateVpc },
                  { label: 'Audit Log',val: compliance.auditLogs },
                ] as { label: string; val: boolean }[]).map(({ label, val }) => (
                  <div key={label} className={`rounded-lg p-2 text-center border ${val ? 'border-[#10b981]/40 bg-[#10b981]/10' : 'border-[#333] bg-[#1a1a1a]'}`}>
                    <p className="text-[8px] font-black uppercase tracking-widest mb-1" style={{ color: val ? '#10b981' : '#444' }}>{label}</p>
                    <div className={`mx-auto w-3 h-3 rounded-full ${val ? 'bg-[#10b981]' : 'bg-[#333]'}`} />
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-mono text-[#555] leading-relaxed">{compliance.description}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 px-4 py-2.5 bg-[#ef4444]/10 border border-[#ef4444]/40 rounded text-xs text-[#ef4444] font-mono">{error}</div>
          )}

          {/* Save button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 border border-[#3b82f6]/70 text-[#3b82f6] hover:bg-[#3b82f6]/10 text-xs font-black uppercase tracking-widest rounded-lg transition-all disabled:opacity-50"
            >
              {saving ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</>
              ) : saved ? (
                <><Check className="w-4 h-4 text-[#10b981]" /> <span className="text-[#10b981]">Saved</span></>
              ) : (
                <><Save className="w-4 h-4" /> Save Configuration</>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Settings Page ─────────────────────────────────────────────────────────────

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
            <h3 className="card-title">Security &amp; Compliance</h3>
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

      {/* Phase 42 — Deployment Configuration Panel (full-width below grid) */}
      <div className="grid grid-cols-1">
        <DeploymentConfigPanel />
      </div>

    </div>
  );
}

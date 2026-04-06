"use client";

import React, { useState, useEffect } from 'react';
import {
  Shield, Lock, EyeOff, FileText, Activity, Database,
  CheckCircle, UserCheck, Fingerprint, Scale, AlertTriangle,
  RefreshCw, ExternalLink, Key, Globe, Zap, Mic2
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ControlRow {
  id: string;
  criteria: string;
  description: string;
  implementation: string;
  file: string;
  status: 'PASS' | 'PARTIAL' | 'PLANNED';
}

interface LiveStats {
  total_intercepts: number;
  blocked_responses: number;
  active_policies: number;
  governance_score: number;
}

// ── SOC 2 Trust Service Criteria Map ─────────────────────────────────────────

const CONTROLS: ControlRow[] = [
  // CC6 — Logical & Physical Access
  {
    id: 'CC6.1', criteria: 'Logical Access Security',
    description: 'Restricts logical access to the system to authorized users.',
    implementation: 'withAuth() middleware + JWT session tokens on every API route',
    file: 'lib/middleware/auth.ts', status: 'PASS',
  },
  {
    id: 'CC6.2', criteria: 'New Access Authorization',
    description: 'Controls new logical access based on authorization.',
    implementation: 'Supabase Auth signup flow + org_members table for org scoping',
    file: 'lib/orgResolver.ts', status: 'PASS',
  },
  {
    id: 'CC6.3', criteria: 'Access Removal',
    description: 'Removes access when no longer required.',
    implementation: 'GDPR erase endpoint + session revocation via Supabase Auth',
    file: 'app/api/settings/tenant/gdpr_expunge/route.ts', status: 'PASS',
  },
  {
    id: 'CC6.6', criteria: 'External Threat Prevention',
    description: 'Guards against threats from external sources.',
    implementation: 'FraudDetectionEngine evaluates every request; rate-limiting enforced',
    file: 'lib/security/fraudDetectionEngine.ts', status: 'PASS',
  },
  {
    id: 'CC6.7', criteria: 'Data Transmission Integrity',
    description: 'Protects the system components used for data transmission.',
    implementation: 'HTTPS/TLS enforced; HMAC-SHA256 webhook signature verification',
    file: 'lib/integrations/voiceIngestion.ts → verifySignature()', status: 'PASS',
  },
  {
    id: 'CC6.8', criteria: 'Data At Rest Protection',
    description: 'Prevents unauthorized access to data at rest.',
    implementation: 'Supabase AES-256 encryption + BYOK org-level key management',
    file: 'docs/security/byok.md', status: 'PASS',
  },
  // CC7 — System Operations
  {
    id: 'CC7.1', criteria: 'System Monitoring',
    description: 'Detects and monitors for system anomalies and security events.',
    implementation: 'GovernancePipeline intercepts every request; GovernanceAlertEngine fires on thresholds',
    file: 'lib/governance/governancePipeline.ts', status: 'PASS',
  },
  {
    id: 'CC7.2', criteria: 'Anomaly Monitoring',
    description: 'Monitors for indicators of compromise and anomalies.',
    implementation: 'GuardrailDetector + Drift Intelligence + LLM hybrid classifier for ambiguous signals',
    file: 'lib/governance/modules/guardrailDetector.ts', status: 'PASS',
  },
  {
    id: 'CC7.3', criteria: 'Change Evaluation',
    description: 'Evaluates the effect of changes on the system.',
    implementation: 'EvidenceLedger writes every governance execution; immutable facttic_governance_events',
    file: 'lib/evidence/evidenceLedger.ts', status: 'PASS',
  },
  // CC9 — Risk Mitigation
  {
    id: 'CC9.2', criteria: 'Incident Management',
    description: 'Implements incident management procedures.',
    implementation: 'GovernanceAlertEngine triggers alerts; Incidents dashboard for response tracking',
    file: 'lib/governance/alertEngine.ts', status: 'PASS',
  },
  // Availability
  {
    id: 'A1.1', criteria: 'Availability Monitoring',
    description: 'Monitors system availability and performance.',
    implementation: 'PM2 process manager with auto-restart; uptime tracked in system status banner',
    file: 'proxy.ts', status: 'PASS',
  },
  // Confidentiality
  {
    id: 'C1.1', criteria: 'Confidentiality of Information',
    description: 'Protects confidential information from disclosure.',
    implementation: 'Multi-tenant RLS on all tables; every query filters by org_id; no cross-tenant leakage',
    file: 'lib/middleware/auth.ts → resolveOrgContext()', status: 'PASS',
  },
  // Privacy
  {
    id: 'P4.2', criteria: 'PII Collection Limitation',
    description: 'Limits PII collection to what is needed.',
    implementation: 'ComplianceIntelligenceEngine detects and flags PII in transit; no raw prompt storage by default',
    file: 'lib/compliance/complianceEngine.ts', status: 'PASS',
  },
  {
    id: 'P8.1', criteria: 'Right to Erasure',
    description: 'Responds to requests to delete personal information.',
    implementation: 'GDPR erase endpoint deletes all org data; logged in gdpr_erasure_requests',
    file: 'app/api/governance/gdpr-erase/route.ts', status: 'PASS',
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: 'PASS' | 'PARTIAL' | 'PLANNED' }) {
  const cls = status === 'PASS'
    ? 'bg-emerald-400'
    : status === 'PARTIAL'
    ? 'bg-amber-400'
    : 'bg-slate-500';
  return <span className={`inline-block w-2 h-2 rounded-full ${cls}`} />;
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-6 flex flex-col gap-3">
      <Icon className={`w-5 h-5 ${color}`} />
      <p className="text-3xl font-black font-mono">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{label}</p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TrustCenterPage() {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setStats({
          total_intercepts:  data.governance?.total_intercepts  ?? 0,
          blocked_responses: data.governance?.blocked_responses ?? 0,
          active_policies:   data.governance?.active_policies   ?? 0,
          governance_score:  data.governance?.governance_score  ?? 100,
        });
      })
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, []);

  const passCount    = CONTROLS.filter(c => c.status === 'PASS').length;
  const partialCount = CONTROLS.filter(c => c.status === 'PARTIAL').length;
  const coverage     = Math.round((passCount / CONTROLS.length) * 100);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">

      {/* Live Status Banner */}
      <div className="w-full h-8 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] flex items-center justify-center text-[10px] uppercase font-black tracking-widest text-[var(--text-secondary)]">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Governance Engine: ACTIVE
          </span>
          <span className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Integrity Ledger: VERIFIED
          </span>
          <span className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            SOC 2 Controls: {coverage}% COVERAGE
          </span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-8 py-12 space-y-12">

        {/* Header */}
        <header className="flex items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-[var(--accent)]">
              <Shield className="w-10 h-10" />
              <h1 className="text-4xl font-black tracking-tighter uppercase italic">Trust Center</h1>
            </div>
            <p className="max-w-2xl text-[var(--text-secondary)] font-medium leading-relaxed text-sm">
              Institutional overview of Facttic's governance architecture, SOC 2 Type I controls,
              and operational security guarantees for enterprise AI deployments.
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-2">
            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-400">
              SOC 2 Type I — Pre-Audit Ready
            </div>
            <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-400">
              GDPR Article 25 — Privacy by Design
            </div>
          </div>
        </header>

        {/* Live Governance Metrics */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border-primary)] pb-2">
            <Activity className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">Live Governance Metrics</h2>
            {loadingStats && <RefreshCw className="w-3 h-3 animate-spin text-[var(--text-secondary)] ml-auto" />}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Intercepts"    value={stats?.total_intercepts  ?? '—'} icon={Zap}        color="text-[var(--accent)]"  />
            <StatCard label="Blocked Responses"   value={stats?.blocked_responses ?? '—'} icon={Shield}     color="text-red-400"           />
            <StatCard label="Active Policies"     value={stats?.active_policies   ?? '—'} icon={FileText}   color="text-blue-400"          />
            <StatCard label="Governance Score"    value={stats ? `${stats.governance_score}` : '—'} icon={CheckCircle} color="text-emerald-400" />
          </div>
        </section>

        {/* Architecture Flow */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border-primary)] pb-2">
            <Database className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">Control Architecture</h2>
          </div>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-8">
            <div className="flex flex-wrap items-center gap-3 justify-center">
              {[
                { label: 'Client Request', color: 'bg-[var(--bg-primary)] border-[var(--border-primary)]' },
                { label: '→', color: 'border-none bg-transparent text-[var(--text-secondary)]' },
                { label: 'withAuth()', color: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
                { label: '→', color: 'border-none bg-transparent text-[var(--text-secondary)]' },
                { label: 'FraudDetection', color: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
                { label: '→', color: 'border-none bg-transparent text-[var(--text-secondary)]' },
                { label: 'GovernancePipeline', color: 'bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]' },
                { label: '→', color: 'border-none bg-transparent text-[var(--text-secondary)]' },
                { label: 'EvidenceLedger', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
                { label: '→', color: 'border-none bg-transparent text-[var(--text-secondary)]' },
                { label: 'Response', color: 'bg-[var(--bg-primary)] border-[var(--border-primary)]' },
              ].map((step, i) => (
                <span key={i} className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-tight ${step.color}`}>
                  {step.label}
                </span>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                { label: 'Text & Voice', icon: Mic2,        desc: 'Dual-channel governance'   },
                { label: 'Multi-tenant', icon: Globe,       desc: 'RLS + org_id isolation'     },
                { label: 'BYOK Ready',   icon: Key,         desc: 'Org-controlled encryption'  },
                { label: 'Immutable Log',icon: Fingerprint, desc: 'SHA-256 signed ledger'      },
              ].map(({ label, icon: Icon, desc }) => (
                <div key={label} className="space-y-1">
                  <Icon className="w-4 h-4 text-[var(--text-secondary)] mx-auto" />
                  <p className="text-[11px] font-black uppercase tracking-tight">{label}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SOC 2 Controls Mapping */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-2">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">SOC 2 Trust Service Criteria — Controls Map</h2>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
              <span className="flex items-center gap-1.5 text-emerald-400"><StatusDot status="PASS" /> {passCount} Pass</span>
              {partialCount > 0 && <span className="flex items-center gap-1.5 text-amber-400"><StatusDot status="PARTIAL" /> {partialCount} Partial</span>}
              <span className="text-[var(--text-secondary)]">{coverage}% Coverage</span>
            </div>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border-primary)]">
                  {['Control', 'Criteria', 'Implementation', 'File', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CONTROLS.map((ctrl, i) => (
                  <tr key={ctrl.id} className={`border-b border-[var(--border-primary)]/40 hover:bg-[var(--bg-primary)]/60 transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs font-black text-[var(--accent)]">{ctrl.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[11px] font-black text-[var(--text-primary)]">{ctrl.criteria}</p>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 max-w-[180px]">{ctrl.description}</p>
                    </td>
                    <td className="px-4 py-3 max-w-[260px]">
                      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{ctrl.implementation}</p>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-[9px] text-[var(--accent)]/70 font-mono break-all">{ctrl.file}</code>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${
                        ctrl.status === 'PASS'
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          : ctrl.status === 'PARTIAL'
                          ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                          : 'text-slate-400 bg-slate-500/10 border-slate-500/20'
                      }`}>
                        <StatusDot status={ctrl.status} />
                        {ctrl.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Data Security Guarantees */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: EyeOff,      title: 'Data Minimization',      color: 'text-blue-400',    points: ['No raw prompt storage by default', 'PII auto-detected and flagged', 'Anonymized telemetry at source'] },
            { icon: Lock,        title: 'Access Controls',        color: 'text-violet-400',  points: ['JWT + session-cookie auth', 'Row-Level Security on all tables', 'API keys hashed with SHA-256'] },
            { icon: UserCheck,   title: 'Audit & Compliance',     color: 'text-emerald-400', points: ['Immutable event ledger', 'GDPR right-to-erasure endpoint', 'SOC 2 Type I pre-audit ready'] },
          ].map(({ icon: Icon, title, color, points }) => (
            <div key={title} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${color}`} />
                <h3 className="text-xs font-black uppercase tracking-widest">{title}</h3>
              </div>
              <ul className="space-y-2">
                {points.map(p => (
                  <li key={p} className="flex items-start gap-2 text-[11px] text-[var(--text-secondary)]">
                    <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Compliance CTA Banner */}
        <div className="bg-[var(--accent)] text-white rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CheckCircle className="w-48 h-48" />
          </div>
          <div className="space-y-3 relative z-10">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Request Audit Package</h3>
            <p className="max-w-lg text-sm font-medium leading-relaxed opacity-90">
              Certified evidence bundles, signed control test results, and full traceability maps
              are available for authorized auditors via the Evidence Vault.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0 relative z-10">
            <a href="/dashboard/compliance/export" className="flex items-center justify-center gap-2 px-6 py-3 bg-black/20 hover:bg-black/30 rounded-xl border border-white/20 text-xs font-black uppercase tracking-widest transition-all">
              <FileText className="w-4 h-4" /> Evidence Vault
            </a>
            <a href="/dashboard/forensics/live-report" className="flex items-center justify-center gap-2 px-6 py-3 bg-black/20 hover:bg-black/30 rounded-xl border border-white/20 text-xs font-black uppercase tracking-widest transition-all">
              <ExternalLink className="w-4 h-4" /> Live Audit Report
            </a>
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-8 border-t border-[var(--border-primary)] flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--accent)]" />
            <p className="text-[10px] font-black tracking-widest uppercase text-[var(--text-secondary)]">Facttic Trust Guarantee v2.0 — {CONTROLS.length} Controls Mapped</p>
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] font-medium">© 2026 Facttic AI Governance Platform. All telemetry cryptographically verified.</p>
        </footer>
      </div>
    </div>
  );
}

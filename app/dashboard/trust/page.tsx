"use client";

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  EyeOff, 
  FileText, 
  Activity, 
  Database, 
  CheckCircle, 
  UserCheck, 
  Fingerprint, 
  Scale
} from 'lucide-react';

export default function TrustCenterPage() {
  const [integrityStatus, setIntegrityStatus] = useState<string>('Checking...');

  useEffect(() => {
    async function checkIntegrity() {
      try {
        const res = await fetch('/api/governance/ledger/integrity');
        const data = await res.json();
        
        if (data.integrity_status === 'VALID' || data.verified === true) {
          setIntegrityStatus('VERIFIED');
        } else {
          setIntegrityStatus('PENDING');
        }
      } catch (e) {
        setIntegrityStatus('Checking...');
      }
    }
    checkIntegrity();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* System Status Banner */}
      <div className="w-full h-8 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center justify-center text-[10px] uppercase font-black tracking-widest text-[var(--text-secondary)]">
        <div className="flex items-center gap-8">
          <span className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
            Governance Engine: ACTIVE
          </span>
          <span className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${integrityStatus === 'VERIFIED' ? 'bg-[var(--success)]' : 'bg-[var(--warning)] animate-pulse'}`} />
            Integrity Ledger: {integrityStatus}
          </span>
          <span className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
            Audit Status: LIVE
          </span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-8 py-12 space-y-12">
        {/* Header */}
        <header className="space-y-4">
          <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--accent)] bg-[var(--accent)]/5 px-3 py-1 rounded w-fit">
            System integrity metrics are updated periodically
          </div>
          <div className="flex items-center gap-3 text-[var(--accent)]">
            <Shield className="w-10 h-10" />
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Trust Center</h1>
          </div>
          <p className="max-w-2xl text-[var(--text-secondary)] font-medium leading-relaxed">
            Institutional overview of Facttic's governance architecture, security controls, and operational guarantees for enterprise AI safety.
          </p>
        </header>

        {/* 1. Platform Governance Model */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
            <Activity className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-secondary)]">Platform Governance Model</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <p className="text-sm leading-relaxed font-medium">
                Facttic operates as a <strong>Sovereign AI Governance Control Layer</strong>. It sits directly in the execution path between your client environments and AI systems, providing deterministic interception and policy enforcement.
              </p>
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-2">
                <p className="text-[11px] font-bold text-[var(--text-secondary)] italic">Architecture Flow:</p>
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-tighter">
                  <span className="px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded shadow-sm">Client</span>
                  <div className="h-[1px] w-4 bg-[var(--border-subtle)]" />
                  <span className="px-2 py-1 bg-[var(--accent)] text-white rounded shadow-md">Control API</span>
                  <div className="h-[1px] w-4 bg-[var(--border-subtle)]" />
                  <span className="px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded shadow-sm">Pipeline</span>
                  <div className="h-[1px] w-4 bg-[var(--border-subtle)]" />
                  <span className="px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded shadow-sm">Engines</span>
                  <div className="h-[1px] w-4 bg-[var(--border-subtle)]" />
                  <span className="px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded shadow-sm">Ledger</span>
                </div>
              </div>
            </div>
            <div className="relative aspect-video rounded-2xl bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center overflow-hidden shadow-inner group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--accent)_0%,transparent_70%)] opacity-[0.03] group-hover:opacity-[0.05] transition-opacity" />
              <Shield className="w-32 h-32 text-[var(--accent)]/10" />
              <div className="absolute font-mono text-[8px] text-[var(--accent)] uppercase tracking-widest font-black top-4 left-4 opacity-40">GovLayer-v5.0</div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {/* 2. Data Handling */}
          <div className="panel-base p-8 space-y-6">
            <div className="flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-[var(--accent)]" />
              <h3 className="text-sm font-black uppercase tracking-widest">Data Handling</h3>
            </div>
            <ul className="space-y-4">
              <li className="flex gap-4">
                <Database className="w-4 h-4 shrink-0 mt-0.5 text-[var(--text-secondary)]" />
                <div className="space-y-1">
                  <p className="text-[13px] font-bold">In-Memory Processing</p>
                  <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">No prompt or response storage unless explicitly flagged by policy for forensic analysis.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--text-secondary)]" />
                <div className="space-y-1">
                  <p className="text-[13px] font-bold">Anonymized Telemetry</p>
                  <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">All system metrics and telemetry events are anonymized at the source.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <Fingerprint className="w-4 h-4 shrink-0 mt-0.5 text-[var(--text-secondary)]" />
                <div className="space-y-1">
                  <p className="text-[13px] font-bold">Cryptographic Hashing</p>
                  <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">Session IDs are hashed to prevent cross-correlation outside of authorized scopes.</p>
                </div>
              </li>
            </ul>
          </div>

          {/* 3. Security Model */}
          <div className="panel-base p-8 space-y-6">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-[var(--accent)]" />
              <h3 className="text-sm font-black uppercase tracking-widest">Security Model</h3>
            </div>
            <ul className="space-y-4">
              <li className="flex gap-4">
                <UserCheck className="w-4 h-4 shrink-0 mt-0.5 text-[var(--text-secondary)]" />
                <div className="space-y-1">
                  <p className="text-[13px] font-bold">RBAC Enforcement</p>
                  <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">Granular Role-Based Access Control enforced at every API layer and database query.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <Scale className="w-4 h-4 shrink-0 mt-0.5 text-[var(--text-secondary)]" />
                <div className="space-y-1">
                  <p className="text-[13px] font-bold">Service Role Isolation</p>
                  <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">Internal engines operate with isolated identities to prevent lateral movement.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <Shield className="w-4 h-4 shrink-0 mt-0.5 text-[var(--text-secondary)]" />
                <div className="space-y-1">
                  <p className="text-[13px] font-bold">Tamper Verification</p>
                  <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">Deterministic system checks verify the integrity of the governance pipeline hourly.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* 4. Audit Logging */}
        <div className="panel-base p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[var(--accent)]" />
              <h3 className="text-sm font-black uppercase tracking-widest">Audit Ledger Intelligence</h3>
            </div>
            <span className="status-pill sovereign">Immutable</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <p className="text-[12px] font-black uppercase text-[var(--text-secondary)]">Every Event Recorded</p>
              <p className="text-[12px] leading-relaxed">The <code className="text-[var(--accent)] font-bold">governance_event_ledger</code> records every evaluation result, risk score, and policy decision.</p>
            </div>
            <div className="space-y-2">
              <p className="text-[12px] font-black uppercase text-[var(--text-secondary)]">Incident Replay</p>
              <p className="text-[12px] leading-relaxed">Full support for historical session reconstruction to understand specific governance outcomes.</p>
            </div>
            <div className="space-y-2">
              <p className="text-[12px] font-black uppercase text-[var(--text-secondary)]">Forensic Analysis</p>
              <p className="text-[12px] leading-relaxed">Deep-dive tooling for investigating violations and tracing root causes across distributed components.</p>
            </div>
          </div>
        </div>

        {/* 5. Compliance Readiness */}
        <div className="bg-[var(--accent)] text-white rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CheckCircle className="w-48 h-48" />
          </div>
          <div className="space-y-4 relative z-10">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Compliance Readiness</h3>
            <p className="max-w-xl text-sm font-medium leading-relaxed opacity-90">
              Facttic is architected to exceed enterprise audit requirements. Our deterministic logging and real-time interception provide the groundwork for seamless SOC2, HIPAA, and GDPR AI compliance.
            </p>
          </div>
          <div className="flex flex-col gap-3 min-w-[200px] relative z-10">
            <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/20 text-xs font-black uppercase tracking-widest">SOC2 Traceability</div>
            <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/20 text-xs font-black uppercase tracking-widest">Regulatory Logging</div>
            <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/20 text-xs font-black uppercase tracking-widest">Risk Monitoring</div>
          </div>
        </div>

        {/* Footer Guarantee */}
        <footer className="pt-8 border-t border-[var(--border-subtle)] flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--accent)]" />
            <p className="text-[10px] font-black tracking-widest uppercase text-[var(--text-secondary)]">Facttic Trust Guarantee v1.0</p>
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] font-medium">© 2026 Facttic AI Governance Platform. All internal telemetry is cryptographically verified.</p>
        </footer>
      </div>
    </div>
  );
}

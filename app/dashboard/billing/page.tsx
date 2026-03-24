"use client";

import React from 'react';
import { CreditCard, Mail, Shield } from 'lucide-react';

export default function BillingPage() {
  return (
    <div className="p-10 space-y-12 pb-32 max-w-5xl">
      <header>
        <div>
          <div className="flex items-center gap-2 text-[var(--accent)] mb-2">
            <CreditCard className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Financial Control Plane</span>
          </div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
            Enterprise Billing
          </h1>
        </div>
      </header>

      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[2rem] p-12 space-y-8">
        <div className="space-y-4">
          <p className="text-xl font-medium text-[var(--text-primary)]">
            Billing is managed directly. Contact us to upgrade your plan.
          </p>
          <p className="text-sm text-[var(--text-secondary)] max-w-xl">
            To ensure enterprise-grade security and custom governance quotas, all plan upgrades and billing adjustments are handled through our dedicated relationship team.
          </p>
        </div>

        <a 
          href="mailto:billing@facttic.ai"
          className="inline-flex items-center gap-3 px-8 py-4 bg-[var(--accent)] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[var(--accent)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all w-fit"
        >
          <Mail className="w-4 h-4" />
          Contact Sales
        </a>
      </div>

      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-[var(--accent)]/10 flex items-center justify-center border border-[var(--accent)]/30">
            <Shield className="w-8 h-8 text-[var(--accent)]" />
          </div>
          <div>
            <h4 className="text-xl font-black uppercase italic tracking-tighter text-[var(--text-primary)]">Enterprise Financial Integrity</h4>
            <p className="text-sm font-medium text-[var(--text-secondary)]">Facttic billing events are immutable and persisted to the audit ledger for SOC2 compliance.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

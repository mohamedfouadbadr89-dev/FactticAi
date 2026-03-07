"use client";

import React, { useState, useEffect } from 'react';
import { CreditCard, History, Shield, CheckCircle, ArrowRight, Download } from 'lucide-react';
import PricingSelector from '@/components/billing/PricingSelector';
import BillingCycleToggle from '@/components/billing/BillingCycleToggle';

const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000000";

export default function BillingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    fetch(`/api/dashboard/billing/plan?org_id=${DEMO_ORG_ID}`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(e => {
        console.error("Plan fetch failed", e);
        setLoading(false);
      });
  }, []);

  const invoices = [
    { id: 'FC-9921', date: '2026-03-01', amount: 99, status: 'Paid' },
    { id: 'FC-8812', date: '2026-02-01', amount: 99, status: 'Paid' },
    { id: 'FC-7703', date: '2026-01-01', amount: 29, status: 'Paid' }
  ];

  return (
    <div className="p-10 space-y-12 pb-32">
      <header>
        <div className="flex items-center gap-2 text-[var(--accent)] mb-2">
          <CreditCard className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Financial Control Plane</span>
        </div>
        <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
          Plan & Billing
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Current Plan Overview */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[2rem] p-8 space-y-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">Active Subscription</h3>
            
            <div>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-[var(--text-primary)]">
                {loading ? '---' : data?.plan?.name}
              </h2>
              <p className="text-[10px] font-mono text-[var(--text-secondary)] mt-1 uppercase tracking-widest">Enterprise Governance Tier</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                <span>Usage Threshold</span>
                <span className="text-[var(--text-primary)]">{data?.plan?.consumed?.toLocaleString()} / {data?.plan?.limit?.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-[var(--bg-primary)] rounded-full border border-[var(--border-primary)] overflow-hidden">
                <div 
                  className="h-full bg-[var(--accent)] transition-all duration-1000" 
                  style={{ width: `${Math.min(100, data?.plan?.usage_percentage || 0)}%` }} 
                />
              </div>
            </div>

            <div className="pt-6 border-t border-[var(--border-primary)] flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">Next Cycle</p>
                <p className="text-[11px] font-bold">{loading ? '---' : new Date(data?.plan?.next_billing_date).toLocaleDateString()}</p>
              </div>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--success)]/10 text-[var(--success)] rounded-full text-[9px] font-black uppercase border border-[var(--success)]/20">
                <CheckCircle className="w-3 h-3" /> Auto-Renew
              </span>
            </div>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[2rem] p-8 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
              <History className="w-4 h-4" /> Invoice Ledger
            </h3>
            <div className="space-y-3">
              {invoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-4 bg-[var(--bg-primary)]/50 border border-[var(--border-primary)] rounded-2xl group hover:border-[var(--accent)] transition-all">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-tight text-[var(--text-primary)]">{inv.id}</p>
                    <p className="text-[9px] font-mono text-[var(--text-secondary)] uppercase">{inv.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-black text-[var(--text-primary)]">${inv.amount}</span>
                    <button className="p-2 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-primary)] opacity-40 group-hover:opacity-100 transition-all">
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full text-center text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-40 hover:opacity-100 transition-opacity">
              View Full History →
            </button>
          </div>
        </div>

        {/* Pricing Selection */}
        <div className="lg:col-span-2 space-y-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-4">
            <div className="space-y-1">
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-[var(--text-primary)]">
                Governance Scaling
              </h3>
              <div className="flex items-center gap-2 px-3 py-1 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-full w-fit">
                <Shield className="w-3 h-3 text-[var(--accent)]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)]">Enterprise Quotas</span>
              </div>
            </div>

            <BillingCycleToggle 
              value={billingCycle} 
              onChange={setBillingCycle} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            
            {/* Starter Plan */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[2rem] p-8 space-y-8 flex flex-col hover:border-[var(--text-secondary)]/30 transition-all">
              <div className="space-y-1">
                <h4 className="text-lg font-black uppercase text-[var(--text-primary)]">Starter</h4>
                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-60">Entry-level Protection</p>
              </div>
              
              <PricingSelector planId="starter" billingCycle={billingCycle} />

              <ul className="space-y-3 flex-grow">
                {['Governance monitoring', 'Risk alerts', 'Playground access'].map(feat => (
                  <li key={feat} className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-secondary)]">
                    <CheckCircle className="w-3 h-3 text-[var(--success)]" /> {feat}
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all">
                Select Starter
              </button>
            </div>

            {/* Growth Plan - Featured */}
            <div className="bg-[var(--bg-secondary)] border-2 border-[var(--accent)] rounded-[2rem] p-8 space-y-8 flex flex-col relative shadow-2xl shadow-[var(--accent)]/10 scale-[1.05] z-10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[var(--accent)] text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                Most Popular
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-black uppercase text-[var(--text-primary)]">Growth</h4>
                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)]">High Velocity Teams</p>
              </div>

              <PricingSelector planId="growth" billingCycle={billingCycle} />

              <ul className="space-y-3 flex-grow">
                {['Incident timeline', 'Simulator lab', 'Full policy engine', 'Priority interceptors'].map(feat => (
                  <li key={feat} className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-secondary)]">
                    <CheckCircle className="w-3 h-3 text-[var(--success)]" /> {feat}
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 bg-[var(--accent)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--accent)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                Upgrade to Growth
              </button>
            </div>

            {/* Scale Plan */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[2rem] p-8 space-y-8 flex flex-col hover:border-[var(--text-secondary)]/30 transition-all">
              <div className="space-y-1">
                <h4 className="text-lg font-black uppercase text-[var(--text-primary)]">Scale</h4>
                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-60">Unlimited Observability</p>
              </div>

              <PricingSelector planId="scale" billingCycle={billingCycle} />

              <ul className="space-y-3 flex-grow">
                {['Governance analytics', 'Drift intelligence', 'Full forensics tools', 'Custom guardrails'].map(feat => (
                  <li key={feat} className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-secondary)]">
                    <CheckCircle className="w-3 h-3 text-[var(--success)]" /> {feat}
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all">
                Select Scale
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Security Guarantee */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 max-w-[1200px]">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-[var(--accent)]/10 flex items-center justify-center border border-[var(--accent)]/30">
            <Shield className="w-8 h-8 text-[var(--accent)]" />
          </div>
          <div>
            <h4 className="text-xl font-black uppercase italic tracking-tighter text-[var(--text-primary)]">Enterprise Financial Integrity</h4>
            <p className="text-sm font-medium text-[var(--text-secondary)]">Facttic billing events are immutable and persisted to the audit ledger for SOC2 compliance.</p>
          </div>
        </div>
        <button className="px-8 py-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[var(--accent)] hover:text-white transition-all">
          Manage Payment Methods
        </button>
      </div>

    </div>
  );
}

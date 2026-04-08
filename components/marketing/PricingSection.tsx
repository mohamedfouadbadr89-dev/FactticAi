"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, X, ChevronDown } from 'lucide-react';
import { SectionWrapper } from './SectionWrapper';
import { pricingPlans, annualPrice, fmtSessions, type PlanFeatures } from '@/config/pricing';

// ── Types ─────────────────────────────────────────────────────────────────────

type Cycle = 'monthly' | 'annual';

// ── Feature rows shown in every card ─────────────────────────────────────────

const FEATURE_ROWS: { label: string; key: keyof PlanFeatures; format?: (v: any) => string }[] = [
  { label: 'Policy rules',      key: 'policyRules',    format: v => v === null ? 'Unlimited' : `${v} rules` },
  { label: 'Team seats',        key: 'seats',          format: v => v === null ? 'Unlimited' : `${v} seats`  },
  { label: 'All integrations',  key: 'apiAccess'  },
  { label: 'Alerts & webhooks', key: 'webhooks'   },
  { label: 'Live monitoring',   key: 'apiAccess'  },
  { label: 'Session replay',    key: 'sessionReplay'   },
  { label: 'Forensics',         key: 'forensics'       },
  { label: 'Investigations',    key: 'investigations'  },
  { label: 'Simulation lab',    key: 'simulationLab'   },
  { label: 'Stress testing',    key: 'stressTesting'   },
  { label: 'Downloadable reports', key: 'apiAccess'   },
  { label: 'White-label reports',  key: 'whiteLabel'  },
  { label: 'SOC2 / HIPAA / GDPR', key: 'soc2'         },
  { label: 'Self-hosting',      key: 'selfHosting'     },
  { label: 'Custom SLA',        key: 'customSLA'       },
];

const SUPPORT_LABEL: Record<string, string> = {
  email:     'Email support',
  priority:  'Priority support',
  dedicated: 'Dedicated engineer',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function CycleToggle({ value, onChange }: { value: Cycle; onChange: (c: Cycle) => void }) {
  return (
    <div className="inline-flex items-center gap-1 p-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-full">
      {(['monthly', 'annual'] as Cycle[]).map(c => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${
            value === c
              ? 'bg-[var(--accent)] text-white shadow'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          {c === 'annual' ? (
            <span className="flex items-center gap-2">
              Annual
              <span className="bg-[var(--success)]/20 text-[var(--success)] text-[9px] px-2 py-0.5 rounded-full font-black">
                SAVE 20%
              </span>
            </span>
          ) : 'Monthly'}
        </button>
      ))}
    </div>
  );
}

function FeatureItem({ ok, label }: { ok: boolean | string; label: string }) {
  if (typeof ok === 'string') {
    return (
      <li className="flex items-center gap-3 py-1">
        <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
        <span className="text-[13px] text-[var(--text-secondary)]">{ok}</span>
      </li>
    );
  }
  if (ok) {
    return (
      <li className="flex items-center gap-3 py-1">
        <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
        <span className="text-[13px] text-[var(--text-secondary)]">{label}</span>
      </li>
    );
  }
  return (
    <li className="flex items-center gap-3 py-1 opacity-35">
      <X className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
      <span className="text-[13px] text-[var(--text-muted)] line-through">{label}</span>
    </li>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PricingSection({ showDivider }: { showDivider?: boolean }) {
  const [cycle, setCycle]   = useState<Cycle>('monthly');
  const plans = Object.values(pricingPlans);

  // Selected tier index per plan
  const [selected, setSelected] = useState<Record<string, number>>({
    starter: 0,
    growth:  0,
    scale:   0,
  });

  return (
    <SectionWrapper
      id="pricing"
      eyebrow="Simple, Transparent Pricing"
      title="One session. Any AI conversation."
      description="1 monitored session = 1 voice call or 1 chat thread. Voice and chat count from the same quota."
      headerClassName="text-center mx-auto"
      showDivider={showDivider}
    >
      {/* Billing toggle */}
      <div className="flex justify-center mb-12">
        <CycleToggle value={cycle} onChange={setCycle} />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {plans.map((plan, i) => {
          const isGrowth   = plan.id === 'growth';
          const tierIdx    = selected[plan.id] ?? 0;
          const tier       = plan.tiers[tierIdx];
          const monthly    = tier.price;
          const display    = cycle === 'annual' ? annualPrice(monthly) : monthly;
          const feats      = plan.features;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-8 transition-all ${
                isGrowth
                  ? 'border-[var(--accent)] shadow-2xl shadow-[var(--accent)]/10 scale-[1.03] z-10'
                  : 'border-[var(--border-primary)] hover:border-[var(--text-secondary)]/40'
              }`}
            >
              {isGrowth && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[var(--accent)] text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full whitespace-nowrap">
                  Most Popular
                </div>
              )}

              {/* Header */}
              <div className="mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-1">{plan.name}</p>
                <p className="text-[12px] text-[var(--text-secondary)]">{plan.tagline}</p>
              </div>

              {/* Price */}
              <div className="mb-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black text-[var(--text-secondary)]">$</span>
                  <span className="text-5xl font-black tracking-tighter text-[var(--text-primary)]">{display}</span>
                  <span className="text-xs font-bold text-[var(--text-muted)] ml-1">/mo</span>
                </div>
                {cycle === 'annual' && (
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">
                    ${display * 12}/yr · save ${(monthly - display) * 12}
                  </p>
                )}
              </div>

              {/* Session dropdown */}
              <div className="relative mb-6">
                <select
                  value={tierIdx}
                  onChange={e => setSelected(prev => ({ ...prev, [plan.id]: Number(e.target.value) }))}
                  className="w-full appearance-none bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-[12px] font-black uppercase tracking-wider cursor-pointer outline-none hover:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
                >
                  {plan.tiers.map((t, idx) => (
                    <option key={idx} value={idx}>
                      {fmtSessions(t.sessions)} sessions / month
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-secondary)] pointer-events-none" />
              </div>

              {/* CTA */}
              <Link
                href="/login"
                className={`block w-full text-center py-3.5 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all mb-8 ${
                  isGrowth
                    ? 'bg-[var(--accent)] text-white hover:opacity-90 shadow-lg shadow-[var(--accent)]/20'
                    : 'bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)]'
                }`}
              >
                {plan.id === 'scale' ? 'Talk to Sales' : 'Get Started'}
              </Link>

              {/* Divider */}
              <div className="border-t border-[var(--border-subtle)] mb-6" />

              {/* Features */}
              <ul className="space-y-0.5 flex-1">
                {/* Support */}
                <FeatureItem ok={SUPPORT_LABEL[feats.support]} label="" />

                {/* Policy rules */}
                <FeatureItem
                  ok={feats.policyRules === null ? 'Unlimited policy rules' : `${feats.policyRules} policy rules`}
                  label=""
                />

                {/* Seats */}
                <FeatureItem
                  ok={feats.seats === null ? 'Unlimited team seats' : `${feats.seats} team seats`}
                  label=""
                />

                {FEATURE_ROWS.slice(2).map(row => {
                  const val = feats[row.key];
                  const display = row.format ? row.format(val) : val;
                  return <FeatureItem key={row.key + row.label} ok={typeof display === 'string' ? display : !!val} label={row.label} />;
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Session explainer */}
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-[12px] text-[var(--text-muted)] font-medium">
        <span className="flex items-center gap-2">
          <span className="text-base">🎙️</span>
          1 voice call = 1 session
        </span>
        <span className="hidden sm:block w-px h-4 bg-[var(--border-subtle)]" />
        <span className="flex items-center gap-2">
          <span className="text-base">💬</span>
          1 chat thread = 1 session
        </span>
        <span className="hidden sm:block w-px h-4 bg-[var(--border-subtle)]" />
        <span className="flex items-center gap-2">
          <span className="text-base">🤖</span>
          Unlimited agents on all plans
        </span>
      </div>
    </SectionWrapper>
  );
}

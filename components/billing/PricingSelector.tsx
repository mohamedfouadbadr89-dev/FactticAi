"use client";

import React, { useState } from 'react';
import { Check, ChevronDown, Zap } from 'lucide-react';
import { getAllTiers } from '@/config/pricing';

const TIERS = getAllTiers().map(t => ({
  id: t.id,
  name: t.planName,
  limit: t.interactions,
  price: t.price,
  featured: t.planId === 'growth' && t.interactions === 100000
}));

interface PricingSelectorProps {
  planId: 'starter' | 'growth' | 'scale';
  billingCycle?: 'monthly' | 'annual';
}

export default function PricingSelector({ planId, billingCycle = 'monthly' }: PricingSelectorProps) {
  const planTiers = TIERS.filter(t => t.id.startsWith(planId));
  const [selectedId, setSelectedId] = useState(planTiers[0]?.id);
  const selected = planTiers.find(t => t.id === selectedId) || planTiers[0];

  if (!selected) return null;

  const displayPrice = billingCycle === 'annual' 
    ? Math.floor(selected.price * 0.8) 
    : selected.price;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-sm font-black text-[var(--text-secondary)]">$</span>
          <span className="text-6xl font-black tracking-tighter text-[var(--text-primary)] transition-all duration-300">
            {displayPrice}
          </span>
          <span className="text-xs font-black text-[var(--text-secondary)] uppercase">/mo</span>
        </div>
        {billingCycle === 'annual' && (
          <span className="text-[8px] font-black uppercase tracking-widest text-[var(--accent)] animate-in fade-in slide-in-from-top-1 duration-500">Billed Annually</span>
        )}
      </div>

      <div className="relative group">
        <select 
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest appearance-none hover:border-[var(--accent)] transition-all cursor-pointer outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
        >
          {planTiers.map(tier => (
            <option key={tier.id} value={tier.id}>
              {tier.limit >= 1000000 ? `${tier.limit / 1000000}M` : `${tier.limit / 1000}k`} interactions
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-secondary)] pointer-events-none group-hover:text-[var(--accent)] transition-colors" />
      </div>
    </div>
  );
}

"use client";

import React from 'react';
import { SectionWrapper } from './SectionWrapper';
import { marketingData } from '@/lib/marketing/marketingData';

export function WhatIsSection({ showDivider }: { showDivider?: boolean }) {
  const { whatIs } = marketingData;

  return (
    <SectionWrapper
      eyebrow={whatIs.eyebrow}
      title={whatIs.title}
      description={whatIs.description}
      showDivider={showDivider}
    >
      <div className="card bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl overflow-hidden divide-x divide-[var(--border-primary)] grid grid-cols-2">
        {/* Column A: IS NOT */}
        <div className="p-8 space-y-6 bg-[color-mix(in_srgb,var(--danger)_4%,transparent)]">
          <h3 className="text-[10px] font-mono font-black uppercase tracking-widest text-[var(--danger)]">
            Facttic is NOT
          </h3>
          <ul className="space-y-4">
            {whatIs.isNotItems.map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm font-semibold text-[var(--text-secondary)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)] opacity-40" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Column B: IS */}
        <div className="p-8 space-y-6">
          <h3 className="text-[10px] font-mono font-black uppercase tracking-widest text-[var(--accent)]">
            Facttic IS
          </h3>
          <ul className="space-y-4">
            {whatIs.isItems.map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm font-bold text-[var(--text-primary)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionWrapper>
  );
}

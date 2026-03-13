"use client";

import React from 'react';
import { CountUp } from '@/components/ui/CountUp';
import { SectionWrapper } from './SectionWrapper';
import { marketingData } from '@/lib/marketing/marketingData';

export function MetricsBar({ showDivider }: { showDivider?: boolean }) {
  const { metrics } = marketingData;

  return (
    <SectionWrapper id="metrics" showDivider={showDivider}>
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 divide-y md:divide-y-0 lg:divide-x divide-[var(--border-primary)]">
          {metrics.map((stat, i) => (
            <div key={i} className="px-8 py-10 space-y-3">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                {stat.label}
              </h4>
              <div className="flex items-baseline gap-1">
                {stat.prefix && (
                  <span className="text-xl font-bold text-[var(--text-muted)]">{stat.prefix}</span>
                )}
                <div className="hc-score text-[var(--text-primary)]">
                  <CountUp value={stat.value} decimals={stat.decimals ?? 0} />
                </div>
                {stat.suffix && (
                  <span className="text-xl font-bold text-[var(--text-muted)]">{stat.suffix}</span>
                )}
              </div>
              <p className="text-[11px] font-medium text-[var(--text-muted)] lg:max-w-[120px]">
                {stat.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}


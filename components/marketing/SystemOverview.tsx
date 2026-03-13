"use client";

import React from 'react';
import { SectionWrapper } from './SectionWrapper';
import { marketingData } from '@/lib/marketing/marketingData';

export function SystemOverview() {
  const { systemOverview } = marketingData;

  return (
    <SectionWrapper
      id="system-overview"
      eyebrow={systemOverview.eyebrow}
      title={systemOverview.title}
      description={systemOverview.description}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        {systemOverview.stats.map((stat, i) => (
          <div key={i} className="card p-10 space-y-4">
            <h4 className="card-metadata">
              {stat.label}
            </h4>
            <div className="text-4xl font-serif font-bold text-[var(--text-primary)] tracking-tighter">
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

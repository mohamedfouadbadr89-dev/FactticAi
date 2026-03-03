import React from 'react';
import { SectionWrapper } from './SectionWrapper';
import { marketingData } from '@/lib/marketing/marketingData';

export function InstitutionalQuote() {
  const { authority } = marketingData;
  return (
    <SectionWrapper className="bg-[var(--bg-primary)]">
      <div className="max-w-[900px] mx-auto text-center py-12 md:py-20 space-y-12">
        {/* Top Divider */}
        <div className="flex justify-center">
          <div className="w-16 h-px bg-[var(--border-primary)] opacity-60" />
        </div>

        <blockquote className="text-2xl md:text-3xl font-serif font-medium text-[var(--text-primary)] leading-tight italic">
          "{authority.quote}"
        </blockquote>

        <div className="space-y-2">
          <p className="text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-[var(--text-secondary)]">
            {authority.citation}
          </p>
        </div>

        {/* Bottom Divider */}
        <div className="flex justify-center">
          <div className="w-16 h-px bg-[var(--border-primary)] opacity-60" />
        </div>
      </div>
    </SectionWrapper>
  );
}

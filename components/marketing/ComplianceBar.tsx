"use client";

import React from 'react';
import { marketingData } from '@/lib/marketing/marketingData';

export function ComplianceBar() {
  const { compliance } = marketingData;

  return (
    <div className="w-full bg-[var(--bg-secondary)] border-y border-[var(--border-primary)] py-6 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-8 flex flex-col md:flex-row items-center gap-8">
        {/* Left Label */}
        <div className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-[var(--muted)] whitespace-nowrap">
          Regulatory Verification
        </div>

        {/* Right: Scrollable Badge List */}
        <div className="w-full overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-3 pb-2 md:pb-0">
            {compliance.badges.map((badge) => (
              <div 
                key={badge}
                className="whitespace-nowrap rounded-full px-4 py-2 border border-[var(--border-primary)] bg-[var(--card-bg)] text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:border-[var(--accent)] transition-all duration-150 cursor-default"
              >
                {badge}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

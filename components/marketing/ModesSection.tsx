"use client";

import React from 'react';
import { SectionWrapper } from './SectionWrapper';
import { marketingData } from '@/lib/marketing/marketingData';

export function ModesSection({ showDivider }: { showDivider?: boolean }) {
  const { modes } = marketingData;

  return (
    <SectionWrapper
      eyebrow={modes.eyebrow}
      title={modes.title}
      description={modes.description}
      showDivider={showDivider}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {modes.items.map((mode) => (
          <div 
            key={mode.id} 
            className={`card bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-[var(--radius)] p-10 space-y-8 flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-[2px] ${mode.label.toLowerCase().includes('enterprise') ? 'card-primary-glow' : ''}`}
          >
            <div className="space-y-4">
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)]">
                {mode.label}
              </div>
              <h3 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
                {mode.title}
              </h3>
              <p className="text-[var(--text-secondary)] font-medium leading-relaxed">
                {mode.description}
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-[var(--border-primary)]/50">
              <span className="text-[10px] font-mono font-black text-[var(--text-muted)] tracking-widest uppercase">
                Core Capabilities
              </span>
              <ul className="grid grid-cols-1 gap-4">
                {mode.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-[13px] font-semibold text-[var(--text-primary)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="pt-6 mt-auto">
               <div className="flex items-center gap-2 text-[10px] font-bold font-mono text-[var(--text-muted)] uppercase tracking-wider">
                 <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
                 Ready for Audit v1.0
               </div>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

"use client";

import React from 'react';
import { SectionWrapper } from './SectionWrapper';
import { marketingData } from '@/lib/marketing/marketingData';

export function LayersSection({ showDivider }: { showDivider?: boolean }) {
  const { layers } = marketingData;

  return (
    <SectionWrapper
      eyebrow={layers.eyebrow}
      title={layers.title}
      description={layers.description}
      showDivider={showDivider}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {layers.items.map((layer) => (
          <div 
            key={layer.id} 
            className="card bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-[var(--radius)] p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-[2px]"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black text-[var(--text-muted)] tracking-widest uppercase">
                  Layer {layer.id} — {layer.label}
                </span>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-serif font-bold text-[var(--text-primary)]">{layer.title}</h3>
                <ul className="space-y-3 pt-2">
                  {layer.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2.5 text-[13px] font-medium text-[var(--text-secondary)]">
                      <div className="w-1 h-1 rounded-full bg-[var(--accent)] shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-8 mt-auto flex items-center justify-between border-t border-[var(--border-primary)]/50">
              <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">
                {layer.modules}
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

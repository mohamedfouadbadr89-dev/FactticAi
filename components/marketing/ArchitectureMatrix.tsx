"use client";

import React from 'react';
import { SectionWrapper } from './SectionWrapper';
import { marketingData } from '@/lib/marketing/marketingData';

export function ArchitectureMatrix() {
  const { architectureMatrix } = marketingData;

  return (
    <SectionWrapper
      id="architecture-matrix"
      eyebrow={architectureMatrix.eyebrow}
      title={architectureMatrix.title}
      description={architectureMatrix.description}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-[var(--border-primary)] border border-[var(--border-primary)] mt-12">
        {architectureMatrix.layers.map((layer) => (
          <div key={layer.id} className="card p-12 bg-[var(--bg-elevated)]">
            <div className="space-y-6 flex-1">
              <div className="flex justify-between items-center">
                <span className="card-metadata text-[var(--gold)]">{layer.id}</span>
                <span className="card-metadata px-2 py-0.5 border border-[var(--border-primary)] opacity-60">{layer.modules} Modules</span>
              </div>
              <h3 className="card-title text-2xl tracking-tighter">{layer.name}</h3>
              <p className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-widest leading-relaxed">
                Primary Focus: {layer.focus}
              </p>
            </div>
            <div className="pt-8 border-t border-[var(--border-primary)] mt-8">
              <div className="card-metadata text-[var(--text-secondary)] opacity-40">Active Operational Protocol</div>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

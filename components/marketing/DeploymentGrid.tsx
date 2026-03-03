"use client";

import React from 'react';
import { SectionWrapper } from './SectionWrapper';
import { marketingData } from '@/lib/marketing/marketingData';

export function DeploymentGrid() {
  const { deploymentGrid } = marketingData;

  return (
    <SectionWrapper
      id="deployment-grid"
      eyebrow={deploymentGrid.eyebrow}
      title={deploymentGrid.title}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--border-primary)] border border-[var(--border-primary)] mt-12">
        {deploymentGrid.options.map((option) => (
          <div key={option.name} className="card p-10 bg-[var(--bg-elevated)]">
            <div className="space-y-6 flex-1">
              <h3 className="card-title text-xl uppercase tracking-tight">{option.name}</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-[var(--border-primary)] pb-2">
                  <span className="card-metadata">Access Vector</span>
                  <span className="card-metadata text-[var(--text-primary)]">{option.access}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[var(--border-primary)] pb-2">
                  <span className="card-metadata">Security Profile</span>
                  <span className="card-metadata text-[var(--gold)]">{option.security}</span>
                </div>
              </div>
            </div>
            <div className="pt-10">
              <div className="card-metadata opacity-60">
                Available for Deployment
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

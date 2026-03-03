"use client";

import React from 'react';
import { SectionWrapper } from './SectionWrapper';
import { marketingData } from '@/lib/marketing/marketingData';

export function ComplianceSnapshot() {
  const { complianceReadiness } = marketingData;

  return (
    <SectionWrapper
      id="compliance-snapshot"
      eyebrow={complianceReadiness.eyebrow}
      title={complianceReadiness.title}
    >
      <div className="card mt-12 bg-[var(--bg-elevated)]">
        <div className="card-header bg-[var(--bg-secondary)] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[var(--success)]" />
            <span className="card-metadata text-[var(--text-primary)]">
              Protocol Integrity Stable
            </span>
          </div>
          <span className="card-metadata opacity-60">
            Snapshot: {complianceReadiness.snapshot.lastAudit}
          </span>
        </div>
        
        <div className="p-12 grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="card-metadata">Compliance Index Status</p>
              <div className="hc-score text-[var(--success)]">
                {complianceReadiness.snapshot.status}
              </div>
            </div>
            <div className="space-y-4">
              <p className="card-metadata">Active Verification Frameworks</p>
              <div className="flex flex-wrap gap-2">
                {complianceReadiness.snapshot.frameworks.map((framework) => (
                  <span key={framework} className="px-3 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] card-metadata text-[var(--text-primary)]">
                    {framework}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col justify-center space-y-8 lg:border-l lg:border-[var(--border-primary)] lg:pl-16">
            <div className="space-y-1">
              <p className="card-metadata">Evidence Nodes Sequenced</p>
              <div className="text-4xl font-serif font-bold text-[var(--text-primary)] tracking-tighter">{complianceReadiness.snapshot.evidenceNodes}</div>
            </div>
            <div className="p-6 bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
              <p className="text-[10px] font-mono text-[var(--text-muted)] leading-relaxed uppercase tracking-[0.2em]">
                All evidence nodes are cryptographically sealed and accessible via the dedicated auditor portal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}

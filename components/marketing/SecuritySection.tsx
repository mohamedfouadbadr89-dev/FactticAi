"use client";

import React from 'react';
import { SectionWrapper } from './SectionWrapper';
import { marketingData } from '@/lib/marketing/marketingData';
import { motion } from 'framer-motion';

export function SecuritySection({ showDivider }: { showDivider?: boolean }) {
  const { security } = marketingData;

  return (
    <SectionWrapper
      eyebrow={security.eyebrow}
      title={security.title}
      description={security.description}
      showDivider={showDivider}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
        {/* Left Column: Security Themes */}
        <div className="space-y-12">
          <div className="grid grid-cols-1 gap-10">
            {security.features.map((feature, i) => (
              <div key={i} className="group flex gap-6">
                <div className="flex flex-col items-center">
                   <div className="w-6 h-6 rounded-full border border-[var(--border-primary)] flex items-center justify-center shrink-0 group-hover:border-[var(--gold)] transition-colors">
                    <div className="w-1.5 h-1.5 bg-[var(--gold)] rounded-full" />
                  </div>
                  {i < security.features.length - 1 && (
                    <div className="w-px h-full bg-gradient-to-b from-[var(--border-primary)] to-transparent mt-2" />
                  )}
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-serif font-bold text-[var(--text-primary)] leading-tight">{feature.title}</h4>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-8 border-t border-[var(--border-primary)]/40">
             <div className="text-[10px] font-mono font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Institutional Verification Required</div>
          </div>
        </div>

        {/* Right Column: Cryptographic Proof Visualization */}
        <div className="space-y-8">
          {/* Tamper Status Card */}
          <div className="card bg-[var(--navy)] text-white p-10 border-white/10 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4">
                <div className="w-2 h-2 bg-[var(--success)]" />
             </div>
             <div className="relative z-10 flex items-center justify-between">
                <div className="space-y-4">
                  <p className="card-metadata text-white/40">Audit Readiness</p>
                  <p className="hc-score text-white">{security.tamperStatus.events}</p>
                  <p className="card-metadata text-[var(--success)]">Tamper Events Detected</p>
                </div>
                <div className="text-right space-y-2">
                  <p className="card-metadata text-white/40">{security.tamperStatus.window}</p>
                  <p className="card-metadata text-white/60">{security.tamperStatus.status}</p>
                </div>
             </div>
          </div>

          {/* Live Chain Preview */}
          <div className="card bg-[var(--bg-elevated)]">
             <div className="card-header bg-[var(--bg-secondary)] flex justify-between items-center">
                <span className="card-metadata text-[var(--text-primary)]">Live Audit Chain</span>
                <span className="card-metadata text-[var(--gold)]">SHA-256 PIPELINE</span>
             </div>
             <div className="p-8 space-y-4">
                {security.liveChain.map((event, idx: number) => (
                  <motion.div 
                    key={event.id}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-none group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="card-metadata opacity-60">{event.id}</span>
                      <span className="text-[11px] font-mono text-[var(--text-primary)] tracking-tighter">{event.hash}</span>
                    </div>
                    <span className="card-metadata text-[var(--success)] px-1.5 py-0.5 border border-[var(--success)]/30">
                      {event.status}
                    </span>
                  </motion.div>
                ))}
             </div>
             <div className="p-6 bg-[var(--bg-secondary)] border-t border-[var(--border-primary)]">
                <div className="flex justify-between items-center card-metadata">
                   <span>Consensus Root Verification</span>
                   <span className="text-[var(--text-primary)]">0x82...BF92</span>
                </div>
             </div>
          </div>

          {/* Auditor Badge */}
          <div className="flex items-center gap-6 p-8 border border-[var(--border-primary)] opacity-60">
             <div className="w-12 h-12 grayscale brightness-50 contrast-125 opacity-40 shrink-0">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L3 7v10l9 5 9 -5V7l-9 -5zm0 18l-7 -3.9V8.1l7 3.9 7 -3.9v8l-7 3.9z"/></svg>
             </div>
             <p className="text-[11px] font-medium text-[var(--text-secondary)] leading-relaxed italic uppercase tracking-wider font-mono">
               "Facttic's protocol-locked agent versions ensure that once a governance baseline is established, it cannot be regressed without signed consensus from authorized stakeholders."
             </p>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}

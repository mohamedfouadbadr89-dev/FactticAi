"use client";

import React from 'react';
import { Button } from '@/components/ui/Button';
import { CountUp } from '@/components/ui/CountUp';
import { SectionWrapper } from './SectionWrapper';
import { marketingData } from '@/lib/marketing/marketingData';

export function HeroSection() {
  const { hero } = marketingData;
  return (
    <SectionWrapper id="hero" className="bg-[var(--surface-2)] relative overflow-hidden" disableAnimation>
      {/* Hero Depth Layers */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,var(--surface-1)_0%,transparent_70%)] pointer-events-none" aria-hidden="true" />
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none" aria-hidden="true" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{ boxShadow: 'inset 0 0 120px 60px var(--surface-2)' }} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        {/* Left Content: Governing Authority Control */}
        <div className="space-y-12 lg:pr-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-none">
            <div className="w-1.5 h-1.5 bg-[var(--gold)]" />
            <span className="text-mono text-[var(--text-secondary)]">
              {hero.eyebrow}
            </span>
          </div>

          <div className="space-y-6">
            <h1 className="text-display text-[var(--text-primary)]">
              {hero.title}
            </h1>
            <p className="text-mono max-w-lg text-[var(--text-muted)]">
              {hero.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <Button 
              variant="primary" 
              className="w-full sm:w-auto px-10 py-6 text-mono rounded-none bg-[var(--accent)] text-white border-none shadow-none hover:bg-[var(--accent)]/90"
              aria-label={`Execute ${hero.primaryCta}`}
            >
              {hero.primaryCta}
            </Button>
            <Button 
              variant="outline" 
              className="w-full sm:w-auto px-10 py-6 text-mono border-[var(--border-primary)] rounded-none bg-transparent hover:bg-[var(--bg-secondary)]"
              aria-label={`Execute ${hero.secondaryCta}`}
            >
              {hero.secondaryCta}
            </Button>
          </div>
        </div>

        {/* Right Content: Embedded Institutional Control Plane */}
        <div className="w-full border-l border-[var(--border-primary)] pl-16">
          <div className="card bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-none p-0 overflow-hidden shadow-none">
            {/* Private Header */}
            <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] px-8 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-[var(--gold)]" />
                <span className="text-mono text-[var(--text-primary)]">
                  {hero.preview.org}
                </span>
              </div>
              <div className="text-mono text-[var(--text-muted)]">
                SESSION: 0x82...BF92
              </div>
            </div>

            <div className="p-10 space-y-10">
              {/* Composite Index */}
              <div className="flex items-end justify-between border-b border-[var(--border-primary)] pb-10">
                <div className="space-y-2">
                  <p className="text-mono text-[var(--text-muted)]">Governance Health Index</p>
                  <h3 className="text-7xl font-serif font-bold text-[var(--text-primary)] tracking-tighter">
                    <CountUp value={hero.preview.score} />
                  </h3>
                </div>
                <div className="text-right pb-1">
                  <p className="text-mono text-[var(--success)] mb-3">Protocol: Optimal</p>
                  <div className="h-1.5 w-40 bg-[var(--bg-secondary)] rounded-none overflow-hidden border border-[var(--border-primary)]">
                    <div className="h-full bg-[var(--success)] w-[94%]" />
                  </div>
                </div>
              </div>

              {/* Core Telemetry */}
              <div className="grid grid-cols-2 gap-px bg-[var(--border-primary)] border border-[var(--border-primary)]">
                <div className="bg-[var(--bg-elevated)] p-6">
                  <p className="text-mono text-[var(--text-muted)] mb-3">Behavioral Drift</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[var(--text-primary)]">+{hero.preview.drift}%</span>
                    <span className="text-mono text-[var(--success)]">Verified</span>
                  </div>
                </div>
                <div className="bg-[var(--bg-elevated)] p-6">
                  <p className="text-mono text-[var(--text-muted)] mb-3">RCA Confidence</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[var(--text-primary)]">{hero.preview.rca}%</span>
                    <span className="text-mono text-[var(--gold)]">Deterministic</span>
                  </div>
                </div>
              </div>

              {/* Active Monitoring Alerts */}
              <div className="space-y-4">
                <p className="text-mono text-[var(--text-muted)] mb-4">Active Policy Interceptors</p>
                <div className="divide-y divide-[var(--border-primary)] border border-[var(--border-primary)]">
                  {hero.preview.alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 bg-[var(--bg-elevated)] group/alert">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 ${alert.severity === 'High' ? 'bg-[var(--danger)]' : 'bg-[var(--warning)]'}`} />
                        <span className="text-body-sm text-[var(--text-primary)] uppercase tracking-tight">{alert.title}</span>
                      </div>
                      <span className="text-mono-xs text-[var(--text-muted)]">{alert.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Sovereign Badge */}
          <div className="absolute -top-4 -right-4 bg-[var(--surface-0)] border border-[var(--accent-gold)] text-[var(--accent-gold)] px-6 py-4 rounded-none z-20">
            <div className="flex flex-col items-center gap-1">
              <span className="text-mono">{hero.preview.ledgerStatus}</span>
              <span className="text-mono-xs opacity-60">Audit Ledger Sealed</span>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}



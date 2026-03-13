"use client";

import React from 'react';
import { Button } from '@/components/ui/Button';
import { SectionWrapper } from './SectionWrapper';

const pricing = {
  eyebrow: "Governance Frameworks",
  title: "Enterprise-Grade Tiers.",
  description: "Select the institutional governance framework aligned to your regulatory obligations and operational perimeter.",
  tiers: [
    { id: "foundation", label: "STANDARD", name: "Governance Foundation", price: "ENTERPRISE ENTRY", description: "Baseline deterministic oversight for emerging AI deployments.", featured: false, variant: "outline" as const, buttonText: "Request Evaluation", features: ["Control Plane Access", "Semantic Policy Enforcement", "Deterministic Audit Logs", "Standard SLA"] },
    { id: "enterprise", label: "RECOMMENDED", name: "Enterprise Governance", price: "MANAGED IMPLEMENTATION", description: "Complete governance infrastructure for regulated institutions.", featured: true, variant: "primary" as const, buttonText: "Initialize Implementation", features: ["Executive Health Indexing", "Behavioral Drift Alarms", "Enterprise SLA (99.99%)", "Dedicated Support"] },
    { id: "sovereign", label: "MAXIMUM SECURITY", name: "Sovereign Platform", price: "CUSTOM PROTOCOL", description: "Dedicated governance enclaves for air-gapped or critical state systems.", featured: false, variant: "outline" as const, buttonText: "Contact Systems Eng", features: ["Air-Gapped Audit Enclaves", "Hardware-Root Validation", "BYOK Encryption Support", "Custom SLA"] }
  ]
};

export function PricingSection({ showDivider }: { showDivider?: boolean }) {
  return (
    <SectionWrapper
      id="governance-frameworks"
      eyebrow={pricing.eyebrow}
      title={pricing.title}
      description={pricing.description}
      headerClassName="text-center mx-auto"
      showDivider={showDivider}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-8">
        {pricing.tiers.map((tier) => {
          const isEnterprise = tier.featured;
          return (
            <div 
              key={tier.id} 
              className={`card bg-[var(--bg-elevated)] p-10 flex flex-col transition-all duration-300 border rounded-xl overflow-visible hover:-translate-y-[2px] ${
                isEnterprise 
                  ? "border-[var(--accent)] shadow-2xl scale-[1.03] z-10 card-primary-glow" 
                  : "border-[var(--border-primary)]"
              }`}
            >
              {isEnterprise && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--accent)] text-white text-[9px] font-mono font-bold px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg whitespace-nowrap">
                  Recommended Protocol
                </div>
              )}
              
              <div className="space-y-6 mb-12">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest">
                    {tier.label}
                  </span>
                  <h3 className="text-3xl font-serif font-bold text-[var(--text-primary)]">
                    {tier.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-xl font-mono font-bold text-[var(--text-primary)] opacity-80 uppercase tracking-tighter">{tier.price}</span>
                  </div>
                  <p className="text-[10px] font-mono font-medium text-[var(--text-muted)] uppercase tracking-widest pt-2">
                    Governance Tier v1.0
                  </p>
                </div>
                
                <p className="text-sm font-medium text-[var(--text-secondary)] leading-relaxed">
                  {tier.description}
                </p>
              </div>

              <div className="space-y-6 flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-px bg-[var(--border-primary)] flex-1" />
                  <span className="text-[9px] font-mono font-black text-[var(--text-muted)] tracking-widest uppercase">
                    Framework Features
                  </span>
                  <div className="h-px bg-[var(--border-primary)] flex-1" />
                </div>
                <ul className="space-y-5">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" />
                      <span className="text-[13px] font-semibold text-[var(--text-primary)] leading-tight">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-12 mt-auto">
                <Button 
                  variant={tier.variant}
                  className="w-full py-4 text-[12px] uppercase tracking-[0.2em] font-bold"
                  aria-label={`Initialize ${tier.name} framework`}
                >
                  {tier.buttonText}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </SectionWrapper>
  );
}

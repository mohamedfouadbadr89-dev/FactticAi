"use client";

import React from 'react';
import { SectionWrapper } from './SectionWrapper';

const comparisons = [
  { label: "OBSERVABILITY", target: "LangSmith", comp: "Prompt tracing and evaluation framework for LLM applications.", facttic: "Deterministic governance enforcement, not just observation." },
  { label: "ANALYTICS", target: "Helicone", comp: "Request logging and cost tracking for LLM API calls.", facttic: "Full-spectrum audit integrity with cryptographic proof." },
  { label: "ML OPS", target: "Arize AI", comp: "Model monitoring and performance analysis platform.", facttic: "Institutional-grade risk attribution and policy enforcement." },
  { label: "EVALUATION", target: "Galileo", comp: "LLM output evaluation and hallucination detection.", facttic: "End-to-end behavioral control with immutable audit chains." }
];

export function PositionSection({ showDivider }: { showDivider?: boolean }) {
  return (
    <SectionWrapper id="positioning" showDivider={showDivider} title="Facttic Ecosystem Alignment">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {comparisons.map((item, i) => (
          <div 
            key={i} 
            className="card bg-[var(--bg-elevated)] p-8 border border-[var(--border-primary)] rounded-xl flex flex-col h-full transition-all duration-200 hover:border-[var(--accent)] hover:-translate-y-0.5"
          >
            <div className="space-y-4 mb-6">
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-black text-[var(--text-muted)] uppercase tracking-widest">
                  {item.label}
                </span>
                <h3 className="text-xl font-serif font-bold text-[var(--text-primary)]">
                   vs {item.target}
                </h3>
              </div>
              <p className="text-sm font-medium text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                {item.comp}
              </p>
            </div>

            <div className="mt-auto">
              <div className="w-full h-px bg-[var(--border-primary)] opacity-40 mb-6" />
              <div className="space-y-3">
                <div className="text-[10px] font-mono font-bold text-[var(--accent)] uppercase tracking-[0.2em]">
                  The Facttic Position
                </div>
                <p className="text-[13px] font-bold text-[var(--text-primary)] leading-relaxed line-clamp-2">
                  {item.facttic}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

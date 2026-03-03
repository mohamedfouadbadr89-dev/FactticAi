import React from 'react';
import { SectionWrapper } from './SectionWrapper';
import { marketingData } from '@/lib/marketing/marketingData';

export function UseCasesSection() {
  const { useCases } = marketingData;
  return (
    <SectionWrapper
      id="enterprise-use-cases"
      title={useCases.title}
      className="bg-[var(--parch2)]"
      headerClassName="text-center mx-auto"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {useCases.items.map((item, index) => (
          <div 
            key={index}
            className="flex flex-col bg-white border border-[var(--rule)] rounded-lg p-8 space-y-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            <h3 className="text-xl font-serif font-bold text-[var(--ink)] leading-tight">
              {item.title}
            </h3>
            
            <div className="space-y-4 flex-1">
              <div>
                <p className="text-sm text-[var(--navy3)] leading-relaxed italic mb-1">
                  Risk Scenario
                </p>
                <p className="text-sm font-medium text-[var(--ink2)] leading-relaxed">
                  {item.scenario}
                </p>
              </div>
              
              <div className="pt-4 border-t border-[var(--rule2)]/30">
                <p className="text-[10px] font-mono font-bold text-[var(--red)] uppercase tracking-[0.1em] mb-2">
                  Stochastic Failure Failure Case
                </p>
                <p className="text-sm text-[var(--navy3)] leading-relaxed opacity-80">
                  {item.failure}
                </p>
              </div>
              
              <div className="pt-4 border-t border-[var(--rule2)]/30">
                <p className="text-[10px] font-mono font-bold text-[var(--green)] uppercase tracking-[0.1em] mb-2">
                  Deterministic Intervention
                </p>
                <p className="text-sm text-[var(--ink2)] font-medium leading-relaxed">
                  {item.intervention}
                </p>
              </div>
            </div>
            
            <div className="mt-auto pt-6 border-t border-[var(--rule)]/60 flex justify-between items-center">
              <span className="text-[10px] font-mono font-bold text-[var(--muted)] uppercase tracking-wider">
                Deployment Protocol
              </span>
              <span className="text-[11px] font-mono font-bold text-[var(--ink)] uppercase tracking-widest bg-[var(--parch2)] px-2 py-1 rounded">
                Exposure: {item.level}
              </span>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

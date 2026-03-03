import React from 'react';
import { SectionWrapper } from './SectionWrapper';
import { marketingData } from '@/lib/marketing/marketingData';

export function DeploymentArchitecture() {
  const { deployment } = marketingData;
  return (
    <SectionWrapper
      id="deployment-architecture"
      eyebrow={deployment.eyebrow}
      title={deployment.title}
      description={deployment.description}
      className="bg-[var(--parch)] dark:bg-[var(--navy)]"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {deployment.options.map((option, index) => (
          <div 
            key={index}
            className="group p-8 bg-[var(--bg-primary)] border border-[var(--rule)] rounded-lg hover:bg-[var(--parch2)] dark:hover:bg-[var(--navy2)] transition-all duration-300 hover:shadow-xl hover:-translate-y-[2px]"
          >
            <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">
              {option.label}
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-6 leading-relaxed">
              {option.description}
            </p>
            <ul className="space-y-3">
              {option.benefits.map((benefit, bIndex) => (
                <li key={bIndex} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" />
                  <span className="text-[11px] font-mono font-medium text-[var(--text-secondary)] uppercase tracking-tight">
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

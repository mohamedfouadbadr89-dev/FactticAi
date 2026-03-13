import React from 'react';
import { SectionWrapper } from './SectionWrapper';
import { marketingData } from '@/lib/marketing/marketingData';

export function LifecycleTimeline() {
  const { timeline } = marketingData;
  return (
    <SectionWrapper
      id="governance-lifecycle"
      title={timeline.title}
      className="bg-[var(--navy)] text-white relative overflow-hidden"
      headerClassName="text-center mx-auto"
    >
      {/* Subtle Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(var(--gold)_0.5px,transparent_0.5px)] bg-[length:24px_24px]" />
      
      <div className="relative">
        {/* Horizontal Connector Line (Desktop) */}
        <div className="hidden lg:block absolute top-[45px] left-0 right-0 h-[1px] bg-[var(--gold)] opacity-30" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 relative z-10">
          {timeline.phases.map((phase) => (
            <div key={phase.id} className="group space-y-4">
              <div className="relative">
                <div className="text-4xl font-serif font-bold text-[var(--gold)] mb-4 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
                  {phase.id.toString().padStart(2, '0')}
                </div>
                {/* Connector Dot (Desktop) */}
                <div className="hidden lg:block absolute top-[43px] left-0 w-1.5 h-1.5 rounded-full bg-[var(--gold)] border border-[var(--navy)]" />
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-white leading-tight">
                {phase.title}
              </h3>
              <p className="text-xs text-white/60 font-medium leading-relaxed">
                {phase.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}

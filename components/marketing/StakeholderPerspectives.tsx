"use client";

import React from 'react';
import { marketingData } from '@/lib/marketing/marketingData';
import { motion } from 'framer-motion';

export function StakeholderPerspectives() {
  const { modes } = marketingData;
  const executive = modes.items.find(m => m.id === 'executive');
  const advanced = modes.items.find(m => m.id === 'advanced');

  if (!executive || !advanced) return null;

  return (
    <section id="perspectives" className="min-h-[800px] flex flex-col lg:flex-row border-t border-[var(--border-primary)]/40 overflow-hidden">
      {/* Left Panel: Executive (Dark Navy) */}
      <div className="flex-1 bg-[var(--navy)] text-white p-12 md:p-24 relative overflow-hidden group">
        {/* Background Accents */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[var(--gold)]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative z-10 h-full flex flex-col max-w-xl mx-auto lg:mx-0 lg:ml-auto"
        >
          <div className="space-y-6 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--gold)]">{executive.label}</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-serif font-medium leading-[1.1] tracking-tight">
              {executive.title}
            </h2>
            
            <div className="space-y-3">
              <p className="text-[10px] font-mono font-black text-white/40 uppercase tracking-[0.3em]">Primary Stakeholders</p>
              <p className="text-xl font-medium text-white/80">{executive.audience}</p>
            </div>

            <p className="text-lg text-white/60 leading-relaxed font-medium">
              {executive.description}
            </p>

            <div className="pt-12 space-y-8">
              <div className="h-px bg-white/10 w-full" />
              <div className="grid grid-cols-1 gap-6">
                {executive.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-4 group/item">
                    <div className="w-2 h-2 rounded-full border border-[var(--gold)] group-hover/item:bg-[var(--gold)] transition-colors" />
                    <span className="text-sm font-bold tracking-tight text-white/90">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-12 mt-auto">
             <div className="text-[10px] font-mono font-black text-white/30 uppercase tracking-[0.4em]">Strategic Control Plane</div>
          </div>
        </motion.div>
      </div>

      {/* Right Panel: Advanced (Parchment) */}
      <div className="flex-1 bg-[#F5F2ED] text-[var(--navy)] p-12 md:p-24 relative overflow-hidden group border-l border-[var(--navy)]/5">
        {/* Background Accents (Grid) */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(var(--navy)_0.5px,transparent_0.5px)] bg-[length:24px_24px]" />
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative z-10 h-full flex flex-col max-w-xl mx-auto lg:mx-0"
        >
          <div className="space-y-6 flex-1">
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--navy)]/5 border border-[var(--navy)]/10 rounded-full">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--navy)]/60">{advanced.label}</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-serif font-medium leading-[1.1] tracking-tight">
              {advanced.title}
            </h2>

            <div className="space-y-3">
              <p className="text-[10px] font-mono font-black text-[var(--navy)]/30 uppercase tracking-[0.3em]">Primary Stakeholders</p>
              <p className="text-xl font-medium text-[var(--navy)]/80">{advanced.audience}</p>
            </div>

            <p className="text-lg text-[var(--navy)]/60 leading-relaxed font-medium">
              {advanced.description}
            </p>

            <div className="pt-12 space-y-8">
              <div className="h-px bg-[var(--navy)]/10 w-full" />
              <div className="grid grid-cols-1 gap-6">
                {advanced.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-4 group/item">
                    <div className="w-2 h-2 border border-[var(--navy)] group-hover/item:bg-[var(--navy)] transition-colors" />
                    <span className="text-sm font-bold tracking-tight text-[var(--navy)]/90">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-12 mt-auto">
             <div className="text-[10px] font-mono font-black text-[var(--navy)]/30 uppercase tracking-[0.4em]">System Protocol Access</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

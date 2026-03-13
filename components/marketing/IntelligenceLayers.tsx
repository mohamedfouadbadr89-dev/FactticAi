"use client";

import React from 'react';
import { SectionWrapper } from './SectionWrapper';
import { marketingData } from '@/lib/marketing/marketingData';
import { motion } from 'framer-motion';

export function IntelligenceLayers({ showDivider }: { showDivider?: boolean }) {
  const { intelligenceLayers: layers } = marketingData;

  return (
    <SectionWrapper
      id="intelligence-layers"
      eyebrow={layers.eyebrow}
      title={layers.title}
      description={layers.description}
      showDivider={showDivider}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-12">
        {layers.items.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.05, duration: 0.4 }}
            className="flex flex-col bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-[2px] group"
          >
            {/* Layer-coded top border */}
            <div 
              className="h-1 w-full" 
              style={{ backgroundColor: item.color }} 
            />
            
            <div className="p-8 space-y-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono font-black text-[var(--text-muted)] opacity-40">
                  LAYER_{item.id}
                </span>
                <div className="px-2 py-0.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-[8px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-tighter">
                  {item.count} MODULES
                </div>
              </div>

              <h3 className="text-xl font-serif font-bold text-[var(--text-primary)] leading-tight">
                {item.name}
              </h3>

              <div className="space-y-4 flex-1">
                <div className="h-px bg-[var(--border-primary)] w-full opacity-60" />
                <ul className="space-y-3">
                  {item.modules.map((module, mIdx) => (
                    <li key={mIdx} className="flex items-start gap-2.5">
                      <div className="w-1 h-1 rounded-full bg-[var(--text-muted)] mt-1.5 opacity-30" />
                      <span className="text-[12px] font-medium text-[var(--text-secondary)] leading-snug">
                        {module}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 mt-auto">
                <div className="text-[9px] font-mono font-bold text-[var(--gold)] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Active Optimization Protocol
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}

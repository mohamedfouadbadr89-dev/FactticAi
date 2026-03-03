import React from 'react';
import { marketingData } from '@/lib/marketing/marketingData';

export function MarketSignals() {
  const { signals } = marketingData;
  return (
    <div className="bg-[var(--navy2)] py-12 md:py-16 lg:py-24 border-y border-[var(--rule)]/10">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {signals.items.map((signal, index) => (
            <div key={index} className="space-y-3 group">
              <div className="text-[10px] font-mono font-bold text-[var(--gold2)] uppercase tracking-[0.25em] mb-1">
                {signal.label}
              </div>
              <p className="text-sm text-white/50 leading-relaxed font-medium group-hover:text-white/80 transition-colors">
                {signal.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

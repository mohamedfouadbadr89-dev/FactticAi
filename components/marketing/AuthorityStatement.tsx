import React from 'react';
import { marketingData } from '@/lib/marketing/marketingData';

export function AuthorityStatement() {
  const { authority } = marketingData;
  return (
    <div className="bg-[var(--navy)] py-12 md:py-16 lg:py-24 relative text-center">
      <div className="max-w-4xl mx-auto px-8 relative z-10">
         {/* Gold Rule */}
         <div className="w-16 h-[1px] bg-[var(--gold)] mx-auto mb-12 opacity-60" />
         
         <blockquote className="text-3xl md:text-5xl font-serif font-medium text-white leading-tight tracking-tight mb-16 italic">
           "{authority.quote}"
         </blockquote>
         
         <div className="text-[12px] font-mono font-bold text-[var(--muted)] uppercase tracking-[0.4em] mt-8">
            {authority.citation}
         </div>
      </div>
    </div>
  );
}

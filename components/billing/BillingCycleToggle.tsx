"use client";

import React from 'react';

interface BillingCycleToggleProps {
  value: 'monthly' | 'annual';
  onChange: (value: 'monthly' | 'annual') => void;
}

export default function BillingCycleToggle({ value, onChange }: BillingCycleToggleProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="inline-flex p-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl shadow-inner relative">
        <div 
          className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl transition-all duration-300 shadow-lg ${
            value === 'annual' ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'
          }`}
        />
        
        <button
          onClick={() => onChange('monthly')}
          className={`relative z-10 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
            value === 'monthly' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Monthly
        </button>
        
        <button
          onClick={() => onChange('annual')}
          className={`relative z-10 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
            value === 'annual' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Annually
        </button>
      </div>
      
      <div className={`flex items-center gap-2 transition-all duration-300 ${value === 'annual' ? 'opacity-100' : 'opacity-0 scale-95'}`}>
         <div className="px-3 py-1 bg-[var(--success)]/10 text-[var(--success)] text-[9px] font-black uppercase tracking-widest rounded-full border border-[var(--success)]/20 animate-pulse">
           2 Months Free
         </div>
         <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-tight">Save 20% with annual billing</span>
      </div>
    </div>
  );
}

'use client'

import React from'react'

interface Props {
 moduleName: string
 status: string
 activationMessage?: string
}

export function ComingSoonBlock({ moduleName, status, activationMessage }: Props) {
 return (
 <div className="relative group overflow-hidden bg-[var(--card-bg)] border border-[var(--border-primary)] p-8 rounded-[8px] flex flex-col justify-between min-h-[240px] transition-all hover:bg-[var(--bg-secondary)] shadow-sm">
 {/* Soft Decorative Flare */}
 <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none group-hover:bg-[var(--accent)]/10 transition-colors" />
 
 <div className="relative z-10">
 <div className="flex justify-between items-start mb-6">
 <div>
 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">{moduleName}</h3>
 <div className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full" />
 <span className="text-[10px] font-medium font-mono uppercase italic">{status}</span>
 </div>
 </div>
 
 <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] px-3 py-1 rounded text-[8px] font-black uppercase tracking-tighter text-[var(--accent)] transition-colors duration-300">
 Institutional Roadmap
 </div>
 </div>

 <div className="mt-8">
 <div className="text-lg font-bold tracking-tight leading-tight mb-2 max-w-[85%]">
 Architectural integration in progress.
 </div>
 <p className="text-xs font-medium leading-relaxed">
 {activationMessage ||"Connected to core infrastructure. Deployment pending."}
 </p>
 </div>
 </div>

 <div className="relative z-10 mt-6 flex gap-2 items-center">
 <div className="h-[3px] w-12 rounded-full overflow-hidden">
 <div className="h-full bg-[var(--accent)] w-1/4 transition-colors duration-300" />
 </div>
 <span className="text-[9px] font-bold uppercase tracking-widest">Phase 4 Activation Level</span>
 </div>
 </div>
 )
}

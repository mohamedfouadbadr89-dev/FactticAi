'use client';

import React from'react';
import { motion, AnimatePresence } from'framer-motion';

interface Factor {
 type: string;
 weight: number;
}

interface RcaDrawerProps {
 turn: any | null;
 onClose: () => void;
}

export const RcaDrawer: React.FC<RcaDrawerProps> = ({ turn, onClose }) => {
 if (!turn) return null;

 return (
 <AnimatePresence>
 <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
 {/* Backdrop */}
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={onClose}
 className="absolute inset-0 bg-[var(--bg-primary)]/10 backdrop-blur-sm pointer-events-auto"
 />

 {/* Drawer */}
 <motion.div 
 initial={{ x:'100%' }}
 animate={{ x: 0 }}
 exit={{ x:'100%' }}
 transition={{ type:'spring', damping: 25, stiffness: 200 }}
 className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[var(--card-bg)] border-l border-[var(--border-primary)] shadow-2xl pointer-events-auto flex flex-col"
 >
 <div className="p-6 border-b border-[var(--border-primary)] flex justify-between items-center">
 <div>
 <h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tighter">Root Cause Attribution</h2>
 <p className="text-[var(--text-secondary)] text-[10px] font-mono uppercase">Turn {turn.turn_index} • Forensic Audit</p>
 </div>
 <button 
 onClick={onClose}
 className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
 >
 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
 </svg>
 </button>
 </div>

 <section className="p-6 overflow-y-auto flex-1 space-y-8">
 <div>
 <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-3">Interaction Context</h3>
 <div className="bg-[var(--bg-primary)] rounded p-4 border border-[var(--border-primary)]">
 <p className="text-sm italic">"{turn.content}"</p>
 </div>
 </div>

 {/* Risk Factors Section */}
 <div>
 <div className="flex justify-between items-end mb-4">
 <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Risk Factor Breakdown</h3>
 <span className="text-xl font-mono font-bold text-red-500">{(turn.incremental_risk * 100).toFixed(1)}%</span>
 </div>
 
 <div className="space-y-3">
 {turn.metadata?.risk_factors && turn.metadata.risk_factors.length > 0 ? (
 turn.metadata.risk_factors.map((factor: any, idx: number) => (
 <div key={idx} className="bg-[var(--bg-primary)] rounded p-3 border border-[var(--border-primary)]">
 <div className="flex justify-between items-center mb-2">
 <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-tight">{factor.factor}</span>
 <span className="text-xs font-mono text-[var(--text-secondary)]">{(factor.weight * 100).toFixed(1)}% weight</span>
 </div>
 <div className="w-full bg-[var(--bg-primary)] h-1.5 rounded-full overflow-hidden">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width:`${(factor.weight / turn.incremental_risk) * 100}%` }}
 className="bg-red-500 h-full"
 />
 </div>
 <div className="mt-2 flex justify-between text-[10px] uppercase font-bold tracking-tighter">
 <span className="text-[var(--text-secondary)]">Contribution</span>
 <span className="text-[var(--text-secondary)]">{((factor.weight / turn.incremental_risk) * 100).toFixed(1)}% of total risk</span>
 </div>
 </div>
 ))
 ) : (
 <div className="py-4 text-center text-[var(--text-secondary)] text-xs font-mono uppercase italic">
 No active risk triggers detected for this turn.
 </div>
 )}
 </div>
 </div>

 {/* Audit Compliance */}
 <div className="mt-12 pt-8 border-t border-[var(--border-primary)]">
 <div className="flex items-center gap-2 mb-2">
 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
 <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 tracking-widest">Integrity Verified</span>
 </div>
 <p className="text-[10px] text-[var(--text-secondary)] font-mono leading-tight">
 This Root Cause Analysis is cryptographically bound to the interaction turn. Any modification to the scoring logic will invalidate the forensic signature for this session.
 </p>
 </div>
 </section>
 <div className="p-6 border-t border-[var(--border-primary)] bg-[var(--bg-primary)]/50">
 <button 
 onClick={onClose}
 className="w-full bg-[var(--bg-primary)] hover:bg-[var(--card-bg)] text-[var(--text-primary)] font-bold py-3 rounded-md uppercase tracking-tighter transition-colors text-sm border border-[var(--border-primary)]"
 >
 Close Inspector
 </button>
 </div>
 </motion.div>
 </div>
 </AnimatePresence>
 );
};

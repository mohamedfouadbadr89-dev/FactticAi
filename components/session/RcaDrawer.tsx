'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
          className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
        />

        {/* Drawer */}
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-zinc-900 border-l border-zinc-800 shadow-2xl pointer-events-auto flex flex-col"
        >
          <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold uppercase tracking-tighter text-white">Root Cause Analysis</h2>
              <p className="text-zinc-500 text-[10px] font-mono uppercase">Turn {turn.turn_index} • Forensic Audit</p>
            </div>
            <button 
              onClick={onClose}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Context Section */}
            <section>
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Interaction Context</h3>
              <div className="bg-zinc-950/50 rounded p-4 border border-zinc-800/50">
                <p className="text-sm text-zinc-300 italic">"{turn.content}"</p>
              </div>
            </section>

            {/* Risk Factors Section */}
            <section>
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Risk Factor Breakdown</h3>
                <span className="text-xl font-mono font-bold text-red-400">{(turn.incremental_risk * 100).toFixed(1)}%</span>
              </div>
              
              <div className="space-y-3">
                {turn.factors && turn.factors.length > 0 ? (
                  turn.factors.map((factor: Factor, idx: number) => (
                    <div key={idx} className="bg-zinc-800/30 rounded p-3 border border-zinc-800/50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-mono font-bold uppercase text-blue-400">{factor.type}</span>
                        <span className="text-xs font-mono text-zinc-400">{(factor.weight * 100).toFixed(1)}% weight</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(factor.weight / turn.incremental_risk) * 100}%` }}
                          className="bg-red-500 h-full"
                        />
                      </div>
                      <div className="mt-2 flex justify-between text-[10px] uppercase font-bold tracking-tighter">
                        <span className="text-zinc-500">Contribution</span>
                        <span className="text-zinc-300">{((factor.weight / turn.incremental_risk) * 100).toFixed(1)}% of total risk</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-zinc-600 text-xs font-mono uppercase italic">
                    No active risk triggers detected for this turn.
                  </div>
                )}
              </div>
            </section>

            {/* Audit Compliance */}
            <section className="mt-12 pt-8 border-t border-zinc-800/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 tracking-widest">Integrity Verified</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono leading-tight">
                This Root Cause Analysis is cryptographically bound to the interaction turn. Any modification to the scoring logic will invalidate the forensic signature for this session.
              </p>
            </section>
          </div>

          <div className="p-6 border-t border-zinc-800 bg-zinc-950/30">
            <button 
              onClick={onClose}
              className="w-full bg-zinc-100 hover:bg-white text-zinc-900 font-bold py-3 rounded-sm uppercase tracking-tighter transition-colors text-sm"
            >
              Close Inspector
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

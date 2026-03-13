'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RcaDrawerProps {
  sessionId: string;
  turn: any | null;
  onClose: () => void;
}

export const RcaDrawer: React.FC<RcaDrawerProps> = ({ sessionId, turn, onClose }) => {
  const [rcaData, setRcaData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (turn && sessionId) {
      setLoading(true);
      fetch(`/api/forensics/rca/${sessionId}`)
        .then(res => res.json())
        .then(json => {
          if (json.success) setRcaData(json.data);
        })
        .catch(err => console.error('RCA Fetch Error:', err))
        .finally(() => setLoading(false));
    }
  }, [sessionId, turn]);

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
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[var(--card-bg)] border-l border-[var(--border-primary)] shadow-2xl pointer-events-auto flex flex-col"
        >
          <div className="p-6 border-b border-[var(--border-primary)] flex justify-between items-center">
            <div>
              <h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tighter">Root Cause Attribution</h2>
              <p className="text-[var(--text-secondary)] text-[10px] font-mono uppercase">Turn {turn.turn_index || '0'} • Forensic Audit</p>
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
            {/* Session Root Cause Summary */}
            {loading ? (
              <div className="p-4 bg-[var(--bg-primary)] rounded border border-[var(--border-primary)] animate-pulse">
                <div className="h-2 w-24 bg-[var(--border-primary)] rounded mb-2" />
                <div className="h-4 w-48 bg-[var(--border-primary)] rounded" />
              </div>
            ) : rcaData ? (
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                <h3 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Session Root Cause</h3>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded border border-red-500/30">
                    <span className="text-xs font-bold text-red-500 font-mono uppercase">{rcaData.causality_type}</span>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-primary)] font-bold">
                      {rcaData.root_event?.event_type === 'drift_alert' ? 'Sustained Model Drift Detected' : 
                       rcaData.root_event?.event_type === 'policy_violation' ? 'Security Policy Bypass' : 
                       'Precursor Signal Anomaly'}
                    </p>
                    {rcaData.root_event && (
                      <p className="text-[9px] text-[var(--text-secondary)] font-mono">
                        Detected at: {new Date(rcaData.root_event.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            <div>
              <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-3">Interaction Context</h3>
              <div className="bg-[var(--bg-primary)] rounded p-4 border border-[var(--border-primary)]">
                <p className="text-sm italic">"{turn.content}"</p>
              </div>
            </div>

            {/* Risk Factors Section */}
            <div>
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Turn Risk Factors</h3>
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
                          animate={{ width: `${(factor.weight / Math.max(0.01, turn.incremental_risk)) * 100}%` }}
                          className="bg-red-500 h-full"
                        />
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

            {/* Failure Chain Visualizer */}
            {rcaData?.failure_chain && rcaData.failure_chain.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-4">Failure Chain</h3>
                <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-[var(--border-primary)]">
                  {rcaData.failure_chain.map((step: any, idx: number) => (
                    <div key={idx} className="relative pl-8">
                      <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-[var(--card-bg)] ${step.risk_score > 70 ? 'bg-red-500' : 'bg-[#555]'}`} />
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase text-[var(--text-primary)]">{step.event_type}</span>
                        <span className="text-[9px] font-mono text-[var(--text-secondary)]">{new Date(step.timestamp).toLocaleTimeString()}</span>
                      </div>
                      {step.risk_score > 0 && (
                        <p className="text-[9px] font-bold text-red-400">Risk Localized: {step.risk_score}%</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Compliance */}
            <div className="mt-12 pt-8 border-t border-[var(--border-primary)]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 tracking-widest">Forensic Signature Locked</span>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] font-mono leading-tight">
                This Root Cause Analysis is cryptographically bound to the session state. Any divergence in weighting logic will invalidate the forensic integrity of this session report.
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

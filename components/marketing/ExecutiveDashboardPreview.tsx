"use client";

import React from 'react';
import { SectionWrapper } from './SectionWrapper';
import { marketingData } from '@/lib/marketing/marketingData';
import { motion } from 'framer-motion';

const CountUp = ({ value, duration = 2 }: { value: number; duration?: number }) => {
  const [displayValue, setDisplayValue] = React.useState(0);
  
  React.useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;
    
    let totalMiliseconds = duration * 1000;
    let incrementTime = (totalMiliseconds / end);
    
    let timer = setInterval(() => {
      start += 1;
      setDisplayValue(prev => {
        if (start >= end) {
          clearInterval(timer);
          return end;
        }
        return start;
      });
    }, incrementTime);
    
    return () => clearInterval(timer);
  }, [value, duration]);
  
  return <>{displayValue}</>;
};

export function ExecutiveDashboardPreview() {
  const { executiveDashboard: data } = marketingData;

  return (
    <SectionWrapper id="oversight" className="bg-[var(--navy)] text-white overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-16 py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pb-12 border-b border-white/10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-white/60">Institutional Oversight</span>
            </div>
            <h2 className="text-4xl font-serif font-medium">{data.orgName}</h2>
          </div>
          
          <div className="text-right space-y-1">
            <p className="text-[10px] font-mono font-black text-white/40 uppercase tracking-widest">Global Audit Signature</p>
            <p className="text-xs font-mono font-bold text-[var(--gold)]">{data.auditHash}</p>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Health & Metrics */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-10 relative overflow-hidden group">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--gold)]/5 blur-[100px] pointer-events-none" />
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 relative z-10">
                <div className="space-y-2">
                  <p className="text-[11px] font-mono font-black text-white/40 uppercase tracking-[0.3em]">Governance Health Index</p>
                  <div className="text-[120px] font-serif font-bold tracking-tighter leading-none text-white flex items-baseline gap-2">
                    <CountUp value={Math.floor(data.healthScore)} />
                    <span className="text-4xl text-white/20">.{(data.healthScore % 1 * 10).toFixed(0)}</span>
                  </div>
                </div>

                <div className="flex-1 max-w-sm space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-mono font-bold uppercase tracking-widest">
                      <span className="text-white/40">Compliance Velocity</span>
                      <span className="text-[var(--gold)]">Optimal</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: '94%' }}
                        className="h-full bg-[var(--gold)]"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed italic">
                    "Platform integrity verified across all sovereign nodes. No critical drift detected in high-severity enclaves."
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Active Sessions', value: data.sessionCount, sub: 'Live' },
                { label: 'Voice Streams', value: data.voiceCalls, sub: 'Biometric' },
                { label: 'Drift Frequency', value: `${data.driftFrequency}%`, sub: 'Deterministic' },
                { label: 'RCA Confidence', value: `${data.rcaConfidence}%`, sub: 'Attributed' }
              ].map((m, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-1 hover:border-white/20 transition-colors">
                  <p className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest">{m.label}</p>
                  <p className="text-2xl font-bold text-white">{m.value}</p>
                  <p className="text-[8px] font-mono font-bold text-[var(--gold)] uppercase tracking-tighter">{m.sub}</p>
                </div>
              ))}
            </div>
            
            {/* Drift Trend Chart Preview (Simplified SVG) */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-mono font-black text-white/40 uppercase tracking-[0.25em]">Drift Trend Projections</p>
                <span className="text-[9px] font-mono font-bold text-[var(--gold)]">7-Day Analysis</span>
              </div>
              <div className="h-32 w-full flex items-end gap-2">
                {data.driftTrend.map((v, i) => (
                  <motion.div 
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${v * 20}px` }}
                    className="flex-1 bg-white/10 border-t border-white/20 hover:bg-[var(--gold)]/40 transition-colors relative group/bar"
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-mono font-bold opacity-0 group-hover/bar:opacity-100 transition-opacity">
                      {v}%
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Alerts & Status */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[var(--navy2)] border border-white/10 rounded-xl p-8 flex flex-col h-full">
              <div className="space-y-1 mb-8">
                <p className="text-[10px] font-mono font-black text-white/40 uppercase tracking-[0.2em]">Active Policy Violations</p>
                <div className="h-px bg-white/10 w-full" />
              </div>

              <div className="space-y-4 flex-1">
                {data.alerts.map((alert) => (
                  <div key={alert.id} className="p-4 bg-white/5 border border-white/10 rounded-lg group/alert hover:border-white/20 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[9px] font-mono font-bold text-white/40">{alert.id}</span>
                      <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        alert.severity === 'High' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-white leading-tight">
                      {alert.title}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
                    <span className="text-[9px] font-mono font-black text-white/40 uppercase tracking-widest">Audit Status</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-[var(--gold)] uppercase">{data.ledgerStatus}</span>
                </div>
                
                <div className="text-[9px] font-mono text-white/30 leading-relaxed uppercase tracking-tighter">
                  Every interaction is hashed and committed to the sovereign audit ledger. SHA-256 integrity check active.
                </div>
              </div>
            </div>
            
            {/* Tamper Proof Badge */}
            <div className="bg-[var(--gold)] text-[var(--navy)] p-6 rounded-xl flex flex-col items-center justify-center text-center space-y-2 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
               <div className="w-8 h-8 rounded-full bg-[var(--navy)]/10 flex items-center justify-center mb-1">
                 <div className="w-2 h-2 bg-[var(--navy)] rounded-full" />
               </div>
               <p className="text-[10px] font-mono font-black uppercase tracking-[0.3em]">Tamper-Proof Ledger</p>
               <p className="text-[8px] font-bold opacity-60 uppercase">Protocol Sealed v1.0</p>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}

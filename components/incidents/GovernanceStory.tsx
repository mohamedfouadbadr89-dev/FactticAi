"use client";

import React from 'react';
import { BookOpen, ShieldCheck, Zap, AlertCircle, Terminal } from 'lucide-react';
import type { IncidentThread } from '@/lib/forensics/incidentService';
import { generateGovernanceStory } from '@/lib/forensics/governanceStory';

interface Props {
  incident: IncidentThread;
}

export default function GovernanceStory({ incident }: Props) {
  const story = generateGovernanceStory(incident.events);
  const peakRisk = Math.max(...incident.events.map(e => e.risk_score));
  const modelUsed = incident.events[0]?.model || 'Unknown';
  
  const systemsTriggered = [
    { name: 'Gateway Kernel', active: true, icon: Zap },
    { name: 'Policy Engine', active: incident.events.some(e => e.decision === 'BLOCK' || e.decision === 'WARN'), icon: ShieldCheck },
    { name: 'Guardrail Engine', active: incident.events.some(e => e.risk_score > 50), icon: AlertCircle },
    { name: 'Persistence Ledger', active: true, icon: Terminal },
  ];

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/20">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        
        {/* Story Section */}
        <div className="lg:col-span-8 p-12 space-y-8">
          <div className="flex items-center gap-3 text-[var(--accent)]">
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Explanatory Forensics</span>
          </div>
          
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-[var(--text-primary)] leading-tight">
            Governance Narrative
          </h2>
          
          <div className="p-8 bg-[var(--bg-primary)] rounded-3xl border border-[var(--border-primary)] relative">
            <div className="absolute top-0 left-0 p-4 opacity-5">
              <BookOpen className="w-32 h-32" />
            </div>
            <p className="text-lg font-medium leading-relaxed text-[var(--text-primary)] relative z-10">
              "{story}"
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <div className="px-6 py-3 bg-[var(--bg-primary)]/50 rounded-2xl border border-[var(--border-primary)]">
              <p className="text-[9px] font-black uppercase text-[var(--text-secondary)] opacity-60 mb-1">Peak Risk Score</p>
              <p className={`text-xl font-black font-mono ${peakRisk > 75 ? 'text-[var(--danger)]' : peakRisk > 50 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
                {peakRisk}
              </p>
            </div>
            <div className="px-6 py-3 bg-[var(--bg-primary)]/50 rounded-2xl border border-[var(--border-primary)] text-right">
              <p className="text-[9px] font-black uppercase text-[var(--text-secondary)] opacity-60 mb-1">Intelligence Target</p>
              <p className="text-sm font-black uppercase tracking-tight text-[var(--text-primary)]">
                {modelUsed}
              </p>
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div className="lg:col-span-4 bg-[var(--bg-primary)]/40 p-12 border-l border-[var(--border-primary)] space-y-8">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] mb-6">Triggered Systems</h3>
            <div className="space-y-4">
              {systemsTriggered.map((sys) => (
                <div key={sys.name} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${sys.active ? 'bg-[var(--accent)]/5 border-[var(--accent)]/20' : 'bg-transparent border-[var(--border-primary)] opacity-30'}`}>
                  <div className={`p-2 rounded-lg ${sys.active ? 'bg-[var(--accent)] text-white shadow-[0_0_12px_rgba(var(--accent-rgb),0.3)]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>
                    <sys.icon className="w-4 h-4" />
                  </div>
                  <span className={`text-xs font-bold ${sys.active ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                    {sys.name}
                  </span>
                  {sys.active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-[var(--border-primary)]">
            <div className="p-6 bg-black/20 rounded-2xl border border-white/5 space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Verification Hash</p>
              <p className="text-[10px] font-mono text-white/60 break-all leading-tight">
                {incident.session_id}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

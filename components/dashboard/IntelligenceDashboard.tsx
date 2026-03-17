"use client";

import React, { useState } from "react";
import { CountUp } from "@/components/ui/CountUp";
import { logger } from "@/lib/logger";

interface IntelligenceData {
  pii_exposed_today: number;
  compliance_drift_score: number;
  recent_violations: { id: string; type: string; timestamp: string; }[];
  pii_trend: number[];
}

interface Props {
  data?: IntelligenceData | undefined;
}

export default function IntelligenceDashboard({ data }: Props) {
  const d = data;

  if (!d) return (
    <div className="card h-full animate-fadeIn min-h-[300px] flex flex-col items-center justify-center border-dashed border-[#222]">
       <span className="text-[10px] uppercase font-black tracking-widest text-[var(--text-secondary)]">No advanced intelligence data available</span>
    </div>
  );

  const isCritical = d.compliance_drift_score > 0.5;

  return (
    <div className="card h-full animate-fadeIn">
      <div className="card-header flex items-center justify-between border-b border-[var(--border-primary)]">
        <div>
          <h3 className="card-title select-none">Advanced Intelligence</h3>
          <p className="card-subtitle">Real-time Privacy & Compliance Monitoring</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="btn-secondary text-xs px-3 py-1">Generate Audit Report</button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* PII Exposure Section */}
        <div className="space-y-6">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-secondary)]">PII Exposure Today</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tighter text-[var(--danger)]">
                   <CountUp value={d.pii_exposed_today} />
                </span>
                <span className="text-[10px] font-black text-[var(--text-secondary)] opacity-60">MATCHES REDACTED</span>
              </div>
            </div>
            {/* Sparkline for PII */}
            <div className="flex items-end gap-[2px] h-12 w-32 pb-1">
              {d.pii_trend.map((val, i) => (
                <div 
                  key={i}
                  className="flex-1 bg-[var(--danger)]/30 rounded-t-[1px] hover:bg-[var(--danger)] transition-all"
                  style={{ height: `${(val / Math.max(...d.pii_trend)) * 100}%` }}
                />
              ))}
            </div>
          </div>

          <div className="p-4 bg-[var(--danger-bg)] rounded-xl border border-[var(--danger)]/20">
             <p className="text-[10px] font-black uppercase text-[var(--danger)] mb-2">Critical Privacy Incidents</p>
             <div className="space-y-2">
                {d.recent_violations.slice(0, 3).map(v => (
                  <div key={v.id} className="flex items-center justify-between text-xs font-medium">
                    <span className="text-[var(--text-primary)]">{v.type}</span>
                    <span className="text-[var(--text-secondary)] opacity-60">{v.timestamp}</span>
                  </div>
                ))}
                {d.recent_violations.length > 3 && (
                  <a href="/dashboard/alerts" className="block text-[10px] font-black uppercase tracking-widest text-[var(--danger)] opacity-70 hover:opacity-100 pt-1">
                    +{d.recent_violations.length - 3} more →
                  </a>
                )}
             </div>
          </div>
        </div>

        {/* Compliance Section */}
        <div className="space-y-6 border-l border-[var(--border-primary)] pl-8">
           <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-secondary)]">Compliance Drift Score</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold tracking-tighter ${isCritical ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
                   <CountUp value={Math.round(d.compliance_drift_score * 100)} suffix="%" />
                </span>
                <span className="text-[10px] font-black text-[var(--text-secondary)] opacity-60">THRESHOLD: 0.15%</span>
              </div>
            </div>

            <div className="space-y-4">
               <div>
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2">
                    <span>Policy Adherence</span>
                    <span className="text-[var(--success)]">98.2%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--success)] w-[98.2%] shadow-[0_0_8px_var(--success)]" />
                  </div>
               </div>
               <div>
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2">
                    <span>Entity Matching (Authorized)</span>
                    <span className="text-[var(--accent)]">94.5%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--accent)] w-[94.5%] shadow-[0_0_8px_var(--accent)]" />
                  </div>
               </div>
            </div>

            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/governance/reports/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      endDate: new Date().toISOString().split('T')[0],
                      metrics: ['risk_score', 'decision', 'violations', 'pii_exposure'],
                      format: 'csv',
                    }),
                  });
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `evidence_package_${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch (e) {
                  console.error('Export failed', e);
                }
              }}
              className="w-full py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-primary)] hover:bg-[var(--border-primary)] transition-all cursor-pointer"
            >
               Export Verified Evidence Package
            </button>
        </div>
      </div>
    </div>
  );
}

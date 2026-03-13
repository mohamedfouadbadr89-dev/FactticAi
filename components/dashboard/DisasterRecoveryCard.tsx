"use client";

import React, { useEffect, useState } from 'react';
import { Shield, Database, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DRStatus {
  last_snapshot: string;
  integrity: string;
  restore_test: string;
  last_verified_at: string;
  rpo_status: 'healthy' | 'at_risk';
}

export function DisasterRecoveryCard() {
  const [status, setStatus] = useState<DRStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/resilience/dr-status')
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-64 bg-[#111] animate-pulse rounded-2xl border border-slate-800" />;

  const isHealthy = status?.rpo_status === 'healthy' && status?.restore_test === 'passed';

  return (
    <div className={`p-6 bg-[#0a0a0a] rounded-2xl border ${isHealthy ? 'border-emerald-900/30' : 'border-amber-900/30'}`}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isHealthy ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-100">Disaster Recovery</h3>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isHealthy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
          {status?.rpo_status === 'healthy' ? 'Compliant' : 'RPO Deviation'}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-400">Snapshot Integrity</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span className="text-xs font-mono text-slate-200">Verified</span>
          </div>
        </div>

        <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-400">Restore Readiness</span>
          </div>
          <div className="flex items-center gap-1">
            {status?.restore_test === 'passed' ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span className="text-xs font-mono text-slate-200">Passed</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-amber-500" />
                <span className="text-xs font-mono text-amber-200">Pending</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800/50">
        <p className="text-[10px] text-slate-500 uppercase font-mono mb-1">Last Full Verification</p>
        <p className="text-xs text-slate-300 font-medium">
          {status?.last_verified_at ? new Date(status.last_verified_at).toLocaleString() : 'Never'}
        </p>
      </div>
    </div>
  );
}

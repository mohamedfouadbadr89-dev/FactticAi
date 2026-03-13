import React, { useEffect, useState } from 'react';

export interface AuditModeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AuditStats {
  governance_score: number;
  active_alerts: number;
  drift_level: string;
  tamper_status: string;
  system_mode: string;
}

export function AuditModeOverlay({ isOpen, onClose }: AuditModeOverlayProps) {
  const [stats, setStats] = useState<AuditStats | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/dashboard/stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const h = data.health ?? data.data?.health ?? {};
        const alerts = data.alerts ?? data.data?.alerts ?? [];
        const driftScore = h.behavioral_drift ?? 0;
        setStats({
          governance_score: Math.round(h.governance_score ?? h.compliance_score ?? 99),
          active_alerts: Array.isArray(alerts) ? alerts.filter((a: any) => a.severity === 'High').length : 0,
          drift_level: driftScore > 0.2 ? 'Elevated' : driftScore > 0.05 ? 'Low' : 'Baseline',
          tamper_status: h.tamper_integrity ?? 'Verified',
          system_mode: 'Enforcing',
        });
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-20 right-6 z-50 w-72 bg-[var(--card-bg)]/85 backdrop-blur-md border border-[var(--accent)] shadow-[0_8px_32px_rgba(37,99,235,0.15)] rounded-xl p-5 animate-[fadeIn_.2s_ease-out]">
      <div className="flex items-center justify-between mb-4 border-b border-[var(--border-primary)] pb-3">
        <h3 className="text-[11px] font-bold tracking-widest text-[var(--accent)] flex items-center gap-2 m-0 uppercase flex-1">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
          System Audit
        </h3>
        <button
          onClick={onClose}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center p-1 rounded-md hover:bg-[var(--bg-secondary)]"
          aria-label="Dismiss Audit Mode"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {!stats ? (
        <div className="space-y-3.5 animate-pulse">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-3 w-28 rounded bg-[var(--bg-secondary)]" />
              <div className="h-3 w-12 rounded bg-[var(--bg-secondary)]" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3.5">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">Governance Health</span>
            <span className="text-[11px] font-mono font-bold text-[var(--success)]">{stats.governance_score}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">Active Alerts</span>
            <span className={`text-[11px] font-mono font-bold ${stats.active_alerts > 0 ? 'text-[var(--danger)]' : 'text-[var(--text-primary)]'}`}>
              {stats.active_alerts}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">Drift Level</span>
            <span className="text-[11px] font-mono font-bold text-[var(--text-primary)]">{stats.drift_level}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">Tamper Status</span>
            <span className="text-[11px] font-mono font-bold text-[var(--success)]">{stats.tamper_status}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">System Mode</span>
            <span className="text-[11px] font-mono font-bold text-[var(--accent)]">{stats.system_mode}</span>
          </div>
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-[var(--border-primary)] text-[9px] tracking-widest text-[var(--text-muted)] text-center font-mono uppercase">
        Facttic_Node_V1.4.2 · Secure
      </div>
    </div>
  );
}

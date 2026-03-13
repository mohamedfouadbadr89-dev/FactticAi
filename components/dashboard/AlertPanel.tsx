'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Alert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'critical';
  message: string;
  created_at: string;
}

export function AlertPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch('/api/alerts');
        const json = await res.json();
        if (json.success) setAlerts(json.data);
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 border-red-500/30 text-red-500';
      case 'medium': return 'bg-orange-500/10 border-orange-500/30 text-orange-500';
      default: return 'bg-blue-500/10 border-blue-500/30 text-blue-500';
    }
  };

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-primary)] rounded-lg flex flex-col h-[400px]">
      <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center bg-[var(--bg-primary)]/50">
        <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">Governance Alerts</h3>
        <span className="text-[10px] font-mono text-[var(--text-secondary)]">{alerts.length} active</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && alerts.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--text-secondary)] font-mono text-[10px] uppercase animate-pulse">
            Syncing Alert Stream...
          </div>
        ) : alerts.length > 0 ? (
          <AnimatePresence initial={false}>
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded border ${getSeverityStyles(alert.severity)} flex flex-col gap-1`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-tighter">{alert.alert_type}</span>
                  <span className="text-[9px] font-mono opacity-70">{new Date(alert.created_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-xs font-medium leading-tight">
                  {alert.message}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="flex items-center justify-center h-full text-[var(--text-secondary)] font-mono text-[10px] uppercase italic opacity-30 text-center">
            System State: Optimal<br/>No active anomalies detected
          </div>
        )}
      </div>

      <div className="p-3 border-t border-[var(--border-primary)] bg-[var(--bg-primary)]/30 text-center">
        <button className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          View Audit History →
        </button>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from 'react';
import { FileText, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function ReportBuilder() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [config, setConfig] = useState({
    metrics: ['policy_adherence', 'drift_pct', 'risk_score'],
    startDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    format: 'csv'
  });

  const toggleMetric = (metric: string) => {
    setConfig(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metric)
        ? prev.metrics.filter(m => m !== metric)
        : [...prev.metrics, metric]
    }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    
    try {
      const response = await fetch('/api/governance/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facttic_report_${config.startDate}_to_${config.endDate}.${config.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      setSuccess(true);
    } catch (err: any) {
      logger.error('REPORT_DOWNLOAD_FAILED', { error: err.message });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header border-b border-[var(--border-color)] pb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[var(--accent)]" />
          <h3 className="card-title text-xl">Report Builder</h3>
        </div>
        <p className="card-subtitle text-sm text-[var(--text-secondary)] mt-1">
          Configure and export deterministic governance intelligence.
        </p>
      </div>

      <div className="p-6 space-y-8">
        {/* Metrics Selection */}
        <div className="space-y-4">
          <label className="text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)]">Included Metrics</label>
          <div className="flex flex-wrap gap-3">
            {['policy_adherence', 'drift_pct', 'risk_score', 'severity_dist', 'audit_logs'].map(m => (
              <button
                key={m}
                onClick={() => toggleMetric(m)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  config.metrics.includes(m)
                    ? 'bg-[var(--accent)] text-white shadow-lg'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-[var(--accent)]'
                }`}
              >
                {m.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Time Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)]">Start Date</label>
            <input
              type="date"
              value={config.startDate}
              onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] p-2.5 rounded-lg text-sm font-mono outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)]">End Date</label>
            <input
              type="date"
              value={config.endDate}
              onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] p-2.5 rounded-lg text-sm font-mono outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {/* Format Selection */}
        <div className="space-y-4">
          <label className="text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)]">Output Format</label>
          <div className="flex gap-4">
            {['csv', 'html'].map(f => (
              <label key={f} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="format"
                  value={f}
                  checked={config.format === f}
                  onChange={(e) => setConfig({ ...config, format: e.target.value })}
                  className="w-4 h-4 accent-[var(--accent)]"
                />
                <span className="text-sm font-medium uppercase group-hover:text-[var(--accent)] transition-colors">{f}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Feedback Messages */}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-emerald-900/20 text-emerald-500 rounded-lg text-sm animate-[fadeIn_.3s]">
            <CheckCircle2 className="w-4 h-4" /> Report generated and downloaded successfully.
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-900/20 text-red-500 rounded-lg text-sm animate-[fadeIn_.3s]">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleGenerate}
          disabled={loading || config.metrics.length === 0}
          className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold uppercase tracking-widest transition-all ${
            loading || config.metrics.length === 0
              ? 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed opacity-50'
              : 'bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white shadow-xl hover:translate-y-[-2px]'
          }`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Generate Deterministic Report
            </>
          )}
        </button>
      </div>
    </div>
  );
}

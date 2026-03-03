"use client";

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Settings2, 
  Eye, 
  ChevronRight,
  FileDown,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { logger } from '@/lib/logger';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  title: string;
  content: string;
  children: React.ReactNode;
}

const Tooltip = ({ title, content, children }: TooltipProps) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute z-50 w-64 p-4 mt-3 text-xs bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] -left-1/2 translate-x-1/2 border border-white/10 ring-1 ring-white/20"
          >
            <div className="flex items-center gap-2 mb-2 text-[var(--accent)] font-bold uppercase tracking-widest text-[10px]">
              <Sparkles className="w-3 h-3" /> {title}
            </div>
            <p className="text-gray-300 leading-relaxed text-[11px]">{content}</p>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900/95" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function ReportBuilder() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  
  const [config, setConfig] = useState({
    metrics: ['policy_adherence', 'drift_pct', 'risk_score'],
    startDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    format: 'pdf'
  });

  const metricsInfo: Record<string, { title: string; desc: string }> = {
    policy_adherence: {
      title: "Adherence Index",
      desc: "Deterministic verification of model responses against established institutional safety policies."
    },
    drift_pct: {
      title: "Behavioral Drift",
      desc: "Mathematical delta between current output patterns and the frozen model signature."
    },
    risk_score: {
      title: "Risk Magnitude",
      desc: "Aggregate severity scoring based on multi-factor proximity analysis of individual interactions."
    },
    severity_dist: {
      title: "Severity Profile",
      desc: "Strategic distribution of risk across Critical, High, Medium, and Low levels for resource allocation."
    },
    audit_logs: {
      title: "Log Telemetry",
      desc: "Immutable record of all deterministic governance events for external regulatory verification."
    }
  };

  const toggleMetric = (metric: string) => {
    setConfig(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metric)
        ? prev.metrics.filter(m => m !== metric)
        : [...prev.metrics, metric]
    }));
  };

  const handleGenerate = async (formatOverride?: string) => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    
    const finalFormat = formatOverride || config.format;
    const endpoint = finalFormat === 'pdf' ? '/api/generatePDF' : '/api/generateReport';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, format: finalFormat })
      });

      if (!response.ok) throw new Error(`Generation failed: ${response.statusText}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facttic_governance_${config.startDate}_to_${config.endDate}.${finalFormat}`;
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
      {/* Configuration Column */}
      <div className="lg:col-span-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] border-white/5 overflow-hidden"
        >
          <div className="h-1 w-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-soft)]" />
          
          <div className="p-10 space-y-12">
            <header className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-[var(--accent-soft)] to-transparent rounded-xl text-[var(--accent)] shadow-lg shadow-[var(--accent)]/10">
                    <Settings2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter">INTELLIGENCE BUILDER</h3>
                </div>
                <p className="text-sm text-[var(--text-secondary)] font-medium max-w-md">Configure deterministic governance telemetry for board-level distribution.</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-black tracking-[0.2em] font-mono text-[var(--text-secondary)]">
                <span className={`px-4 py-1.5 rounded-full border transition-all ${step === 1 ? 'border-[var(--accent)] text-[var(--accent)] shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]' : 'border-white/5 bg-white/5'}`}>01 DIMENSIONS</span>
                <ChevronRight className="w-4 h-4 opacity-20" />
                <span className={`px-4 py-1.5 rounded-full border transition-all ${step === 2 ? 'border-[var(--accent)] text-[var(--accent)] shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]' : 'border-white/5 bg-white/5'}`}>02 HORIZON</span>
              </div>
            </header>

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div 
                  key="metrics"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  <label className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-[var(--text-secondary)] flex items-center gap-2">
                    <Layers className="w-3 h-3" /> Select Data Dimensions
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {Object.entries(metricsInfo).map(([m, info]) => (
                      <button
                        key={m}
                        onClick={() => toggleMetric(m)}
                        className={`group relative p-6 rounded-2xl border transition-all text-left overflow-hidden ${
                          config.metrics.includes(m)
                            ? 'bg-gradient-to-br from-[var(--accent-soft)] to-transparent border-[var(--accent)]/50 ring-2 ring-[var(--accent)]/10'
                            : 'bg-[var(--bg-primary)] border-white/5 hover:border-white/20 hover:bg-white/[0.02]'
                        }`}
                      >
                        {config.metrics.includes(m) && (
                          <motion.div 
                            layoutId="check"
                            className="absolute top-0 right-0 p-2 bg-[var(--accent)] text-white rounded-bl-xl shadow-lg"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </motion.div>
                        )}
                        <div className="flex justify-between items-center mb-3">
                          <span className={`text-[10px] font-mono font-black tracking-[0.2em] uppercase ${config.metrics.includes(m) ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}>
                            {m.replace('_', ' ')}
                          </span>
                          <Tooltip title={info.title} content={info.desc}>
                            <div className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-help">
                              <Info className="w-4 h-4 text-gray-500 group-hover:text-gray-300" />
                            </div>
                          </Tooltip>
                        </div>
                        <p className={`text-[11px] leading-relaxed line-clamp-2 ${config.metrics.includes(m) ? 'text-gray-200' : 'text-[var(--text-secondary)]'}`}>
                          {info.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setStep(2)}
                    className="w-full py-5 bg-[var(--bg-secondary)] hover:bg-gray-800 rounded-2xl transition-all font-black text-xs tracking-[0.3em] uppercase flex items-center justify-center gap-3 border border-white/5 active:scale-[0.98]"
                  >
                    Configure Time Horizon <ChevronRight className="w-4 h-4 text-[var(--accent)]" />
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="horizon"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-10"
                >
                  <label className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-[var(--text-secondary)] flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Set Temporal Horizon
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Start Bound</span>
                      <input
                        type="date"
                        value={config.startDate}
                        onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                        className="w-full bg-[var(--bg-primary)] border border-white/5 p-5 rounded-2xl text-sm font-mono text-gray-200 focus:border-[var(--accent)]/50 focus:ring-4 ring-[var(--accent)]/5 shadow-inner transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-4">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">End Bound</span>
                      <input
                        type="date"
                        value={config.endDate}
                        onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
                        className="w-full bg-[var(--bg-primary)] border border-white/5 p-5 rounded-2xl text-sm font-mono text-gray-200 focus:border-[var(--accent)]/50 focus:ring-4 ring-[var(--accent)]/5 shadow-inner transition-all outline-none"
                      />
                    </div>
                  </div>
                  <div className="pt-6">
                    <button 
                      onClick={() => setStep(1)}
                      className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] hover:text-white transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" /> Back to Dimensions
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Export Side-Panel */}
      <div className="lg:col-span-4 space-y-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card bg-gradient-to-b from-[var(--bg-secondary)]/80 to-[var(--bg-secondary)]/40 border-white/5 backdrop-blur-xl sticky top-10 shadow-2xl"
        >
          <div className="p-10 space-y-10">
            <header className="space-y-4">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-[var(--accent)]" />
                <h4 className="font-black text-xs tracking-[0.3em] uppercase text-white">Summary</h4>
              </div>
              <div className="p-6 bg-[var(--bg-primary)] rounded-2xl border border-white/5 space-y-4 shadow-inner">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Selected Planes</span>
                  <span className="text-xl font-black text-[var(--accent)] tracking-tighter">{config.metrics.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Temporal Density</span>
                  <span className="text-xs font-mono font-bold text-white uppercase">High-Fidelity</span>
                </div>
              </div>
            </header>

            <div className="space-y-4">
              <button
                onClick={() => handleGenerate('pdf')}
                disabled={loading || config.metrics.length === 0}
                className="w-full group relative py-5 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-[0.3em] text-[10px] transition-all active:scale-[0.98] shadow-[0_20px_40px_-15px_rgba(var(--accent-rgb),0.5)] disabled:opacity-30"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <FileDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" /> 
                    Download High-Fidelity PDF
                  </>
                )}
              </button>

              <button
                onClick={() => handleGenerate('csv')}
                disabled={loading || config.metrics.length === 0}
                className="w-full py-5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-[0.3em] text-[10px] transition-all active:scale-[0.98] disabled:opacity-30"
              >
                <Download className="w-4 h-4" /> Export Raw Telemetry (CSV)
              </button>
            </div>

            <div className="space-y-4">
              <AnimatePresence>
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-[10px] font-bold flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> INTEGRITY VERIFIED. EXPORT COMPLETE.
                  </motion.div>
                )}
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl text-[10px] font-bold flex items-center gap-3"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error.toUpperCase()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <footer className="pt-8 border-t border-white/5 text-center">
              <p className="text-[10px] text-gray-600 font-mono tracking-tighter leading-relaxed uppercase">
                * All governance artifacts are cryptographically hashed and logged to the public audit mesh.
              </p>
            </footer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

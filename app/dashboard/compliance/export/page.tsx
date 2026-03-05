'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileDown, 
  Database, 
  ShieldCheck, 
  History, 
  CheckCircle2, 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  FileText,
  Clock,
  ExternalLink
} from 'lucide-react';

export default function EvidenceExportPage() {
  const [exporting, setExporting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['ledger', 'risk']);
  const [format, setFormat] = useState('JSON');

  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleExport = () => {
    setExporting(true);
    // Simulated export delay
    setTimeout(() => {
      setExporting(false);
      setCompleted(true);
      setTimeout(() => setCompleted(false), 3000);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white p-10">
      {/* Header */}
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Compliance Evidence Service</span>
        </div>
        <h1 className="text-6xl font-black uppercase tracking-tighter italic mb-4">Evidence Vault</h1>
        <p className="text-slate-500 max-w-xl text-sm font-medium">
          Generate cryptographically signed audit bundles for SOC2, GDPR, and AI Governance reviews. 
          Deterministic extraction ensures absolute data integrity across all export formats.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Configuration Panel */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-[#0a0a0a] border border-white/5 p-10 rounded-[2.5rem]">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-8">1. Select Evidence Domains</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              {[
                { id: 'ledger', label: 'Governance Ledger', desc: 'Cryptographic chain of all policy events.' },
                { id: 'replay', label: 'Session Replay', desc: 'Deterministic reconstruction of chat interactions.' },
                { id: 'compliance', label: 'Compliance Signals', desc: 'PII detection and data leakage logs.' },
                { id: 'risk', label: 'Risk Evaluations', desc: 'Historical drift and hallucination risk scores.' }
              ].map(type => (
                <button 
                  key={type.id}
                  onClick={() => toggleType(type.id)}
                  className={`flex items-start text-left p-6 rounded-2xl border transition-all ${
                    selectedTypes.includes(type.id) 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-white/5 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className={`mt-1 mr-4 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedTypes.includes(type.id) ? 'border-emerald-500 bg-emerald-500' : 'border-white/20'
                  }`}>
                    {selectedTypes.includes(type.id) && <CheckCircle2 className="w-3 h-3 text-black" />}
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-tighter mb-1">{type.label}</p>
                    <p className="text-[9px] text-slate-500 font-medium">{type.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-8">2. Export Format</h3>
            <div className="flex gap-4 mb-12">
              {[
                { id: 'JSON', icon: FileJson },
                { id: 'CSV', icon: FileSpreadsheet },
                { id: 'PDF', icon: FileText }
              ].map(f => (
                <button 
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border transition-all ${
                    format === f.id 
                      ? 'bg-white text-black border-white' 
                      : 'bg-[#111] border-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <f.icon className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-widest">{f.id}</span>
                </button>
              ))}
            </div>

            <button 
              onClick={handleExport}
              disabled={exporting || selectedTypes.length === 0}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 transition-all ${
                exporting 
                  ? 'bg-slate-800 text-slate-500' 
                  : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_10px_30px_rgba(16,185,129,0.3)]'
              }`}
            >
              {exporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  Extracting Cryptographic Proofs...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  Generate Evidence Bundle
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status & History Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2rem] overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Database size={100} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <Clock className="w-3 h-3" /> Recent Activity
            </h3>
            
            <div className="space-y-4">
              {[
                { label: 'SOC2_Audit_v12.json', time: '2h ago', status: 'Verified' },
                { label: 'GDPR_Export_01.csv', time: '1d ago', status: 'Expired' },
                { label: 'Risk_Forensics_Package.pdf', time: '3d ago', status: 'Verified' }
              ].map((item, i) => (
                <div key={i} className="group flex items-center justify-between p-4 bg-white/5 border border-transparent hover:border-white/10 rounded-xl transition-all">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-tighter group-hover:text-emerald-400 transition-colors">{item.label}</p>
                    <p className="text-[9px] text-slate-600 font-mono mt-1">{item.time}</p>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-700 group-hover:text-slate-400" />
                </div>
              ))}
            </div>

            <button className="w-full mt-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
              <History className="w-3 h-3" /> View Archive
            </button>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-500/20 p-8 rounded-[2rem] italic">
            <h4 className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-4 italic">Security Assurance</h4>
            <p className="text-[10px] text-emerald-300/60 leading-relaxed font-medium">
              Every evidence bundle is hashed and salted with your organization's sovereign ID. 
              The resulting SHA-256 fingerprint is recorded in the immutable gateway ledger.
            </p>
          </div>
        </div>
      </div>

      {/* Completion Toast */}
      {completed && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 bg-emerald-500 text-black rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-[0_20px_50px_rgba(16,185,129,0.5)]"
        >
          <Download className="w-4 h-4" />
          Evidence Bundle Ready for Download
        </motion.div>
      )}
    </div>
  );
}

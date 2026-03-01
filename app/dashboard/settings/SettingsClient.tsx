'use client'

import React from'react'
import { ComingSoonBlock } from'@/components/layout/ComingSoonBlock'

export function SettingsClient() {
 // Thresholds based on PredictiveEngine weights and logic
 const thresholds = [
 { label:'Error Rate Bias', value:'10%', weight:'0.50' },
 { label:'Billing Velocity', value:'25%', weight:'0.30' },
 { label:'Agent Latency', value:'150ms', weight:'0.20' }
 ]

 return (
 <div className="w-full max-w-7xl mx-auto p-6 md:p-8 space-y-8">
 <div className="pb-6 border-b">
 <h1 className="text-3xl font-bold tracking-tight mb-2">System Parameters</h1>
 <p className="text-sm font-medium">Fine-tune deterministic thresholds and global telemetry bindings.</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div className="space-y-6">
 <div className="section-card p-8 transition-colors duration-300">
 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--ink-soft)] mb-6 border-l-2 border-[var(--navy)] px-3 transition-colors duration-300">Access Control</h3>
 <div className="space-y-6">
 <div>
 <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5">Institutional Key</label>
 <div className="relative">
 <input
 type="password"
 value="sk-facttic-institutional-v1-prod-key-hash"
 readOnly
 className="w-full border p-3 rounded-lg text-sm font-mono focus:outline-none"
 />
 <div className="absolute right-3 top-3 px-2 py-0.5 bg-white border rounded text-[8px] font-black uppercase tracking-widest">
 Encrypted
 </div>
 </div>
 </div>
 <button className="bg-[var(--navy)] text-[var(--white)] font-black uppercase tracking-widest text-[10px] px-6 py-3 rounded-lg hover:opacity-90 transition-colors shadow-lg">
 Rotate Credentials
 </button>
 </div>
 </div>

 <div className="section-card p-8 transition-colors duration-300">
 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--ink-soft)] mb-6 border-l-2 border-[var(--navy)] px-3 transition-colors duration-300">Telemetry Calibration</h3>
 <div className="space-y-4">
 {[
 { label:'Drift Sensitivity', val: 0.85 },
 { label:'Anomaly Gain', val: 0.42 },
 { label:'Latency Buffer', val: 0.12 }
 ].map((item) => (
 <div key={item.label}>
 <div className="flex justify-between items-center mb-1.5">
 <span className="text-[10px] font-black text-[var(--ink-soft)] uppercase tracking-widest">{item.label}</span>
 <span className="text-[10px] font-black text-[var(--navy)] font-mono transition-colors duration-300">{(item.val * 100).toFixed(0)}%</span>
 </div>
 <div className="h-2 w-full bg-[var(--parch-2)] rounded-full overflow-hidden border border-[var(--rule)] transition-colors duration-300">
 <div className="h-full bg-[var(--navy)] transition-colors duration-300" style={{ width:`${item.val * 100}%` }} />
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>

 <div className="space-y-6">
 <div className="section-card p-6">
 <ComingSoonBlock moduleName="Automated Compliance" status="Drafting" activationMessage="Q4 2026" />
 </div>
 
 <div className="border border-dashed rounded-[12px] p-8 text-center section-card shadow-none">
 <div className="text-xs font-bold uppercase tracking-[0.3em] mb-2">Institutional Audit Log</div>
 <p className="text-xs font-medium italic">Immutable system event persistence activated.</p>
 </div>
 </div>
 </div>
 </div>
 )
}

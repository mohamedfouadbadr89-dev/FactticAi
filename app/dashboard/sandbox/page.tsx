'use client';

import React, { useState, useEffect } from'react';
import'../styles.css';
import'./styles.css';
import { TelemetryIntegrityManager, type SignedKPIPayload } from'@/lib/telemetryIntegrity';

/**
 * Sandbox Surface (v1)
 * Interactive testing environment for Chat and Voice capabilities.
 * Enforces deterministic billing and telemetry validation.
 */

export default function SandboxPage() {
 const [mode, setMode] = useState<'chat' |'voice'>('chat');
 const [telemetry, setTelemetry] = useState<SignedKPIPayload | null>(null);
 const [isProcessing, setIsProcessing] = useState(false);
 const [logs, setLogs] = useState<string[]>(['[SYSTEM] Sandbox environment initialized. Ready for test interactions.']);

 useEffect(() => {
 async function fetchTelemetry() {
 try {
 const res = await fetch('/api/telemetry/signed');
 const payload = await res.json();
 if (TelemetryIntegrityManager.validatePayload(payload)) {
 setTelemetry(payload);
 }
 } catch (err) {
 setLogs(prev => [...prev,'[ERROR] Failed to fetch certified telemetry.']);
 }
 }
 fetchTelemetry();
 }, []);

 const runInteraction = async () => {
 setIsProcessing(true);
 setLogs(prev => [...prev,`[USER] Initiating ${mode} interaction...`]);

 try {
 const res = await fetch('/api/billing/record', {
 method:'POST',
 headers: {'Content-Type':'application/json','Authorization':'Bearer mock_jwt',
 },
 body: JSON.stringify({
 type:'sandbox_use',
 units: 1,
 metadata: { mode, interactionId: Math.random().toString(36).substring(7) }
 })
 });

 const result = await res.json();

 if (res.ok) {
 setLogs(prev => [...prev,`[SUCCESS] ${mode.toUpperCase()} request processed. EU Deducted: 0.1`]);
 setLogs(prev => [...prev,`[SYSTEM] Remaining Quota: ${result.data.remaining_quota.toFixed(2)} EU`]);
 } else {
 setLogs(prev => [...prev,`[FAILURE] Interaction blocked: ${result.error}`]);
 }
 } catch (err) {
 setLogs(prev => [...prev,'[ERROR] Network failure during interaction.']);
 } finally {
 setIsProcessing(false);
 }
 };

 const { isFeatureEnabled } = require('@/lib/featureFlags');
 const { ComingSoonBlock } = require('@/components/layout/ComingSoonBlock');

 if (!isFeatureEnabled('sandboxChat')) {
 return (
 <div className="w-full max-w-7xl mx-auto p-6 md:p-8">
 <ComingSoonBlock moduleName="Sandbox Interactions" status="L3_SANDBOX_STABLE" />
 </div>
 );
 }

 return (
 <div className="w-full max-w-7xl mx-auto p-6 md:p-8 space-y-6">
 <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-xs font-bold text-center">
 ⚠️ TEST ENVIRONMENT - Governance Integrity Active ⚠️
 </div>

 <div className="flex flex-col gap-1">
 <h1 className="text-2xl font-bold font-mono tracking-tight">Interactive Sandbox</h1>
 <p className="text-sm">Validate institutional workflows with deterministic billing.</p>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
 <div className="lg:col-span-8 section-card flex flex-col min-h-[500px] overflow-hidden">
 <div className="px-6 py-4 border-b flex justify-between items-center /50">
 <div className="flex gap-2">
 <button 
 className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors ${mode ==='chat' ?'bg-[var(--accent)] text-[var(--bg-primary)]' :'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-primary)]'}`}
 onClick={() => setMode('chat')}
 >
 Chat Sandbox
 </button>
 <button 
 className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors ${mode ==='voice' ?'bg-[var(--accent)] text-[var(--bg-primary)]' :'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-primary)]'}`}
 onClick={() => setMode('voice')}
 >
 Voice Sandbox
 </button>
 </div>
 <div className="text-[10px] font-black uppercase tracking-widest">
 COST: 0.1 EU / Interaction
 </div>
 </div>

 <div className="flex-1 p-6 font-mono text-xs space-y-2 overflow-y-auto">
 {logs.map((log, i) => (
 <div key={i} className={log.startsWith('[ERROR]') || log.startsWith('[FAILURE]') ?'text-red-400' :'text-emerald-400 opacity-90'}>
 {log}
 </div>
 ))}
 {isProcessing && <div className="text-[var(--gold)] animate-pulse">[PROCESSING] Computing deterministic response...</div>}
 </div>

 <div className="p-4 border-t transition-colors duration-300">
 <button 
 className="w-full bg-[var(--accent)] text-[var(--bg-primary)] font-black uppercase tracking-widest text-[10px] py-4 rounded-xl hover:opacity-90 transition-colors shadow-lg active:scale-[0.98] disabled:opacity-50" 
 onClick={runInteraction}
 disabled={isProcessing}
 >
 {mode ==='chat' ?'Send Test Message' :'Initiate Test Call'}
 </button>
 </div>
 </div>

 <div className="lg:col-span-4 space-y-6">
 <div className="section-card p-6 transition-colors duration-300">
 <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest mb-6 border-l-2 border-[var(--accent)] px-3 transition-colors duration-300">Integrity Guard</h3>
 <div className="space-y-4">
 <div className="flex justify-between items-center">
 <span className="text-[10px] font-black uppercase tracking-widest">Telemetry Bonded</span>
 <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${telemetry ?'bg-emerald-50 text-emerald-600 border border-emerald-100' :'bg-amber-50 text-amber-600 border border-amber-100'}`}>
 {telemetry ?'VERIFIED' :'PENDING'}
 </span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[10px] font-black uppercase tracking-widest">Billing RPC</span>
 <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">DETERMINISTIC</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[10px] font-black uppercase tracking-widest">Org Isolation</span>
 <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">ACTIVE</span>
 </div>
 </div>
 
 <div className="mt-8 p-4 border rounded-lg">
 <span className="block text-[9px] font-black uppercase tracking-widest mb-2">Legal Disclaimer</span>
 <p className="text-[10px] leading-relaxed italic">
 Interactions in the sandbox are recorded in the institutional audit journal for compliance purposes.
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}

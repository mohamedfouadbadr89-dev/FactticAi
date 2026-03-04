"use client";

import React, { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { CardSkeleton } from "@/components/ui/CardSkeleton";
import { ChartSkeleton } from "@/components/ui/ChartSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Terminal, ShieldAlert, Cpu, Activity, Play, CheckCircle2, SlidersHorizontal, Plus, Save, ClipboardList, RefreshCw, Plug, Wifi, WifiOff, Copy, Trash2, Server } from "lucide-react";

type Scenario = 'hallucination_attack' | 'pii_leak' | 'tone_violation' | 'policy_break';

function SimulatorSandbox() {
  const [activeScenario, setActiveScenario] = useState<Scenario>('policy_break');
  const [isSimulating, setIsSimulating] = useState(false);
  const [latestReport, setLatestReport] = useState<any>(null);

  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/simulator/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            org_id: 'dbad3ca2-3907-4279-9941-8f55c3c0efdc', // Natively bound via middleware
            scenario: activeScenario
        })
      });
      const data = await res.json();
      
      // Map API signature into component state expected shape
      setLatestReport({
          scenario: activeScenario,
          synthetic_payload: data.payload,
          intercepted: data.simulation_result === 'BLOCKED',
          risk_score: data.risk_score,
          triggered_rules: data.triggered_rules || []
      });
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  const scenarios = [
    { id: 'policy_break', label: 'Safety Override Injection', type: 'RED_TEAM', desc: 'Simulates direct bypass attempts against core instruction logic.' },
    { id: 'hallucination_attack', label: 'Hallucination Generation', type: 'RELIABILITY', desc: 'Forces confident false generation testing bounds thresholds.' },
    { id: 'pii_leak', label: 'PII Data Extraction', type: 'COMPLIANCE', desc: 'Attempts to force sensitive Org data via hidden contexts.' },
    { id: 'tone_violation', label: 'Violent Tone Shift', type: 'BEHAVIOR', desc: 'Tests extreme adversarial text generation bounds.' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Scenario Controller */}
         <div className="lg:col-span-1 bg-[#111] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-[#2d2d2d] pb-4">
              <Terminal className="w-5 h-5 text-gray-400" />
              <h2 className="text-sm font-bold tracking-wide uppercase text-[var(--text-primary)]">Threat Scenarios</h2>
            </div>
            
            <div className="space-y-3">
              {scenarios.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveScenario(s.id as Scenario)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                     activeScenario === s.id 
                     ? 'bg-[#1a1a1a] border-[#ef4444]/50 ring-1 ring-[#ef4444] shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
                     : 'bg-[#1a1a1a] border-[#2d2d2d] hover:border-[#444]'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-sm font-bold text-[var(--text-primary)]">{s.label}</span>
                     <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded ${
                         s.type === 'RED_TEAM' ? 'bg-[#ef4444]/30 text-[#ef4444]' :
                         s.type === 'RELIABILITY' ? 'bg-[#ef4444]/30 text-[#ef4444]' :
                         s.type === 'COMPLIANCE' ? 'bg-[#10b981]/30 text-[#10b981]' :
                         'bg-[#3b82f6]/30 text-[#3b82f6]'
                     }`}>{s.type}</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-mono">
                    {s.desc}
                  </p>
                </button>
              ))}
            </div>

            <button 
              onClick={runSimulation}
              disabled={isSimulating}
              className="mt-8 flex items-center justify-center gap-2 w-full py-4 bg-[var(--danger)]/10 border border-[var(--danger)]/30 hover:bg-[var(--danger)]/20 text-[var(--danger)] text-xs font-black uppercase tracking-widest rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSimulating ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isSimulating ? 'Executing Simulation...' : 'Commence Attack Run'}
            </button>
         </div>

         {/* Execution Results */}
         <div className="lg:col-span-2 bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-[#2d2d2d] pb-4">
              <div className="flex items-center gap-3">
                 <ShieldAlert className="w-5 h-5 text-[#3b82f6]" />
                 <h2 className="text-sm font-bold tracking-wide uppercase text-[var(--text-primary)]">Governance Intercept Report</h2>
              </div>
              {latestReport && (
                 <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${
                    latestReport.intercepted 
                    ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/50' 
                    : 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/50'
                 }`}>
                   {latestReport.intercepted ? 'SUCCESSFULLY BLOCKED' : 'SYSTEM BREACHED'}
                 </span>
              )}
            </div>

            {!latestReport && !isSimulating && (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-[#2d2d2d] rounded-xl">
                  <Terminal className="w-12 h-12 text-[#222] mb-4" />
                  <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest">Sandbox Ready</p>
                  <p className="text-xs text-[#555] mt-2 font-mono">Select a scenario array and execute to intercept active traffic simulation.</p>
               </div>
            )}

            {isSimulating && (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-12 py-24 space-y-6 animate-pulse">
                  <div className="w-16 h-16 border-4 border-[#ef4444] border-t-transparent rounded-full animate-spin"></div>
                  <div className="text-xs font-mono text-[var(--danger)] uppercase tracking-widest">Injecting adversarial payloads into Governance Engine...</div>
               </div>
            )}

            {latestReport && !isSimulating && (
               <div className="flex-1 flex flex-col animate-fade-in-up space-y-6">
                  {/* Dynamic Simulation Terminal */}
                  <div className="bg-[#111] border border-[#333] rounded-xl p-6 font-mono text-xs overflow-hidden">
                     <div className="flex items-center gap-2 text-[#9ca3af] mb-4 border-b border-[#222] pb-2">
                        <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span>
                        <span className="w-2 h-2 rounded-full bg-[#ef4444] opacity-70"></span>
                        <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                        <span className="ml-2 uppercase tracking-widest">Synthetic Execution Trace</span>
                     </div>
                     <div className="text-[var(--success)] mb-2">{`> INITIALIZING ${latestReport.scenario.toUpperCase()} ATTACK VECTOR`}</div>
                     <div className="text-[var(--primary)] mb-4">{`> PAYLOAD: "${latestReport.synthetic_payload}"`}</div>
                     
                     <div className="text-slate-500 mb-2">{`> ROUTING TO GUARDRAIL_ENGINE [org_id: dbad...]`}</div>
                     
                     {latestReport.triggered_rules && latestReport.triggered_rules.length > 0 && (
                        <div className="pl-4 border-l border-[#333] mb-4 space-y-2">
                           <div className="text-slate-400">Triggered Intercept Logic:</div>
                           {latestReport.triggered_rules.map((rule: string, i: number) => (
                               <div key={i} className="flex justify-between w-full">
                                  <span className="text-[#ef4444] opacity-70 font-bold">- {rule}</span>
                               </div>
                           ))}
                        </div>
                     )}

                     {latestReport.intercepted ? (
                         <div className="text-[var(--danger)] font-bold mt-4 animate-pulse">
                           {`> [REJECTED] Payload intercepted and destroyed by Guardrail.`}
                         </div>
                     ) : (
                         <div className="text-[var(--danger)] font-bold mt-4 animate-pulse">
                           {`> [BREACH] PAYLOAD EXECUTED SUCCESSFULLY. NO INTERCEPTS DETECTED.`}
                         </div>
                     )}
                  </div>

                  {/* Summary Metric Array */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-[#222] p-4 rounded-xl border border-[#333]">
                        <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-bold mb-1">Calculated Risk Velocity</div>
                        <div className="text-3xl font-black text-[var(--warning)]">{(latestReport.risk_score * 100).toFixed(0)}%</div>
                     </div>
                     <div className="bg-[#222] p-4 rounded-xl border border-[#333] flex flex-col justify-center items-center">
                        {latestReport.intercepted ? (
                           <>
                             <CheckCircle2 className="w-8 h-8 text-[var(--success)] mb-2" />
                             <div className="text-[10px] text-[var(--success)] uppercase tracking-widest font-bold">Resilient to Attack</div>
                           </>
                        ) : (
                           <>
                             <ShieldAlert className="w-8 h-8 text-[var(--danger)] mb-2" />
                             <div className="text-[10px] text-[var(--danger)] uppercase tracking-widest font-bold">Policy Failure Detected</div>
                           </>
                        )}
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
  )
}

const heatmapData = [
  { agent: "Agent A", days: [0.1, 0.3, 0.8, 0.2, 0.5, 1.2, 0.4] },
  { agent: "Agent B", days: [0.2, 0.1, 0.3, 0.6, 0.2, 0.1, 0.3] },
  { agent: "Agent C", days: [1.4, 0.9, 0.7, 0.5, 0.8, 1.1, 0.6] },
  { agent: "Agent D", days: [0.1, 0.1, 0.2, 0.1, 0.1, 0.3, 0.1] },
  { agent: "Agent E", days: [0.6, 0.8, 1.0, 1.3, 0.9, 0.7, 0.5] },
];

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function heatColor(val: number): string {
  if (val >= 1.0) return "bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20";
  if (val >= 0.5) return "bg-[#ef4444]/10 text-[#ef4444] opacity-70 border border-[#ef4444]/20";
  if (val >= 0.2) return "bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20";
  return "bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-primary)]";
}

function GovernancePolicyEditor() {
    const [policies, setPolicies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [newPolicy, setNewPolicy] = useState({
        name: '',
        signal: 'hallucination',
        operator: '>',
        value: 70,
        action: 'block'
    });

    const fetchPolicies = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/policies/runtime');
            const data = await res.json();
            if (res.ok) setPolicies(data.policies || []);
        } catch (e) {
            console.error('Failed to fetch policies:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPolicies(); }, []);

    const handleCreate = async () => {
        if (!newPolicy.name) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/policies/runtime', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newPolicy.name,
                    condition: { signal: newPolicy.signal, operator: newPolicy.operator, value: newPolicy.value },
                    action: newPolicy.action
                })
            });
            if (res.ok) {
                await fetchPolicies();
                setShowAdd(false);
                setNewPolicy({ name: '', signal: 'hallucination', operator: '>', value: 70, action: 'block' });
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Permanently delete this governance policy?')) return;
        try {
            const res = await fetch(`/api/policies/runtime/${id}`, { method: 'DELETE' });
            if (res.ok) fetchPolicies();
        } catch (e) {
            console.error('Delete failed:', e);
        }
    };

    const toggleEnabled = async (policy: any) => {
        try {
            const res = await fetch(`/api/policies/runtime/${policy.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: !policy.enabled })
            });
            if (res.ok) fetchPolicies();
        } catch (e) {
            console.error('Toggle failed:', e);
        }
    };

    return (
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm">
             <div className="flex items-center justify-between mb-6 border-b border-[#2d2d2d] pb-4">
               <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                     <SlidersHorizontal className="w-5 h-5 text-[#3b82f6]" />
                     <h2 className="text-sm font-bold tracking-wide uppercase text-white">Governance Policy Editor</h2>
                  </div>
                  <p className="text-[10px] text-[#9ca3af] uppercase tracking-widest mt-1 font-mono">Bound explicit thresholds to real-time execution Guardrails.</p>
               </div>
               <button 
                  onClick={() => setShowAdd(!showAdd)}
                  className={`px-4 py-2 ${showAdd ? 'bg-[#444]' : 'bg-[#3b82f6]'} hover:opacity-80 text-white text-xs font-black uppercase tracking-widest rounded flex items-center gap-2 transition-all`}
               >
                   {showAdd ? <Activity className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                   {showAdd ? 'Cancel' : 'New Rule'}
               </button>
             </div>

             <div className="space-y-4">
                 {/* Add Form */}
                 {showAdd && (
                    <div className="bg-[#111] border border-[#3b82f6]/50 rounded-xl p-6 mb-6 animate-in slide-in-from-top duration-300">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#3b82f6] mb-4">Create Guardrail Protocol</p>
                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-12 md:col-span-4">
                                <label className="block text-[9px] font-black text-[#555] uppercase mb-1.5">Policy Name</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Reject Hallucinations"
                                    className="bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 w-full text-xs text-white focus:outline-none focus:border-[#3b82f6]"
                                    value={newPolicy.name}
                                    onChange={e => setNewPolicy({...newPolicy, name: e.target.value})}
                                />
                            </div>
                            <div className="col-span-6 md:col-span-2">
                                <label className="block text-[9px] font-black text-[#555] uppercase mb-1.5">Signal</label>
                                <select 
                                    className="bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 w-full text-[10px] font-mono text-gray-300 focus:border-[#3b82f6] uppercase tracking-widest"
                                    value={newPolicy.signal}
                                    onChange={e => setNewPolicy({...newPolicy, signal: e.target.value as any})}
                                >
                                    <option value="hallucination">Hallucination</option>
                                    <option value="pii_exposure">PII Risk</option>
                                    <option value="toxicity">Toxicity</option>
                                    <option value="prompt_injection">Injection</option>
                                </select>
                            </div>
                            <div className="col-span-6 md:col-span-2">
                                <label className="block text-[9px] font-black text-[#555] uppercase mb-1.5">Action</label>
                                <select 
                                    className="bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 w-full text-[10px] font-mono text-gray-300 focus:border-[#3b82f6] uppercase tracking-widest"
                                    value={newPolicy.action}
                                    onChange={e => setNewPolicy({...newPolicy, action: e.target.value as any})}
                                >
                                    <option value="block">BLOCK</option>
                                    <option value="redact">REDACT</option>
                                    <option value="rewrite">REWRITE</option>
                                    <option value="warn">WARN</option>
                                    <option value="escalate">ESCALATE</option>
                                </select>
                            </div>
                            <div className="col-span-9 md:col-span-3">
                                <label className="block text-[9px] font-black text-[#555] uppercase mb-1.5">Threshold ({newPolicy.value}%)</label>
                                <input 
                                    type="range" min="0" max="100" 
                                    value={newPolicy.value}
                                    onChange={e => setNewPolicy({...newPolicy, value: parseInt(e.target.value)})}
                                    className="w-full accent-[#3b82f6] mt-2" 
                                />
                            </div>
                            <div className="col-span-3 md:col-span-1 flex items-end">
                                <button 
                                    onClick={handleCreate}
                                    disabled={isSaving || !newPolicy.name}
                                    className="w-full bg-[#3b82f6] text-white p-2 rounded hover:bg-[#2563eb] transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? <Activity className="w-4 h-4 animate-spin mx-auto" /> : <Save className="w-4 h-4 mx-auto" />}
                                </button>
                            </div>
                        </div>
                    </div>
                 )}

                 <div className="grid grid-cols-12 gap-4 px-4 text-[10px] font-black uppercase tracking-widest text-[#555] mb-2 border-b border-[#2d2d2d] pb-2">
                     <div className="col-span-4">Policy Internal Name / Status</div>
                     <div className="col-span-3">Condition Logic</div>
                     <div className="col-span-3">Active Threshold</div>
                     <div className="col-span-2 text-right">Enactment</div>
                 </div>

                 {loading ? (
                    <div className="flex items-center justify-center py-12 animate-pulse text-[#444]">
                        <SlidersHorizontal className="w-8 h-8 animate-bounce" />
                    </div>
                 ) : policies.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-[#2d2d2d] rounded-xl text-[#444]">
                        <Server className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p className="text-xs font-black uppercase tracking-widest">No custom policies deployed</p>
                        <p className="text-[10px] font-mono mt-1">Org is running on global engine defaults Stage 7.75.</p>
                    </div>
                 ) : policies.map((p) => (
                    <div key={p.id} className={`grid grid-cols-12 gap-4 items-center bg-[#222] border ${p.enabled ? 'border-[#333]' : 'border-[#2d1a1a] opacity-50'} rounded-xl p-4 transition-all hover:border-[#444] group`}>
                        <div className="col-span-4 flex items-center gap-3">
                           <button 
                             onClick={() => toggleEnabled(p)}
                             className={`w-3 h-3 rounded-full border ${p.enabled ? 'bg-[#10b981] border-[#10b981]' : 'bg-transparent border-[#444]'}`} 
                           />
                           <div>
                             <p className="text-xs font-bold text-white mb-0.5">{p.name}</p>
                             <p className="text-[9px] font-mono text-[#555] opacity-0 group-hover:opacity-100 transition-opacity uppercase">{p.id.slice(0, 8)}</p>
                           </div>
                        </div>
                        <div className="col-span-3">
                           <span className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-tighter">
                             IF {p.condition.signal} {p.condition.operator}
                           </span>
                        </div>
                        <div className="col-span-3 flex items-center gap-3">
                           <div className="flex-1 h-1 bg-[#111] rounded-full overflow-hidden">
                              <div className="h-full bg-[#3b82f6] rounded-full" style={{ width: `${p.condition.value}%` }} />
                           </div>
                           <span className="text-xs font-mono font-bold w-12 text-right text-[#f59e0b]">{p.condition.value}%</span>
                        </div>
                        <div className="col-span-2 flex justify-end gap-3 items-center">
                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded border ${
                                p.action === 'block' ? 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30' : 
                                p.action === 'redact' ? 'bg-[#a855f7]/10 text-[#a855f7] border-[#a855f7]/30' : 
                                p.action === 'rewrite' ? 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30' : 
                                'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/30'
                            }`}>
                              {p.action}
                            </span>
                            <button 
                                onClick={() => handleDelete(p.id)}
                                className="text-[#444] hover:text-[#ef4444] transition-colors p-1"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                 ))}
             </div>
        </div>
    );
}

function SecurityAuditLogPanel() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      // Pull from client-side Supabase for the UI (auth'd user, RLS-filtered)
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await sb
        .from('audit_logs')
        .select('id, action, resource, status, created_at, actor_id')
        .order('created_at', { ascending: false })
        .limit(30);
      setLogs(data ?? []);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const statusColor = (status: string) => {
    if (status === 'success') return 'text-[#10b981] bg-[#10b981]/20 border-[#10b981]/50';
    if (status === 'failure') return 'text-[#ef4444] bg-[#ef4444]/20 border-[#ef4444]/50';
    return 'text-[#3b82f6] bg-[#3b82f6]/20 border-[#3b82f6]/50'; // blocked / other
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#2d2d2d]">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-5 h-5 text-[#3b82f6]" />
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase text-white">Security Audit Log</h2>
            <p className="text-[10px] text-[#9ca3af] font-mono mt-0.5">All critical governance API actions. Last 30 entries.</p>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loadingLogs}
          className="flex items-center gap-2 px-3 py-1.5 border border-[#444] hover:border-[#3b82f6] text-[#9ca3af] hover:text-[#3b82f6] rounded text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loadingLogs ? (
        <div className="flex items-center justify-center h-24 animate-pulse">
          <Activity className="w-5 h-5 text-[#555] animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="w-8 h-8 text-[#333] mx-auto mb-3" />
          <p className="text-xs font-black uppercase tracking-widest text-[#555]">No audit entries yet</p>
          <p className="text-[10px] text-[#444] font-mono mt-1">Actions will appear here after critical API calls.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[9px] font-black uppercase tracking-widest text-[#555] border-b border-[#2d2d2d]">
                <th className="pb-3 pr-6">Action</th>
                <th className="pb-3 pr-6">Resource</th>
                <th className="pb-3 pr-6">Actor</th>
                <th className="pb-3 pr-6">Status</th>
                <th className="pb-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {logs.map((log) => (
                <tr key={log.id} className="group hover:bg-[#222]/50 transition-colors">
                  <td className="py-3 pr-6 font-mono font-bold text-white">{log.action}</td>
                  <td className="py-3 pr-6 text-[#9ca3af] font-mono truncate max-w-[200px]">{log.resource}</td>
                  <td className="py-3 pr-6 text-[#9ca3af] font-mono text-[10px]">
                    {log.actor_id ? log.actor_id.slice(0, 8) + '…' : 'system'}
                  </td>
                  <td className="py-3 pr-6">
                    <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${statusColor(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 text-right text-[#555] font-mono text-[10px]">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Event Stream Monitor Panel (Phase 43) ─────────────────────────────────────

function EventStreamMonitorPanel() {
  const [data, setData] = React.useState<any>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchData = React.useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch('/api/observability/stream');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('[EventStreamMonitor]', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 8_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const metrics   = data?.metrics;
  const recent    = data?.recent ?? [];
  const exporters = data?.exporters ?? [];

  const categoryColor = (cat: string) => {
    if (cat === 'interceptor' || cat === 'guardrail') return '#ef4444';
    if (cat === 'policy') return '#f59e0b';
    return '#10b981';
  };

  const totalCatEvents = metrics?.by_category
    ? Object.values(metrics.by_category as Record<string, number>).reduce((a: number, b) => a + (b as number), 0)
    : 0;

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#2d2d2d]">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-[#10b981]" />
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase text-white">Event Stream Monitor</h2>
            <p className="text-[10px] text-[#9ca3af] font-mono mt-0.5">OpenTelemetry governance events — real-time export status.</p>
          </div>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#444] hover:border-[#10b981] text-[#9ca3af] hover:text-[#10b981] rounded text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {!data ? (
        <div className="flex items-center justify-center h-40 animate-pulse">
          <Activity className="w-7 h-7 text-[#555] animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[#111] rounded-xl p-4 text-center border border-[#2d2d2d]">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#555] mb-1">Events / sec</p>
              <p className="text-2xl font-black text-[#10b981]">
                {metrics?.events_per_second?.toFixed(1) ?? '0.0'}
              </p>
            </div>
            <div className="bg-[#111] rounded-xl p-4 text-center border border-[#2d2d2d]">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#555] mb-1">Last 60s</p>
              <p className="text-2xl font-black text-[#3b82f6]">{metrics?.total_in_window ?? 0}</p>
            </div>
            <div className="bg-[#111] rounded-xl p-4 text-center border border-[#2d2d2d]">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#555] mb-1">Categories</p>
              <p className="text-2xl font-black text-white">
                {Object.keys(metrics?.by_category ?? {}).length}
              </p>
            </div>
          </div>

          {/* Category bars */}
          {totalCatEvents > 0 && (
            <div className="mb-6 space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#555] mb-3">Event Categories</p>
              {(Object.entries(metrics.by_category) as [string, number][]).map(([cat, count]) => (
                <div key={cat}>
                  <div className="flex justify-between text-[9px] mb-1">
                    <span className="font-mono text-[#9ca3af]">{cat}</span>
                    <span className="font-black" style={{ color: categoryColor(cat) }}>{count}</span>
                  </div>
                  <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (count / totalCatEvents) * 100)}%`,
                        backgroundColor: categoryColor(cat),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Exporter status */}
          <div className="mb-6">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#555] mb-3">Export Adapters</p>
            <div className="flex flex-wrap gap-2">
              {exporters.map((exp: any) => (
                <div
                  key={exp.name}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-mono ${
                    exp.active
                      ? 'border-[#10b981]/50 bg-[#10b981]/10 text-[#10b981]'
                      : 'border-[#333] bg-[#111] text-[#555]'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${exp.active ? 'bg-[#10b981]' : 'bg-[#444]'}`} />
                  {exp.name}
                  <span className="text-[8px] font-black uppercase">{exp.active ? 'ACTIVE' : 'INACTIVE'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent events feed */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-[#555] mb-3">Recent Events</p>
            {recent.length === 0 ? (
              <p className="text-[10px] text-[#444] font-mono text-center py-6">No events recorded yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-[#333]">
                {recent.map((ev: any) => {
                  const cat = ev.event_type?.split('.')[0] ?? 'custom';
                  return (
                    <div key={ev.id} className="flex items-center gap-3 bg-[#111] border border-[#2d2d2d] rounded-lg px-3 py-2">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: categoryColor(cat) }} />
                      <span className="text-[10px] font-mono text-[#9ca3af] flex-1 truncate">{ev.event_type}</span>
                      <span className="text-[9px] text-[#444] font-mono flex-shrink-0">
                        {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Governance Testing Lab Panel (Phase 40) ──────────────────────────────────

const TEST_SCENARIOS = [
  { id: 'hallucination_stress',   label: 'Hallucination Stress',   description: 'Fires factual inversion + fabrication prompts' },
  { id: 'policy_violation_test',  label: 'Policy Violation',       description: 'Attempts to override system policy rules' },
  { id: 'prompt_injection_test',  label: 'Prompt Injection',       description: 'Embeds adversarial system-override instructions' },
  { id: 'context_overflow_test',  label: 'Context Overflow',       description: 'Saturates context window to degrade governance rules' },
] as const;

type LabScenario = typeof TEST_SCENARIOS[number]['id'];

function GovernanceTestingLabPanel() {
  const [agentName, setAgentName] = React.useState('');
  const [scenario, setScenario] = React.useState<LabScenario>('hallucination_stress');
  const [running, setRunning] = React.useState(false);
  const [report, setReport] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  const resultColor = (result: string) => {
    if (result === 'passed')  return 'text-[#10b981] bg-[#10b981]/20 border-[#10b981]/50';
    if (result === 'blocked') return 'text-[#3b82f6] bg-[#3b82f6]/20 border-[#3b82f6]/50';
    return 'text-[#ef4444] bg-[#ef4444]/20 border-[#ef4444]/50';
  };

  const riskColor = (score: number) => {
    if (score < 45) return '#10b981';
    if (score < 70) return '#3b82f6';
    return '#ef4444';
  };

  const handleRun = async () => {
    if (!agentName.trim()) { setError('Agent name is required.'); return; }
    setError(null);
    setRunning(true);
    setReport(null);
    try {
      const res = await fetch('/api/testing/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_name: agentName.trim(), scenario }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Test failed'); return; }
      setReport(data.report);
    } catch (e) {
      setError('Network error. Please retry.');
    } finally {
      setRunning(false);
    }
  };

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `governance-test-${report.scenario}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#2d2d2d]">
        <Terminal className="w-5 h-5 text-[#ef4444]" />
        <div>
          <h2 className="text-sm font-bold tracking-wide uppercase text-white">Governance Testing Lab</h2>
          <p className="text-[10px] text-[#9ca3af] font-mono mt-0.5">Automated adversarial stress tests for AI governance boundaries.</p>
        </div>
      </div>

      {/* Config */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Agent name */}
        <div>
          <label className="block text-[9px] font-black uppercase tracking-widest text-[#555] mb-2">Agent Name</label>
          <input
            type="text"
            placeholder="e.g. gpt-4o-prod"
            value={agentName}
            onChange={e => setAgentName(e.target.value)}
            className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-xs font-mono text-[#9ca3af] focus:outline-none focus:border-[#ef4444] placeholder:text-[#444]"
          />
        </div>
        {/* Scenario */}
        <div>
          <label className="block text-[9px] font-black uppercase tracking-widest text-[#555] mb-2">Test Scenario</label>
          <select
            value={scenario}
            onChange={e => setScenario(e.target.value as LabScenario)}
            className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-xs font-mono text-[#9ca3af] focus:outline-none focus:border-[#ef4444]"
          >
            {TEST_SCENARIOS.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <p className="text-[9px] text-[#444] font-mono mt-1.5">
            {TEST_SCENARIOS.find(s => s.id === scenario)?.description}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-2.5 bg-[#ef4444]/10 border border-[#ef4444]/40 rounded text-xs text-[#ef4444] font-mono">{error}</div>
      )}

      {/* Run button */}
      <button
        onClick={handleRun}
        disabled={running}
        className="w-full flex items-center justify-center gap-2 py-3 border border-[#ef4444]/70 text-[#ef4444] hover:bg-[#ef4444]/10 text-xs font-black uppercase tracking-widest rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6"
      >
        {running ? (
          <>
            <Activity className="w-4 h-4 animate-spin" />
            Running stress test…
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Run Governance Test
          </>
        )}
      </button>

      {/* Report */}
      {report && (
        <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-5 space-y-5">
          {/* Summary row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${resultColor(report.result)}`}>
                {report.result}
              </span>
              <span className="text-xs font-bold text-white">{report.agent_name}</span>
              <span className="text-[10px] text-[#555] font-mono">· {report.scenario.replace(/_/g, ' ')}</span>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#444] hover:border-[#10b981] text-[#9ca3af] hover:text-[#10b981] rounded text-[9px] font-black uppercase tracking-widest transition-colors"
            >
              <CheckCircle2 className="w-3 h-3" /> Download Report
            </button>
          </div>

          {/* Risk meter */}
          <div>
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-1.5">
              <span className="text-[#555]">Risk Score</span>
              <span style={{ color: riskColor(report.risk_score) }}>{report.risk_score.toFixed(1)} / 100</span>
            </div>
            <div className="h-2 bg-[#222] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${report.risk_score}%`, backgroundColor: riskColor(report.risk_score) }}
              />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#1a1a1a] rounded-lg p-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#555] mb-1">Prompts Fired</p>
              <p className="text-xl font-black text-white">{report.prompts_fired}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#555] mb-1">Signals</p>
              <p className="text-xl font-black text-[#3b82f6]">{report.governance_signals.length}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#555] mb-1">Violations</p>
              <p className="text-xl font-black text-[#ef4444]">{report.violations.length}</p>
            </div>
          </div>

          {/* Violations */}
          {report.violations.length > 0 && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#ef4444] mb-2">Detected Violations</p>
              <ul className="space-y-1">
                {report.violations.map((v: string, i: number) => (
                  <li key={i} className="text-[10px] font-mono text-[#ef4444]/80 bg-[#ef4444]/5 border border-[#ef4444]/20 rounded px-3 py-1.5">{v}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendation */}
          <div className="border-t border-[#2d2d2d] pt-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#10b981] mb-2">Recommendation</p>
            <p className="text-[10px] font-mono text-[#9ca3af] leading-relaxed">{report.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── External Integrations Panel (Phase 38) ──────────────────────────────────

const PROVIDERS = [
  { id: 'vapi',             label: 'Vapi',               color: '#10b981', webhookPath: '/api/integrations/vapi/webhook' },
  { id: 'retell',           label: 'Retell',              color: '#10b981', webhookPath: '/api/integrations/retell/webhook' },
  { id: 'elevenlabs',       label: 'ElevenLabs',          color: '#10b981', webhookPath: '/api/integrations/elevenlabs/webhook' },
  { id: 'openai_realtime',  label: 'OpenAI Realtime',     color: '#3b82f6', webhookPath: null },
  { id: 'anthropic_agents', label: 'Anthropic Agents',    color: '#3b82f6', webhookPath: null },
] as const;

type ProviderId = typeof PROVIDERS[number]['id'];

interface IntegrationState {
  apiKey: string;
  status: 'active' | 'inactive' | 'error';
}

function ExternalIntegrationsPanel() {
  const [integrations, setIntegrations] = useState<Record<ProviderId, IntegrationState>>({
    vapi:             { apiKey: '', status: 'inactive' },
    retell:           { apiKey: '', status: 'inactive' },
    elevenlabs:       { apiKey: '', status: 'inactive' },
    openai_realtime:  { apiKey: '', status: 'inactive' },
    anthropic_agents: { apiKey: '', status: 'inactive' },
  });

  const [testing, setTesting] = useState<ProviderId | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const statusIcon = (status: string) => {
    if (status === 'active') return <Wifi className="w-3.5 h-3.5 text-[#10b981]" />;
    if (status === 'error')  return <WifiOff className="w-3.5 h-3.5 text-[#ef4444]" />;
    return <WifiOff className="w-3.5 h-3.5 text-[#555]" />;
  };

  const statusBadge = (status: string) => {
    if (status === 'active')   return 'text-[#10b981] bg-[#10b981]/20 border-[#10b981]/50';
    if (status === 'error')    return 'text-[#ef4444] bg-[#ef4444]/20 border-[#ef4444]/50';
    return 'text-[#555] bg-[#222] border-[#333]';
  };

  const handleTest = async (providerId: ProviderId) => {
    setTesting(providerId);
    try {
      await new Promise(r => setTimeout(r, 1200)); // Simulate connection test
      setIntegrations(prev => ({
        ...prev,
        [providerId]: { ...prev[providerId], status: prev[providerId].apiKey ? 'active' : 'error' }
      }));
    } finally {
      setTesting(null);
    }
  };

  const copyWebhook = (url: string, providerId: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(providerId);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#2d2d2d]">
        <Plug className="w-5 h-5 text-[#3b82f6]" />
        <div>
          <h2 className="text-sm font-bold tracking-wide uppercase text-white">External Integrations</h2>
          <p className="text-[10px] text-[#9ca3af] font-mono mt-0.5">Connect external Voice AI providers to ingest conversation telemetry.</p>
        </div>
      </div>

      {/* Provider list */}
      <div className="space-y-4">
        {PROVIDERS.map((provider) => {
          const state = integrations[provider.id];
          const webhookUrl = provider.webhookPath ? `${baseUrl}${provider.webhookPath}` : null;

          return (
            <div key={provider.id} className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4">
              {/* Row 1: Provider name + status */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {statusIcon(state.status)}
                  <span className="text-xs font-bold text-white">{provider.label}</span>
                </div>
                <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${
                  statusBadge(state.status)
                }`}>
                  {state.status}
                </span>
              </div>

              {/* Row 2: API Key input + Test button */}
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="password"
                  placeholder="API key or secret"
                  value={state.apiKey}
                  onChange={e => setIntegrations(prev => ({
                    ...prev,
                    [provider.id]: { ...prev[provider.id], apiKey: e.target.value }
                  }))}
                  className="flex-1 bg-[#1a1a1a] border border-[#333] rounded px-3 py-1.5 text-xs font-mono text-[#9ca3af] focus:outline-none focus:border-[#3b82f6] placeholder:text-[#444]"
                />
                <button
                  onClick={() => handleTest(provider.id)}
                  disabled={testing === provider.id}
                  className="px-3 py-1.5 border border-[#3b82f6]/50 text-[#3b82f6] hover:bg-[#3b82f6]/10 text-[9px] font-black uppercase tracking-widest rounded transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {testing === provider.id ? '...' : 'Test'}
                </button>
              </div>

              {/* Row 3: Webhook URL */}
              {webhookUrl ? (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#555]">Webhook URL:</span>
                  <span className="flex-1 text-[10px] font-mono text-[#555] truncate">{webhookUrl}</span>
                  <button
                    onClick={() => copyWebhook(webhookUrl, provider.id)}
                    className="text-[#555] hover:text-[#9ca3af] transition-colors"
                    title="Copy webhook URL"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {copied === provider.id && (
                    <span className="text-[9px] text-[#10b981] font-bold">Copied!</span>
                  )}
                </div>
              ) : (
                <p className="text-[9px] text-[#444] font-mono mt-2">Webhook support coming soon for this provider.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdvancedModePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-8 py-10 space-y-10">
        <div>
          <Skeleton height="36px" width="240px" className="mb-2" />
          <Skeleton height="14px" width="300px" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CardSkeleton className="min-h-[320px]" />
          <CardSkeleton className="min-h-[320px]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartSkeleton className="min-h-[320px]" />
          <CardSkeleton className="min-h-[320px]" />
        </div>
        <CardSkeleton className="min-h-[400px]" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-10 space-y-10">

      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-secondary)]">
          Advanced Mode
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Deep diagnostics · Model telemetry · Escalation analysis</p>
      </div>

      <SimulatorSandbox />

      <GovernancePolicyEditor />

      <EventStreamMonitorPanel />

      <GovernanceTestingLabPanel />

      <ExternalIntegrationsPanel />

      <SecurityAuditLogPanel />

      {/* Row 1: Drift Heatmap + Root Cause */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Drift Heatmap */}
        <div className="card animate-[fadeIn_.4s_ease-in-out]">
          <div className="card-header flex items-center justify-between">
            <div>
              <h3 className="card-title">Drift Heatmap</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">7-day agent deviation grid</p>
            </div>
            <span className="bg-[var(--bg-primary)] text-[var(--text-secondary)] text-xs px-3 py-1 rounded-full font-medium">Last 7 Days</span>
          </div>
          <div className="p-6">
            <EmptyState
              title="Sufficient Baseline Pending"
              description="Not enough live interaction data points gathered over the 7-day trailing edge to compute accurate multi-agent drift topology."
              className="py-10"
            />
          </div>
        </div>

        {/* Root Cause Breakdown */}
        <div className="card animate-[fadeIn_.4s_ease-in-out]">
          <div className="card-header">
            <h3 className="card-title">Root Cause Breakdown</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Top attribution factors · 30d</p>
          </div>
          <div className="p-6 space-y-4">
            {[
              { label: "Prompt Injection Attempt", pct: 34, color: "bg-[var(--danger)]" },
              { label: "Context Window Overflow", pct: 22, color: "bg-[var(--warning)]" },
              { label: "Hallucination — Factual", pct: 18, color: "bg-[var(--accent)]" },
              { label: "Policy Boundary Violation", pct: 14, color: "bg-[var(--warning)]" },
              { label: "Latency Degradation", pct: 8, color: "bg-[var(--text-muted)]" },
              { label: "Unknown / Other", pct: 4, color: "bg-[var(--border-secondary)]" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{item.label}</span>
                  <span className="text-sm font-mono font-semibold text-[var(--text-primary)]">{item.pct}%</span>
                </div>
                <div className="h-[6px] rounded-full bg-[var(--bg-primary)] overflow-hidden shadow-inner">
                  <div className={`h-full rounded-full ${item.color} shadow-sm`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 2: Model Confidence + Escalation Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Model Confidence Distribution */}
        <div className="card animate-[fadeIn_.4s_ease-in-out]">
          <div className="card-header">
            <h3 className="card-title">Model Confidence Distribution</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Response certainty histogram · 24h</p>
          </div>
          <div className="p-6">
            {/* Bar Chart */}
            <div className="flex items-end gap-2 h-40 mb-4">
              {[
                { range: "0–20", count: 3, pct: 7.5 },
                { range: "20–40", count: 8, pct: 20 },
                { range: "40–60", count: 15, pct: 37.5 },
                { range: "60–80", count: 42, pct: 100 },
                { range: "80–90", count: 38, pct: 90 },
                { range: "90–95", count: 28, pct: 67 },
                { range: "95–100", count: 12, pct: 28.5 },
              ].map((bar) => (
                <div key={bar.range} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)]">{bar.count}</span>
                  <div
                    className="w-full bg-[var(--accent)]/80 rounded-t-md transition-all duration-300"
                    style={{ height: `${bar.pct}%`, minHeight: "4px" }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {["0–20", "20–40", "40–60", "60–80", "80–90", "90–95", "95–100"].map((r) => (
                <div key={r} className="flex-1 text-center text-[9px] font-mono text-[var(--text-secondary)]">{r}%</div>
              ))}
            </div>
            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-[var(--border-primary)] flex items-center gap-8">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-0.5">Median</div>
                <div className="text-lg font-bold text-[var(--text-primary)]">74.2%</div>
              </div>
              <div className="h-8 w-px bg-[var(--border-primary)]" />
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-0.5">P95</div>
                <div className="text-lg font-bold text-[var(--success)]">96.8%</div>
              </div>
              <div className="h-8 w-px bg-[var(--border-primary)]" />
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-0.5">Below Threshold</div>
                <div className="text-lg font-bold text-[var(--warning)]">11</div>
              </div>
            </div>
          </div>
        </div>

        {/* Escalation Flow */}
        <div className="card animate-[fadeIn_.4s_ease-in-out]">
          <div className="card-header">
            <h3 className="card-title">Escalation Flow</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Pipeline stage distribution · 30d</p>
          </div>
          <div className="p-6 space-y-3">
            {[
              { stage: "Input Capture", count: 12847, status: "ok" },
              { stage: "Agent Routing", count: 12841, status: "ok" },
              { stage: "Drift Detection", count: 428, status: "warn" },
              { stage: "RCA Analysis", count: 127, status: "warn" },
              { stage: "Escalation Trigger", count: 23, status: "alert" },
              { stage: "Human Review", count: 8, status: "alert" },
              { stage: "Resolution", count: 5, status: "ok" },
            ].map((item, idx) => (
              <React.Fragment key={item.stage}>
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold ${
                    item.status === "ok" ? "bg-[var(--success)]/10 text-[var(--success)]" :
                    item.status === "warn" ? "bg-[var(--warning)]/10 text-[var(--warning)]" :
                    "bg-[var(--danger)]/10 text-[var(--danger)]"
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[var(--text-primary)]">{item.stage}</div>
                  </div>
                  <div className="text-sm font-mono font-bold text-[var(--text-primary)]">{item.count.toLocaleString()}</div>
                  <div className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                    item.status === "ok" ? "bg-[var(--success)]/10 text-[var(--success)]" :
                    item.status === "warn" ? "bg-[var(--warning)]/10 text-[var(--warning)]" :
                    "bg-[var(--danger)]/10 text-[var(--danger)]"
                  }`}>
                    {item.status === "ok" ? "Normal" : item.status === "warn" ? "Elevated" : "Critical"}
                  </div>
                </div>
                {idx < 6 && (
                  <div className="ml-4 h-4 border-l-2 border-dashed border-[var(--border-primary)]" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

      </div>

      {/* Row 3: Live Evaluation Logs */}
      <div className="card overflow-hidden animate-[fadeIn_.4s_ease-in-out]">
        <div className="card-header flex items-center justify-between">
          <div>
            <h3 className="card-title">Live Evaluation Logs</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Real-time model evaluation trace</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-medium text-[#10b981]">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            Streaming
          </span>
        </div>
        <div className="p-6">
          <EmptyState
            title="Trace Stream Paused"
            description="The live evaluation socket stream is currently paused or intercepting zero transactional traffic in this environment."
            className="py-12"
          />
        </div>
      </div>

    </div>
  );
}

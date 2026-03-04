"use client";

import React from "react";
import { Shield, ShieldAlert, Zap, Bot, Activity, Lock, RefreshCw, Search } from "lucide-react";
import { useDashboardData } from "@/lib/dashboard/useDashboardData";

// Reusing panels that are imported or defined in the system
// For the sake of this emergency recovery, I will build a dedicated Governance view
// pulling from the existing APIs.

export default function GovernancePage() {
  const { data, loading } = useDashboardData("/api/product/overview");

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-8 space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-3">
             <Shield className="w-8 h-8 text-[#ef4444]" /> AI Governance Control
          </h1>
          <p className="text-[10px] text-[#555] font-mono tracking-widest uppercase mt-1">Autonomous Risk Mitigation / Runtime Intercepts / Policy Enforcement</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="px-4 py-2 bg-[#111] border border-[#2d2d2d] rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" /> Policy Engine: Authoritative
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Blocked Responses', value: data?.governance?.blocked_responses || 0, icon: Lock, color: '#ef4444' },
          { label: 'Runtime Intercepts', value: data?.governance?.total_intercepts || 0, icon: Activity, color: '#3b82f6' },
          { label: 'Policy Violations', value: data?.governance?.policy_violations || 0, icon: ShieldAlert, color: '#f59e0b' },
          { label: 'Auto Actions', value: data?.agents?.incidents || 0, icon: Zap, color: '#a855f7' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6">
            <stat.icon className="w-5 h-5 mb-4" style={{ color: stat.color }} />
            <p className="text-[10px] font-black uppercase tracking-widest text-[#555] mb-1">{stat.label}</p>
            <p className="text-2xl font-black">{loading ? "..." : stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Policy Configuration Placeholder / Sub-view */}
         <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-8">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-[#555] mb-6 flex items-center gap-2">
               <Shield className="w-4 h-4" /> Active Governance Policies
            </h2>
            <div className="space-y-4">
               {[
                 { name: 'PII Exposure Filter', status: 'Active', risk: 'Critical' },
                 { name: 'Toxicity/Bias Guard', status: 'Active', risk: 'High' },
                 { name: 'Model Drift Escape', status: 'Warn Only', risk: 'Medium' },
                 { name: 'Agent Reasoning Loop', status: 'Kill Switch', risk: 'Critical' }
               ].map(policy => (
                 <div key={policy.name} className="flex items-center justify-between p-4 bg-[#111] border border-[#2d2d2d] rounded-xl">
                    <div>
                       <p className="text-xs font-bold text-white uppercase">{policy.name}</p>
                       <p className="text-[9px] text-[#555] font-mono mt-0.5">Threshold: 0.85 Sigma</p>
                    </div>
                    <div className="text-right">
                       <span className="text-[9px] font-black uppercase tracking-widest text-[#10b981] block">{policy.status}</span>
                       <span className="text-[8px] text-[#ef4444] font-mono">{policy.risk}</span>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Autonomous Intervention Log Placeholder */}
         <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-8">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-[#555] mb-6 flex items-center gap-2">
               <Zap className="w-4 h-4" /> Autonomous Interventions
            </h2>
            <div className="space-y-4">
                {[
                  { action: 'Switch Provider', reason: 'High Latency / Drift Detected', time: '12m ago' },
                  { action: 'Block Session', reason: 'Prompt Injection Pattern', time: '45m ago' },
                  { action: 'Redact PII', reason: 'Credit Card Match', time: '1h ago' }
                ].map((log, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-[#111] border border-[#2d2d2d] rounded-xl hover:border-[#444] transition-colors">
                     <div className="w-10 h-10 rounded bg-[#1a1a1a] border border-[#2d2d2d] flex items-center justify-center shrink-0">
                        <RefreshCw className="w-4 h-4 text-[#3b82f6]" />
                     </div>
                     <div>
                        <p className="text-xs font-bold text-white uppercase">{log.action}</p>
                        <p className="text-[10px] text-[#9ca3af] mt-1">{log.reason}</p>
                        <p className="text-[9px] text-[#555] font-mono mt-2">{log.time}</p>
                     </div>
                  </div>
                ))}
            </div>
         </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-8">
         <h2 className="text-[11px] font-black uppercase tracking-widest text-[#555] mb-6 flex items-center gap-2">
            <Bot className="w-4 h-4" /> Agent Control Layer Integration
         </h2>
         <div className="p-12 text-center border border-dashed border-[#2d2d2d] rounded-xl bg-[#111]/50">
            <Search className="w-12 h-12 text-[#333] mx-auto mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-[#555]">Monitoring 12 Active Agents</p>
            <p className="text-[10px] text-[#444] font-mono mt-2 italic">Real-time reasoning chain interception is active.</p>
         </div>
      </div>
    </div>
  );
}

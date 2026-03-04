"use client";

import React from "react";
import AiGatewayTrafficPanel from "@/components/dashboard/AiGatewayTrafficPanel";
import { Zap, Activity, Shield, Network, GitBranch } from "lucide-react";

export default function GatewayPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-8 space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-3">
             <Zap className="w-8 h-8 text-[#3b82f6]" /> AI Gateway Controller
          </h1>
          <p className="text-[10px] text-[#555] font-mono tracking-widest uppercase mt-1">Intelligent Routing / Multi-Provider Traffic Analytics</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="px-4 py-2 bg-[#111] border border-[#2d2d2d] rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" /> Routing Brain Active
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Total Requests (24h)', value: '142.8k', icon: Activity, color: '#3b82f6' },
          { label: 'Avg Latency', value: '240ms', icon: Shield, color: '#10b981' },
          { label: 'Active Providers', value: '4', icon: Network, color: '#a855f7' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6">
            <stat.icon className="w-5 h-5 mb-4" style={{ color: stat.color }} />
            <p className="text-[10px] font-black uppercase tracking-widest text-[#555] mb-1">{stat.label}</p>
            <p className="text-2xl font-black">{stat.value}</p>
          </div>
        ))}
      </div>

      <AiGatewayTrafficPanel />

      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-8">
         <h2 className="text-[11px] font-black uppercase tracking-widest text-[#555] mb-6 flex items-center gap-2">
            <GitBranch className="w-4 h-4" /> Routing Brain Logic
         </h2>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
               <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Facttic's Routing Brain automatically selects the optimal LLM provider for each request based on a dynamic weight calculation:
               </p>
               <ul className="space-y-2">
                  {[
                    'Reliability Score (35%)',
                    'Risk Mitigation (25%)',
                    'Latency Performance (20%)',
                    'Token Cost (20%)'
                  ].map(rule => (
                    <li key={rule} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white">
                       <div className="w-1 h-1 rounded-full bg-[#3b82f6]" /> {rule}
                    </li>
                  ))}
               </ul>
            </div>
            <div className="p-6 bg-[#111] border border-[#2d2d2d] rounded-xl font-mono text-[10px] text-[#555] leading-relaxed">
               <span className="text-[#3b82f6]">const</span> score = (reliability * 0.35) + (risk * 0.25) + (latency * 0.2) + (cost * 0.2);<br/>
               <span className="text-[#3b82f6]">return</span> score {'>'} threshold ? <span className="text-[#10b981]">PROCEED</span> : <span className="text-[#ef4444]">REROUTE</span>;
            </div>
         </div>
      </div>
    </div>
  );
}

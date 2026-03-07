"use client";

import React from 'react';
import { PlayCircle, Shield, AlertCircle, Activity } from 'lucide-react';

interface SimulationWidgetProps {
  data: any;
  loading: boolean;
}

export default function SimulationWidget({ data, loading }: SimulationWidgetProps) {
  if (loading) return (
    <div className="bg-[#151515] border border-[#2d2d2d] rounded-3xl p-8 h-[300px] animate-pulse flex items-center justify-center">
      <Activity className="w-8 h-8 text-[#333] animate-spin" />
    </div>
  );

  const runs = data?.runs || [];
  const totalRisk = runs.reduce((acc: number, run: any) => acc + (run.risk_score || 0), 0);
  const avgRisk = runs.length > 0 ? Math.round(totalRisk / runs.length) : 0;

  return (
    <div className="bg-[#151515] border border-[#2d2d2d] rounded-3xl p-8 flex flex-col justify-between group overflow-hidden relative">
      <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <PlayCircle className="w-24 h-24" />
      </div>

      <div>
        <h3 className="text-xs font-black uppercase tracking-widest text-[#555] mb-6 flex items-center gap-2">
          <PlayCircle className="w-4 h-4 text-emerald-500" /> Simulation Activity
        </h3>
        
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-4xl font-black text-white">{runs.length}</div>
            <div className="text-[10px] font-black text-[#555] uppercase tracking-widest mt-1">LAST HOUR</div>
          </div>
          <div className="text-right">
            <div className={`text-xl font-black ${avgRisk > 50 ? 'text-orange-500' : 'text-emerald-500'}`}>{avgRisk}%</div>
            <div className="text-[9px] font-black text-[#555] uppercase tracking-widest mt-1">AVG INTENSITY</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {runs.slice(0, 3).map((run: any, i: number) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#111] border border-[#222]">
            <div className="flex items-center gap-3">
               <Shield className={`w-3 h-3 ${run.risk_score > 50 ? 'text-red-500' : 'text-emerald-500'}`} />
               <span className="text-[10px] font-bold text-white uppercase tracking-tight truncate max-w-[120px]">
                 {run.scenario_name}
               </span>
            </div>
            <span className="text-[9px] font-mono text-[#444]">
              {new Date(run.executed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {runs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-20 text-[10px] font-black text-[#333] uppercase border border-dashed border-[#222] rounded-xl">
            No active runs
          </div>
        )}
      </div>
    </div>
  );
}

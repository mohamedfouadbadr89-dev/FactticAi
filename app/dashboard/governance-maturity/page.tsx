'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Target, 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  ChevronRight,
  Info,
  Hexagon
} from 'lucide-react';

interface MaturityData {
  current: {
    policy_coverage: number;
    risk_stability: number;
    incident_response_score: number;
    maturity_score: number;
  };
  history: any[];
}

export default function GovernanceMaturityDashboard() {
  const [data, setData] = useState<MaturityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMaturity() {
      try {
        // Using a test org ID for display
        const res = await fetch('/api/governance/maturity?orgId=b1cd74b0-c081-4228-9844-325d74291f09');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to fetch maturity', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMaturity();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
    </div>
  );

  const pillars = [
    { label: 'Policy Coverage', value: data?.current.policy_coverage, icon: ShieldCheck, color: 'text-blue-400' },
    { label: 'Risk Stability', value: data?.current.risk_stability, icon: Target, color: 'text-emerald-400' },
    { label: 'Incident Response', value: data?.current.incident_response_score, icon: Zap, color: 'text-amber-400' }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white p-10 font-sans">
      <header className="mb-16 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Executive Intelligence</span>
          </div>
          <h1 className="text-7xl font-black uppercase tracking-tighter italic leading-none">Governance Maturity</h1>
          <p className="text-slate-500 mt-6 max-w-xl text-sm font-medium">
            Quantifying organizational effectiveness across institutional 
            governance pillars. Verified via deterministic risk audit logs.
          </p>
        </div>
        
        <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2rem] text-center">
          <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest mb-2">Global Maturity Index</p>
          <p className="text-6xl font-black italic text-amber-500">{data?.current.maturity_score}</p>
          <div className="mt-4 flex items-center gap-2 justify-center text-emerald-500 text-[10px] font-bold">
            <TrendingUp className="w-3 h-3" /> +12.4% GROWTH
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        {pillars.map((pillar, i) => (
          <div key={i} className="bg-[#0a0a0a] border border-white/5 p-10 rounded-[3rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <pillar.icon className="w-32 h-32" />
            </div>
            <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 w-fit mb-8 ${pillar.color}`}>
              <pillar.icon className="w-6 h-6" />
            </div>
            <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">{pillar.label}</h3>
            <div className="flex items-baseline gap-4">
              <span className="text-5xl font-black italic tracking-tighter">{pillar.value}%</span>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${pillar.value}%` }}
                  transition={{ duration: 1.5, delay: i * 0.2 }}
                  className={`h-full ${pillar.color.replace('text-', 'bg-')}`}
                ></motion.div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-12">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Maturity Progression
            </h3>
            <div className="text-[10px] font-bold text-slate-500 flex gap-4">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> SCORE</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-white/10"></div> BENCHMARK</span>
            </div>
          </div>
          
          <div className="h-[250px] flex items-end gap-6">
            {(data?.history || []).reverse().map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${h.maturity_score}%` }}
                  className="w-full bg-gradient-to-t from-amber-500/0 via-amber-500/10 to-amber-500 rounded-t-xl relative border-t border-amber-500/50"
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black italic">
                    {h.maturity_score}
                  </div>
                </motion.div>
                <span className="text-[8px] font-bold text-slate-700 uppercase">
                  {new Date(h.calculated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-amber-500 text-black p-12 rounded-[3rem] relative overflow-hidden">
            <Hexagon className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10" />
            <h3 className="text-xs font-black uppercase tracking-widest mb-4 opacity-70 italic">Strategy Recommendation</h3>
            <p className="text-2xl font-black tracking-tight leading-tight mb-8">
              Increase policy coverage to 85% to reach "Institutional Leader" status.
            </p>
            <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest group">
              View Growth Plan <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 p-12 rounded-[3rem]">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <Info className="w-4 h-4" /> Maturity Baseline
            </h3>
            <ul className="space-y-4">
              {[
                { label: 'Standard', threshold: '0-30', status: 'Laggard' },
                { label: 'Managed', threshold: '31-60', status: 'Rising' },
                { label: 'Optimized', threshold: '61-85', status: 'Leader' },
                { label: 'Facttic Elite', threshold: '86-100', status: 'Auth' }
              ].map((b, i) => (
                <li key={i} className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-slate-500">{b.label}</span>
                  <span className="text-slate-300">{b.threshold}</span>
                  <span className="text-amber-500 italic uppercase tracking-widest">{b.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

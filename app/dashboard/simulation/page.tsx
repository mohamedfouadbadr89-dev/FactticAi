'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Terminal, 
  Zap, 
  ShieldAlert, 
  Bug, 
  Info,
  ChevronRight,
  Database,
  Search,
  AlertCircle
} from 'lucide-react';

interface SimulationRun {
  id: string;
  scenario_name: string;
  input_prompt: string;
  model_response: string;
  risk_score: number;
  executed_at: string;
}

export default function SimulationDashboard() {
  const [runs, setRuns] = useState<SimulationRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeLog, setActiveLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setActiveLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-10));
  };

  const runSimulation = async (scenario: string) => {
    setLoading(true);
    addLog(`INITIALIZING SCENARIO: ${scenario.toUpperCase()}`);
    
    try {
      const res = await fetch('/api/simulation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario })
      });
      
      const data = await res.json();
      
      if (data.result) {
        addLog(`SCENARIO EXECUTED: RISK_SCORE=${data.result.risk_score}`);
        setRuns(prev => [data.result, ...prev]);
      }
    } catch (err) {
      addLog(`ERROR: Simulation failed to connect`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    addLog("SIMULATION ENGINE READY");
    addLog("AWAITING SCENARIO SELECTION...");
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-10 font-sans">
      {/* Header */}
      <header className="mb-12 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Synthetic Testing Lab</span>
          </div>
          <h1 className="text-6xl font-black uppercase tracking-tighter italic leading-none">Scenario Engine</h1>
          <p className="text-slate-500 mt-4 max-w-xl text-sm font-medium">
            Execute synthetic interaction scenarios to stress-test your governance models. 
            Simulate policy violations, hallucinations, and adversarial attacks in a controlled sandbox.
          </p>
        </div>
        
        <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Engine Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-emerald-400">OPERATIONAL</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Controls & Scenarios */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2rem]">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-8">Execute Scenario</h3>
            <div className="space-y-4">
              {[
                { id: 'policy_violation', label: 'Policy Violation', icon: ShieldAlert, color: 'text-red-400' },
                { id: 'hallucination', label: 'Hallucination', icon: Bug, color: 'text-amber-400' },
                { id: 'prompt_injection', label: 'Prompt Injection', icon: AlertCircle, color: 'text-fuchsia-400' }
              ].map(scenario => (
                <button 
                  key={scenario.id}
                  onClick={() => runSimulation(scenario.id)}
                  disabled={loading}
                  className="w-full group flex items-center justify-between p-6 bg-white/[0.03] border border-white/5 hover:border-white/20 rounded-2xl transition-all"
                >
                  <div className="flex items-center gap-4">
                    <scenario.icon className={`w-5 h-5 ${scenario.color}`} />
                    <span className="text-xs font-black uppercase tracking-widest">{scenario.label}</span>
                  </div>
                  <Play className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2rem]">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <Terminal className="w-4 h-4" /> Live Log Output
            </h3>
            <div className="font-mono text-[10px] space-y-2 bg-black/40 p-6 rounded-xl border border-white/5 h-48 overflow-y-auto">
              <AnimatePresence>
                {activeLog.map((log, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-slate-400 leading-relaxed"
                  >
                    {log}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="lg:col-span-8 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden">
          <div className="p-8 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Execution History</h3>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input 
                  type="text" 
                  placeholder="SEARCH RUNS..." 
                  className="bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-left bg-white/[0.01]">
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Scenario</th>
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Input Preview</th>
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk</th>
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {runs.length === 0 ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="border-b border-white/[0.02]">
                      <td colSpan={4} className="p-6 text-center">
                        <div className="h-4 bg-white/5 animate-pulse rounded-lg w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  runs.map((run, i) => (
                    <motion.tr 
                      key={run.id || i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-all group"
                    >
                      <td className="p-6">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                          {run.scenario_name.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-6 max-w-xs overflow-hidden">
                        <p className="text-xs font-medium text-slate-400 truncate italic">"{run.input_prompt}"</p>
                      </td>
                      <td className="p-6">
                        <span className={`text-xs font-black italic ${
                          run.risk_score > 0.8 ? 'text-red-400' : 'text-amber-400'
                        }`}>
                          {run.risk_score.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <span className="text-[10px] font-mono text-slate-600 uppercase tracking-tighter">
                          {new Date(run.executed_at).toLocaleTimeString()}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from 'react';
import ScenarioSelector from '@/components/simulation/ScenarioSelector';
import { PlayCircle, ShieldCheck, Terminal, CheckCircle2, History, Database } from 'lucide-react';

export default function SimulationPage() {
  const [loading, setLoading] = useState(false);
  const [scenarioId, setScenarioId] = useState('hallucination');
  const [volume, setVolume] = useState(5);
  const [logs, setLogs] = useState<any[]>([]);

  const handleRunSimulation = async () => {
    setLoading(true);
    setLogs([]);
    try {
      const res = await fetch('/api/simulation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenarioId, volume, org_id: 'dbad3ca2-3907-4279-9941-8f55c3c0efdc' })
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6 lg:p-12">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <PlayCircle className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase">Traffic Simulation Lab</h1>
              <p className="text-[var(--text-secondary)] text-sm font-medium">Generate synthetic governance data to test system resilience.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              Persisting to Ledger
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls */}
          <div className="lg:col-span-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[2.5rem] p-8 shadow-sm">
            <ScenarioSelector 
              selectedId={scenarioId}
              onSelect={setScenarioId}
              volume={volume}
              onVolumeChange={setVolume}
              onRun={handleRunSimulation}
              loading={loading}
            />
          </div>

          {/* Results Console */}
          <div className="lg:col-span-8 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col min-h-[600px]">
            <div className="px-8 py-6 border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-primary)]/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <Terminal className="w-4 h-4 text-[var(--accent)]" />
                <h2 className="text-[10px] font-black uppercase tracking-widest">Simulation Logs</h2>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${loading ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                  {loading ? 'Processing Batch...' : 'Engine Ready'}
                </span>
              </div>
            </div>

            <div className="flex-1 p-8 font-mono text-xs overflow-y-auto max-h-[500px] space-y-2">
              {logs.length === 0 && !loading && (
                <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] opacity-50 text-center space-y-4 italic">
                  <History className="w-12 h-12 mb-2" />
                  <p>No active simulation data.<br/>Select a scenario to begin generation.</p>
                </div>
              )}
              
              {loading && Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-3 rounded-xl bg-black/5 animate-pulse border border-white/5">
                   <div className="w-24 h-4 bg-white/5 rounded" />
                   <div className="flex-1 h-4 bg-white/5 rounded" />
                </div>
              ))}

              {logs.map((log, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] animate-in slide-in-from-left-2 duration-300">
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <span className={`w-1.5 h-1.5 rounded-full ${log.decision === 'ALLOW' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className={`font-black tracking-tight ${log.decision === 'ALLOW' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {log.decision}
                    </span>
                  </div>
                  <div className="flex-1 text-[var(--text-secondary)] overflow-hidden text-ellipsis whitespace-nowrap">
                    {log.prompt}
                  </div>
                  <div className="text-[var(--accent)] font-bold">
                    {log.risk}% RISK
                  </div>
                </div>
              ))}
            </div>

            {logs.length > 0 && (
              <div className="p-8 bg-[var(--bg-primary)]/30 border-t border-[var(--border-primary)] flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="space-y-1">
                    <div className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Total Processed</div>
                    <div className="text-xl font-black">{logs.length}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Anomalies Detected</div>
                    <div className="text-xl font-black text-red-500">
                      {logs.filter(l => l.decision !== 'ALLOW').length}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Audit Ledger Updated
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

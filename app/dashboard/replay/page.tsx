"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

interface ReplayEvent {
  timestamp: string;
  event_type: string;
  content: string;
  risk_score: number;
}

interface ReplayData {
  session_id: string;
  timeline: ReplayEvent[];
  risk_summary: {
    total_events: number;
    risk_peaks_count: number;
    policy_triggers_count: number;
    critical_indices: string[];
  };
}

interface RcaResult {
  root_cause: string;
  causal_chain: string[];
  confidence_score: number;
}

function RootCauseVisualization({ sessionId }: { sessionId: string }) {
  const [rca, setRca] = useState<RcaResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRca() {
      try {
        const res = await fetch(`/api/forensics/rca-graph/${sessionId}`);
        if (res.ok) {
          const json = await res.json();
          setRca(json);
        }
      } catch (err) {
        console.error('RCA fetch failed:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRca();
  }, [sessionId]);

  if (loading) return <div className="p-4 bg-white/5 rounded-xl border border-white/10 animate-pulse text-[10px] text-slate-500 uppercase font-mono">Calculating causal graph...</div>;
  if (!rca) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-6 mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Root Cause Visualization</h2>
          <p className="text-xl font-black text-white uppercase tracking-tighter">
            Primary Driver: <span className="text-indigo-400">{rca.root_cause.replace('_', ' ')}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Causal Confidence</p>
          <p className="text-lg font-mono font-black text-white">{(rca.confidence_score * 100).toFixed(0)}%</p>
        </div>
      </div>

      <div className="relative flex items-center justify-between gap-4 mt-8">
        {/* Horizontal Connector Line */}
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-indigo-500/20 -translate-y-1/2 -z-0" />
        
        {rca.causal_chain.slice(0, 4).map((node, idx) => (
          <div key={idx} className="relative z-10 flex flex-col items-center group">
            <div className={`w-3 h-3 rounded-full mb-3 border-2 transition-all group-hover:scale-150 ${
              idx === 0 ? 'bg-indigo-400 border-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.5)]' : 'bg-slate-900 border-indigo-500/50'
            }`} />
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter bg-slate-900 px-2 py-0.5 rounded border border-white/5 opacity-80 group-hover:opacity-100 group-hover:text-white transition-all whitespace-nowrap">
              {node.replace('_', ' ')}
            </span>
          </div>
        ))}
        
        {rca.causal_chain.length > 4 && (
          <span className="text-[10px] text-slate-600 font-mono">+ {rca.causal_chain.length - 4} more</span>
        )}
      </div>
    </motion.div>
  );
}

function SessionReplayContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const [data, setData] = useState<ReplayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [integrityStatus, setIntegrityStatus] = useState<{ intact: boolean; checked: boolean }>({ intact: true, checked: false });

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    async function fetchReplay() {
      try {
        const res = await fetch(`/api/replay/session/${sessionId}`);
        if (!res.ok) throw new Error('Failed to fetch session replay');
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    async function fetchIntegrity() {
      try {
        const res = await fetch(`/api/security/session-integrity/${sessionId}`);
        if (res.ok) {
          const json = await res.json();
          setIntegrityStatus({ intact: json.intact, checked: true });
        }
      } catch (err) {
        console.error('Integrity check failed:', err);
      }
    }

    fetchReplay();
    fetchIntegrity();
  }, [sessionId]);

  if (loading) return <div className="p-8 text-slate-400">Reconstructing timeline...</div>;
  if (!sessionId) return <div className="p-8 text-red-400">No session ID provided. Please select a session from the dashboard.</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 p-8 font-sans">
      <header className="mb-8 border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          Session Forensic Replay
        </h1>
        <p className="text-slate-500 mt-2 font-mono text-sm">Target ID: {sessionId}</p>
        
        {integrityStatus.checked && !integrityStatus.intact && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-4 text-red-400"
          >
            <div className="p-2 bg-red-500 rounded-full">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tighter text-sm">Forensic Integrity Failure</h3>
              <p className="text-[10px] font-mono opacity-80 uppercase leading-tight">
                Stored checksum mismatch detected. This session timeline has been modified after initial capture.
              </p>
            </div>
            <div className="ml-auto">
              <span className="text-[9px] font-bold border border-red-500/30 px-2 py-1 rounded uppercase tracking-widest">Tamper Signal: High</span>
            </div>
          </motion.div>
        )}
      </header>

      {sessionId && <RootCauseVisualization sessionId={sessionId} />}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Risk Summary Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#111] border border-slate-800 p-6 rounded-xl">
            <h2 className="text-slate-400 uppercase tracking-widest text-xs font-semibold mb-4">Risk Summary</h2>
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-500">Total Events</span>
              <span className="text-blue-400 font-mono">{data?.risk_summary.total_events}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-500">Risk Peaks</span>
              <span className={`font-mono ${data?.risk_summary.risk_peaks_count || 0 > 0 ? 'text-orange-400' : 'text-slate-600'}`}>
                {data?.risk_summary.risk_peaks_count}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Policy Triggers</span>
              <span className={`font-mono ${data?.risk_summary.policy_triggers_count || 0 > 0 ? 'text-red-400' : 'text-slate-600'}`}>
                {data?.risk_summary.policy_triggers_count}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline Visualization */}
        <div className="lg:col-span-3">
          <div className="space-y-4">
            {data?.timeline.map((event, idx) => (
              <div 
                key={idx} 
                className={`relative p-5 rounded-xl border transition-all hover:border-slate-600 ${
                  event.risk_score > 70 
                    ? 'bg-orange-950/20 border-orange-900/50 shadow-lg shadow-orange-900/10' 
                    : event.event_type === 'policy_violation'
                    ? 'bg-red-950/20 border-red-900/50'
                    : 'bg-[#0a0a0a] border-slate-900'
                }`}
              >
                {/* Visual Connector Line */}
                {idx < data.timeline.length - 1 && (
                  <div className="absolute left-[34px] top-full h-4 w-[1px] bg-slate-800"></div>
                )}

                <div className="flex items-start gap-5">
                  <div className="flex flex-col items-center pt-1">
                    <div className={`w-3 h-3 rounded-full ${
                      event.risk_score > 70 ? 'bg-orange-500 animate-pulse' : 
                      event.event_type === 'policy_violation' ? 'bg-red-500' : 'bg-slate-700'
                    }`}></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-500 text-xs font-mono">{new Date(event.timestamp).toLocaleTimeString()}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                        event.risk_score > 70 ? 'border-orange-500 text-orange-400 bg-orange-500/10' :
                        event.event_type === 'policy_violation' ? 'border-red-500 text-red-400 bg-red-500/10' :
                        'border-slate-800 text-slate-500 bg-slate-900'
                      }`}>
                        {event.event_type}
                      </span>
                    </div>

                    <div className="text-slate-300 text-sm leading-relaxed truncate max-w-2xl">
                      {event.content}
                    </div>

                    {event.risk_score > 0 && (
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1 h-1 bg-slate-900 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              event.risk_score > 70 ? 'bg-orange-500' : 'bg-blue-500/60'
                            }`}
                            style={{ width: `${event.risk_score}%` }}
                          ></div>
                        </div>
                        <span className={`text-[10px] font-mono ${event.risk_score > 70 ? 'text-orange-400' : 'text-slate-500'}`}>
                          Risk: {event.risk_score}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {data?.timeline.length === 0 && (
              <div className="text-center py-20 bg-[#0a0a0a] border border-dashed border-slate-800 rounded-2xl">
                <p className="text-slate-600">No events found in conversation timeline.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SessionReplayPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading forensic environment...</div>}>
      <SessionReplayContent />
    </Suspense>
  );
}

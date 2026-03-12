"use client";

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Trash2, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabaseServer } from '@/lib/supabaseServer';

interface RetentionPolicy {
  org_id: string;
  table_name: string;
  retention_days: number;
}

interface ErasureRequest {
  id: string;
  session_id: string;
  request_status: string;
  requested_at: string;
  processed_at: string | null;
  error_message: string | null;
}

export default function DataGovernancePage() {
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [requests, setRequests] = useState<ErasureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionIdToErase, setSessionIdToErase] = useState('');
  const [erasing, setErasing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch Policies
      const { data: pData } = await (supabaseServer as any).from('data_retention_policies').select('*');
      setPolicies(pData || []);

      // Fetch Requests
      const { data: rData } = await (supabaseServer as any).from('gdpr_erasure_requests').select('*').order('requested_at', { ascending: false });
      setRequests(rData || []);
    } catch (err) {
      console.error('Failed to fetch governance data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleErase = async () => {
    if (!sessionIdToErase) return;
    setErasing(true);
    setMessage(null);

    try {
      const res = await fetch('/api/governance/gdpr-erase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionIdToErase })
      });

      const json = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Session successfully erased from the platform.' });
        setSessionIdToErase('');
        fetchData();
      } else {
        setMessage({ type: 'error', text: json.error || 'Erasure failed.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setErasing(false);
    }
  };

  return (
    <div className="p-8 bg-[var(--bg-primary)] min-h-screen text-[var(--text-primary)]">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="text-emerald-400 w-8 h-8" />
          <h1 className="text-3xl font-black uppercase tracking-tighter">Data Governance Layer</h1>
        </div>
        <p className="text-[var(--text-primary)] max-w-2xl">
          Enforce institutional compliance via deterministic data retention policies and coordinated right-to-erasure workflows.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Retention Policies */}
        <div className="glass-card p-6 border border-[var(--border-primary)] rounded-2xl bg-[var(--bg-secondary)]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Retention Policies
            </h2>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded font-mono uppercase font-bold tracking-widest">Active</span>
          </div>

          <div className="space-y-4">
            {policies.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-sm font-mono italic">No custom retention policies defined.</p>
            ) : (
              policies.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl">
                  <div>
                    <p className="text-[var(--text-primary)] font-bold font-mono text-sm">{p.table_name}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">Registry Table</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-black text-xl">{p.retention_days} Days</p>
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">Expiration Window</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* GDPR Erasure Control */}
        <div className="glass-card p-6 border border-[var(--border-primary)] rounded-2xl bg-[var(--bg-secondary)]">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-8">
            <Trash2 className="w-5 h-5 text-red-400" />
            Right-to-Erasure Trigger
          </h2>

          <div className="space-y-6">
            <div className="p-4 bg-red-400/5 border border-red-400/20 rounded-xl flex gap-3">
              <AlertTriangle className="text-red-400 w-5 h-5 shrink-0" />
              <p className="text-xs text-red-200 leading-relaxed font-mono uppercase tracking-tighter">
                Warning: Deterministic session erasure is IRREVERSIBLE. This will purge all timeline events, evaluations, and messages linked to the provided Session ID across all intelligence engines.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Target Session ID</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={sessionIdToErase}
                  onChange={(e) => setSessionIdToErase(e.target.value)}
                  placeholder="Enter UUID..."
                  className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-4 py-2 font-mono text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button 
                  onClick={handleErase}
                  disabled={erasing || !sessionIdToErase}
                  className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-2 rounded-lg text-sm transition-all flex items-center gap-2"
                >
                  {erasing ? 'Purging...' : 'Execute Erasure'}
                </button>
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-xs font-mono font-bold border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                {message.type === 'success' ? '✔ ' : '✘ '} {message.text}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Erasure Request History */}
      <section className="mt-12">
        <h2 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] mb-6">Erasure Request History</h2>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-primary)] text-[10px] uppercase font-mono text-[var(--text-secondary)] tracking-widest border-b border-[var(--border-primary)]">
                <th className="p-4">Session ID</th>
                <th className="p-4">Requested At</th>
                <th className="p-4">Processed At</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm font-mono">
              {requests.map((r, idx) => (
                <tr key={idx} className="border-b border-slate-900 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 text-[var(--text-primary)]">{r.session_id}</td>
                  <td className="p-4 text-[var(--text-secondary)]">{new Date(r.requested_at).toLocaleString()}</td>
                  <td className="p-4 text-[var(--text-secondary)]">{r.processed_at ? new Date(r.processed_at).toLocaleString() : '-'}</td>
                  <td className="p-4">
                    <span className={`flex items-center gap-1.5 font-bold uppercase text-[10px] px-2 py-1 rounded-full ${
                      r.request_status === 'PROCESSED' ? 'text-emerald-400 bg-emerald-400/10' :
                      r.request_status === 'FAILED' ? 'text-red-400 bg-red-400/10' :
                      'text-blue-400 bg-blue-400/10'
                    }`}>
                      {r.request_status === 'PROCESSED' ? <CheckCircle className="w-3 h-3" /> : 
                       r.request_status === 'FAILED' ? <XCircle className="w-3 h-3" /> : 
                       <Clock className="w-3 h-3" />}
                      {r.request_status}
                    </span>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-[var(--text-secondary)] italic">No erasure requests found in registry.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <style jsx>{`
        .glass-card {
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }
      `}</style>
    </div>
  );
}

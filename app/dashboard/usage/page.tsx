"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Binary, ShieldAlert, Zap, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

export default function UsagePage() {
  const router = useRouter();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      const id = session?.user?.user_metadata?.org_id;
      if (id) setOrgId(id);
      else setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!orgId) return;
    fetch(`/api/dashboard/billing/usage?org_id=${orgId}`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(e => {
        console.error("Usage fetch failed", e);
        setLoading(false);
      });
  }, [orgId]);

  const metrics = [
    { label: 'Interactions Used', value: data?.interactions || 0, icon: MessageSquareIcon, color: 'text-[var(--accent)]', sub: 'Calculated Sessions' },
    { label: 'Token Consumption', value: (data?.tokens || 0).toLocaleString(), icon: Binary, color: 'text-purple-400', sub: 'Governance Overhead' },
    { label: 'Risk Evaluations', value: data?.evaluations || 0, icon: ShieldAlert, color: 'text-[var(--warning)]', sub: 'Deterministic Runs' },
    { label: 'Policy Alerts', value: data?.alerts || 0, icon: Zap, color: 'text-[var(--danger)]', sub: 'Executive Escalations' }
  ];

  return (
    <div className="p-10 space-y-12">
      <header className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-[var(--accent)] mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Operational Telemetry</span>
          </div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
            Governance Usage
          </h1>
        </div>
        <button onClick={() => router.push('/dashboard/billing')} className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] hover:underline">Billing →</button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {metrics.map(m => (
          <div key={m.label} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[2rem] p-8 space-y-6 relative overflow-hidden group">
            <div className={`p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] inline-block ${m.color}`}>
              <m.icon className="w-5 h-5" />
            </div>
            
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-1">{m.label}</p>
              <h2 className="text-4xl font-black tracking-tighter text-[var(--text-primary)]">
                {loading ? '---' : m.value}
              </h2>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-primary)]">
               <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-40">{m.sub}</span>
               {m.label === 'Interactions Used' && <span className="flex items-center gap-1 text-[var(--success)] text-[9px] font-black uppercase"><ArrowUpRight className="w-3 h-3" /> 12%</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[2.5rem] p-10 space-y-8">
        <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">Consumption Velocity</h3>
        <div className="h-64 flex items-end gap-2 px-4 border-l border-b border-[var(--border-primary)] relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <BarChart3 className="w-32 h-32" />
          </div>
          {[40, 65, 30, 85, 45, 90, 20, 55, 75, 40, 60, 35].map((h, i) => (
            <div key={i} className="flex-1 bg-[var(--accent)]/20 hover:bg-[var(--accent)] transition-all rounded-t-sm" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-30 mt-4 px-4">
           <span>00:00</span>
           <span>Last 24 Hours Metrics Aggregation</span>
           <span>Current</span>
        </div>
      </div>
    </div>
  );
}

function MessageSquareIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

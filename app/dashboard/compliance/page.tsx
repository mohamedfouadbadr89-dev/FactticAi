'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Eye, 
  Lock, 
  AlertTriangle,
  Fingerprint,
  BarChart3,
  Calendar,
  Filter,
  RefreshCw,
  Download,
  Database
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { logger } from '@/lib/logger';
import { createBrowserClient } from '@supabase/ssr';

interface ComplianceSignal {
  id: string;
  session_id: string;
  pii_detected: boolean;
  sensitive_entities: Record<string, number>;
  compliance_risk_score: number;
  created_at: string;
}

interface LedgerEvent {
  id: string;
  event_type: string;
  event_payload: any;
  created_at: string;
}

export default function ComplianceDashboard() {
  const router = useRouter();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [signals, setSignals] = useState<ComplianceSignal[]>([]);
  const [ledgerEvents, setLedgerEvents] = useState<LedgerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

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

  const fetchData = async (id: string) => {
    setLoading(true);
    try {
      const [signalsRes, ledgerRes] = await Promise.all([
        fetch(`/api/compliance/signals?org_id=${id}&limit=50`),
        fetch(`/api/compliance/ledger?org_id=${id}&limit=50`)
      ]);

      const signalsData = await signalsRes.json();
      const ledgerData = await ledgerRes.json();

      setSignals(signalsData.signals || []);
      setLedgerEvents(ledgerData.events || []);
    } catch (err: any) {
      logger.error('COMPLIANCE_DASHBOARD_FETCH_FAILED', { error: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) fetchData(orgId);
  }, [orgId]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/compliance/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId!,
          types: ['ledger', 'compliance', 'risk'],
          format: 'JSON',
          date_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          date_end: new Date().toISOString()
        })
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Compliance_Audit_${orgId}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      logger.error('COMPLIANCE_EXPORT_FAILED', { error: err.message });
    } finally {
      setExporting(false);
    }
  };

  // Derived Data for Charts
  const riskTrend = useMemo(() => {
    return signals.slice().reverse().map(s => ({
      time: new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      risk: s.compliance_risk_score
    }));
  }, [signals]);

  const entityFrequency = useMemo(() => {
    const freq: Record<string, number> = {};
    signals.forEach(s => {
      Object.entries(s.sensitive_entities || {}).forEach(([type, count]) => {
        freq[type] = (freq[type] || 0) + count;
      });
    });
    return Object.entries(freq).map(([name, value]) => ({ name, value }));
  }, [signals]);

  const totalLeaks = signals.filter(s => s.pii_detected).length;
  const avgRisk = signals.length > 0 
    ? Math.round(signals.reduce((sum, s) => sum + s.compliance_risk_score, 0) / signals.length)
    : 0;

  const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-10 font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 flex justify-between items-end"
      >
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">Compliance Intel v2.1 (LIVE)</span>
          </div>
          <h1 className="text-6xl font-black uppercase tracking-tighter italic leading-none">PII Surveillance</h1>
          <p className="text-[var(--text-secondary)] mt-4 max-w-xl text-sm font-medium">
            Real-time monitoring of sensitive data leakage across model endpoints. 
            Automated detection of emails, credentials, and institutional identifiers.
          </p>
        </div>
        
        <div className="flex gap-4 items-center">
          <button onClick={() => router.push('/dashboard/alerts')} className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] hover:underline">Alerts →</button>
          <button onClick={() => router.push('/dashboard/incidents')} className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] hover:underline">Incidents →</button>
          <button
            onClick={() => { if (orgId) fetchData(orgId); }}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all uppercase tracking-widest disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Sync Telemetry
          </button>
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-5 py-3 bg-cyan-500 text-black rounded-xl text-xs font-black hover:bg-cyan-400 transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50"
          >
            {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />} 
            Export Evidence
          </button>
        </div>
      </motion.header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Exposed Sessions', value: totalLeaks, color: 'text-red-400', icon: ShieldAlert, sub: 'High risk' },
          { label: 'Compliance Health', value: `${100 - avgRisk}%`, color: 'text-emerald-400', icon: Lock, sub: 'Risk avg' },
          { label: 'Signal Velocity', value: signals.length, color: 'text-amber-400', icon: Eye, sub: 'Active signals' },
          { label: 'Ledger Depth', value: ledgerEvents.length, color: 'text-white', icon: Database, sub: 'Audit blocks' }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="group relative bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-8 rounded-[2rem] overflow-hidden hover:border-cyan-500/30 transition-all duration-500"
          >
            <div className="absolute -right-4 -top-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon size={80} />
            </div>
            <p className="text-[10px] uppercase font-black text-[var(--text-secondary)] tracking-[0.2em] mb-4">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-black italic uppercase ${stat.color}`}>{stat.value}</span>
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">{stat.sub}</span>
            </div>
            <div className="mt-4 h-1 w-12 bg-white/10 rounded-full group-hover:w-full transition-all duration-700 overflow-hidden">
               <div className={`h-full bg-current ${stat.color.replace('text', 'bg')}`} style={{width: i === 1 ? `${100-avgRisk}%` : '60%'}}></div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Charts */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Risk Score Heatmap (Time Series) */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-8 rounded-[2.5rem]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">PII Risk Heatmap</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Live Stream</span>
              </div>
            </div>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={riskTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="time" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                    itemStyle={{ color: '#06b6d4', fontSize: '10px', fontWeight: 'bold' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="risk" 
                    stroke="#06b6d4" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#06b6d4', strokeWidth: 0 }} 
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Entity Frequency Bar Chart */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-8 rounded-[2.5rem]">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400 mb-8">Sensitive Entity Frequency</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={entityFrequency}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="name" stroke="#444" fontSize={9} tickLine={false} axisLine={false} interval={0} />
                    <YAxis stroke="#444" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                      {entityFrequency.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Audit Ledger List */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-8 rounded-[2.5rem] overflow-hidden">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400 mb-8">Governance Ledger Feed</h3>
               <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {ledgerEvents.map((event) => (
                    <div key={event.id} className="p-4 bg-white/[0.02] border border-[var(--border-primary)] rounded-2xl hover:bg-white/5 transition-all">
                       <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-cyan-500">{event.event_type.replace(/_/g, ' ')}</span>
                          <span className="text-[8px] font-mono text-[var(--text-secondary)]">{new Date(event.created_at).toLocaleTimeString()}</span>
                       </div>
                       <p className="text-[10px] text-[var(--text-primary)] font-medium truncate">{event.id}</p>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>

        {/* Right: Enforcement & Signals */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-gradient-to-br from-cyan-600 to-cyan-800 p-8 rounded-[2.5rem] shadow-[0_20px_40px_rgba(6,182,212,0.2)]">
             <Fingerprint size={48} className="text-black mb-6" />
             <h3 className="text-2xl font-black text-black leading-tight uppercase italic mb-2">Automated PII Safeguards</h3>
             <p className="text-black/60 text-xs font-bold leading-relaxed mb-10">
                Live compliance engine active. All detected entities are currently synchronized with the gateway interceptor for unified enforcement.
             </p>
             <button className="w-full py-4 bg-black text-cyan-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all shadow-[0_10px_20px_rgba(0,0,0,0.3)]">
                Launch Enforcement
             </button>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-8 rounded-[2rem]">
            <div className="flex items-center gap-2 mb-8">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400/60 leading-none">Signal Stream</h3>
              <div className="h-px flex-1 bg-white/5"></div>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-10">
                  <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin mx-auto" />
                </div>
              ) : signals.length === 0 ? (
                <div className="py-10 text-center border border-dashed border-[var(--border-primary)] rounded-2xl">
                   <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">No signals detected</p>
                </div>
              ) : (
                signals.slice(0, 5).map((signal) => (
                  <div key={signal.id} className="p-4 bg-white/[0.02] border border-[var(--border-primary)] rounded-2xl flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      signal.pii_detected ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'
                    }`}>
                      {signal.pii_detected ? <ShieldAlert className="w-5 h-5 text-red-400" /> : <ShieldCheck className="w-5 h-5 text-emerald-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-tight truncate italic">{signal.session_id}</p>
                      <p className="text-[8px] text-[var(--text-secondary)] font-mono">{new Date(signal.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                       <p className={`text-xs font-black italic ${signal.compliance_risk_score > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                         {signal.compliance_risk_score}
                       </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

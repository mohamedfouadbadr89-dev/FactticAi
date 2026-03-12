'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  Mic,
  PhoneCall,
  ShieldCheck,
  Activity,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Zap,
  Radio
} from 'lucide-react';
import VoiceDriftCard from '@/components/dashboard/VoiceDriftCard';

interface TelemetrySummary {
  session_id: string;
  latency_ms: number;
  packet_loss: number;
  interruptions: number;
  audio_integrity_score: number;
  created_at: string;
}

interface VoiceSession {
  id: string;
  org_id: string;
  risk_score: number;
  decision: string;
  status: string;
  created_at: string;
  turn_count?: number;
}

export default function VoicePage() {
  const router = useRouter();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<TelemetrySummary[]>([]);
  const [sessions, setSessions] = useState<VoiceSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      const id = session?.user?.user_metadata?.org_id;
      if (id) setOrgId(id);
    });
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [telRes, sessRes] = await Promise.all([
        fetch('/api/voice/telemetry'),
        fetch('/api/governance/sessions?limit=20')
      ]);

      if (telRes.ok) {
        const telJson = await telRes.json();
        setSummaries(telJson.summaries || []);
      }

      if (sessRes.ok) {
        const sessJson = await sessRes.json();
        const allSessions: VoiceSession[] = Array.isArray(sessJson)
          ? sessJson
          : (sessJson.sessions || []);
        setSessions(allSessions.slice(0, 10));
      }
    } catch (err) {
      console.error('[VoicePage]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const avgLatency = summaries.length
    ? Math.round(summaries.reduce((a, s) => a + s.latency_ms, 0) / summaries.length)
    : 0;

  const avgIntegrity = summaries.length
    ? Math.round(summaries.reduce((a, s) => a + s.audio_integrity_score, 0) / summaries.length)
    : 0;

  const totalInterruptions = summaries.reduce((a, s) => a + s.interruptions, 0);
  const avgPacketLoss = summaries.length
    ? (summaries.reduce((a, s) => a + s.packet_loss, 0) / summaries.length).toFixed(1)
    : '0.0';

  const riskColor = (score: number) =>
    score >= 70 ? 'text-red-400' : score >= 40 ? 'text-yellow-400' : 'text-emerald-400';

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-8">
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                <Mic className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-xs font-black text-purple-400 uppercase tracking-widest">
                Phase 13 // Voice Governance
              </span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Voice Intelligence Hub</h1>
            <p className="text-[var(--text-secondary)] text-sm font-medium max-w-2xl">
              Real-time governance monitoring for voice conversations across Vapi, Retell AI, and ElevenLabs.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={() => router.push('/dashboard/investigations')}
              className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] hover:underline"
            >
              Investigations →
            </button>
            <button
              onClick={() => router.push('/dashboard/forensics')}
              className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] hover:underline"
            >
              Forensics →
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-purple-500/50 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Avg Latency', value: `${avgLatency}ms`, icon: Zap, color: '#a855f7' },
          { label: 'Audio Integrity', value: `${avgIntegrity}%`, icon: Radio, color: '#10b981' },
          { label: 'Total Interruptions', value: String(totalInterruptions), icon: AlertTriangle, color: '#f59e0b' },
          { label: 'Avg Packet Loss', value: `${avgPacketLoss}%`, icon: Activity, color: '#3b82f6' },
        ].map((stat, i) => (
          <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon className="w-10 h-10" style={{ color: stat.color }} />
            </div>
            <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-black" style={{ color: stat.color }}>
              {loading ? '—' : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Drift Card */}
        <div className="lg:col-span-1">
          <VoiceDriftCard />
        </div>

        {/* Recent Sessions */}
        <div className="lg:col-span-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Recent Voice Sessions</h2>
              <p className="text-sm font-bold mt-0.5">Latest governance evaluations</p>
            </div>
            <PhoneCall className="w-4 h-4 text-purple-400" />
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-12 bg-[var(--bg-primary)] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <Mic className="w-8 h-8 text-[var(--text-secondary)] mx-auto mb-3 opacity-40" />
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                No voice sessions recorded yet
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Connect a voice provider via{' '}
                <button
                  onClick={() => router.push('/dashboard/connect')}
                  className="text-[var(--accent)] hover:underline"
                >
                  Integrations
                </button>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => router.push(`/dashboard/voice/${s.id}`)}
                  className="flex items-center justify-between p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl hover:border-purple-500/40 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold font-mono">{s.id.substring(0, 16)}…</p>
                      <p className="text-[10px] text-[var(--text-secondary)]">
                        {new Date(s.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Risk</p>
                      <p className={`text-sm font-black ${riskColor(s.risk_score || 0)}`}>
                        {Math.round(s.risk_score || 0)}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${
                      s.decision === 'BLOCK'
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}>
                      {s.decision || 'ALLOW'}
                    </div>
                    <ExternalLink className="w-3 h-3 text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Provider Status */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h2 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
            Connected Voice Providers
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {['Vapi', 'Retell AI', 'ElevenLabs', 'Bland AI', 'Pipecat'].map((provider) => (
            <div
              key={provider}
              className="flex items-center gap-2 p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
              <span className="text-xs font-bold">{provider}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[var(--text-secondary)] mt-4 font-mono">
          Configure webhook endpoints via{' '}
          <button
            onClick={() => router.push('/dashboard/connect')}
            className="text-[var(--accent)] hover:underline"
          >
            /dashboard/connect
          </button>
        </p>
      </div>
    </div>
  );
}

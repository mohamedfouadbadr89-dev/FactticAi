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
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [liveStreamEvents, setLiveStreamEvents] = useState<any[]>([]);
  const [govAlerts, setGovAlerts] = useState<any[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);

  const toggleSession = (id: string) => {
    setExpandedSession(expandedSession === id ? null : id);
  };

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      const id = session?.user?.user_metadata?.org_id;
      if (id) {
        setOrgId(id);
        
        // Listen to live stream events bridging via Supabase Realtime
        const channel1 = supabase.channel('voice_stream_events')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'voice_stream_events' },
            (payload) => {
              setLiveStreamEvents((prev) => [payload.new, ...prev].slice(0, 50));
            }
          )
          .subscribe();

        const channel2 = supabase.channel('facttic_governance_events')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'facttic_governance_events' },
            (payload) => {
              setGovAlerts((prev) => [payload.new, ...prev].slice(0, 50));
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel1);
          supabase.removeChannel(channel2);
        };
      }
    });
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data, error } = await supabase
        .from('voice_sessions')
        .select(`
          id,
          provider,
          created_at,
          voice_metrics (
            latency_ms,
            packet_loss,
            interruptions,
            audio_integrity_score
          ),
          voice_transcripts (
            transcript
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (!error && data) {
        // Map the new joined query format into our standard format
        const fetchedSummaries = data.map((d: any) => ({
          session_id: d.id,
          provider: d.provider,
          created_at: d.created_at,
          transcript: d.voice_transcripts?.[0]?.transcript,
          latency_ms: d.voice_metrics?.[0]?.latency_ms || 0,
          packet_loss: d.voice_metrics?.[0]?.packet_loss || 0,
          interruptions: d.voice_metrics?.[0]?.interruptions || 0,
          audio_integrity_score: d.voice_metrics?.[0]?.audio_integrity_score || 0
        }));
        
        setSummaries(fetchedSummaries as any);
        setSessions(fetchedSummaries as any); 
      }
      
      // Load initial stream events (last 50)
      const { data: streamData, error: streamError } = await supabase
        .from('voice_stream_events')
        .select('voice_session_id, speaker, start_ms, end_ms, transcript_delta, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (!streamError && streamData) {
        setLiveStreamEvents(streamData);
      }

      // Load initial governance alerts (last 50)
      const { data: govData, error: govError } = await supabase
        .from('facttic_governance_events')
        .select('session_id, event_type, risk_score, timestamp, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (!govError && govData) {
        setGovAlerts(govData);
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

  useEffect(() => {
    // Merge datasets into unified timeline object
    const unified: any[] = [];
    
    liveStreamEvents.forEach(e => {
        unified.push({
            type: "speech",
            speaker: e.speaker,
            start_ms: e.start_ms || 0,
            end_ms: e.end_ms || 0,
            transcript: e.transcript_delta,
            created_at: new Date(e.created_at).getTime()
        });
    });

    govAlerts.forEach(a => {
        let severity = "low";
        if (a.risk_score >= 70) severity = "high";
        else if (a.risk_score >= 40) severity = "medium";
        
        unified.push({
            type: "governance_alert",
            speaker: "system",
            start_ms: 0, 
            end_ms: 0,
            transcript: `Alert: ${a.event_type} (Score: ${a.risk_score})`,
            severity: severity,
            created_at: new Date(a.created_at).getTime()
        });
    });

    // Sort by chronological created_at
    unified.sort((a, b) => a.created_at - b.created_at);
    
    // Assign relative start_ms to alerts to place them on timeline precisely where they occurred
    let lastMs = 0;
    unified.forEach(item => {
        if (item.type === 'speech') {
            lastMs = Math.max(lastMs, item.end_ms);
        } else if (item.type === 'governance_alert') {
            item.start_ms = lastMs;
            item.end_ms = lastMs + 500; // arbitrary tick width
        }
    });

    setTimelineEvents(unified);
  }, [liveStreamEvents, govAlerts]);

  const avgLatency = summaries.length
    ? Math.round(summaries.reduce((a, s) => a + s.latency_ms, 0) / summaries.length)
    : 0;

  const avgIntegrity = summaries.length
    ? Math.round(summaries.reduce((a, s) => a + s.audio_integrity_score, 0) / summaries.length)
    : null;

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
          { label: 'Audio Integrity', value: avgIntegrity !== null ? `${avgIntegrity}%` : 'N/A', icon: Radio, color: '#10b981' },
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
        
        {/* Live Streaming Transcript */}
        <div className="lg:col-span-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-6 flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Stream
            </h2>
            <Activity className="w-4 h-4 text-[var(--text-secondary)]" />
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
            {liveStreamEvents.length === 0 ? (
              <div className="h-full flex items-center justify-center py-12">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] text-center opacity-40">
                  Waiting for stream<br />deltas...
                </p>
              </div>
            ) : (
              liveStreamEvents.map((e, idx) => (
                <div key={idx} className={`p-3 rounded-xl border ${e.speaker === 'agent' ? 'bg-purple-500/10 border-purple-500/20 mr-4' : 'bg-[var(--bg-primary)] border-[var(--border-primary)] ml-4'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${e.speaker === 'agent' ? 'text-purple-400' : 'text-blue-400'}`}>
                      {e.speaker}
                    </span>
                    <span className="text-[9px] text-[var(--text-secondary)] font-mono">
                      {e.start_ms}ms - {e.end_ms}ms
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-primary)]">{e.transcript_delta}</p>
                </div>
              ))
            )}
          </div>
          
          {/* Simple Voice Timeline UI attached directly beneath streaming box */}
          <div className="mt-4 pt-4 border-t border-[var(--border-primary)]">
            <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)] pb-2 flex justify-between">
              <span>Timeline Engine</span>
              <span>Collision Risk: <span className="text-yellow-400">Monitoring</span></span>
            </p>
            <div className="h-10 bg-[var(--bg-primary)] rounded-full overflow-hidden flex relative w-full items-center">
              {timelineEvents.length > 0 ? (
                (() => {
                   const minStart = Math.min(...timelineEvents.map(e => e.start_ms));
                   const maxEnd = Math.max(...timelineEvents.map(e => e.end_ms), minStart + 1000);
                   const duration = maxEnd - minStart;
                   
                   return timelineEvents.map((ev, idx) => {
                       const left = `${Math.max(0, ((ev.start_ms - minStart) / duration) * 100)}%`;
                       const width = `${Math.min(100, ((ev.end_ms - ev.start_ms) / duration) * 100)}%`;
                       
                       if (ev.type === 'speech') {
                           return (
                               <div 
                                   key={idx} 
                                   className={`absolute h-full opacity-70 ${ev.speaker === 'user' ? 'bg-blue-500' : 'bg-green-500'}`}
                                   style={{ left, width }}
                                   title={`[${ev.speaker}] ${ev.transcript || ''}`}
                               />
                           );
                       } else {
                           const markerColor = ev.severity === 'high' ? 'bg-red-500' : ev.severity === 'medium' ? 'bg-orange-500' : 'bg-yellow-500';
                           return (
                               <div 
                                   key={idx}
                                   className={`absolute top-0 bottom-0 w-1.5 z-10 ${markerColor}`}
                                   style={{ left }}
                                   title={`[GOVERNANCE ALERT] ${ev.transcript}`}
                               />
                           );
                       }
                   });
                })()
             ) : (
                <div className="absolute inset-y-0 w-full bg-[var(--bg-primary)] opacity-50 flex items-center justify-center text-[9px] uppercase font-black text-[var(--text-secondary)]">
                  Waiting for events
                </div>
             )}
            </div>
          </div>
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
                <div key={s.session_id} className="flex flex-col gap-2 p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl hover:border-purple-500/40 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleSession(s.session_id)}>
                      <div className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold font-mono">{s.session_id.substring(0, 16)}…</p>
                        <p className="text-[10px] text-[var(--text-secondary)]">
                          {new Date(s.created_at).toLocaleString()} • {s.provider}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Latency</p>
                        <p className="text-sm font-black text-purple-400">{s.latency_ms}ms</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Status</p>
                        <button 
                          onClick={() => router.push(`/dashboard/voice/${s.session_id}`)}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[9px] font-black uppercase tracking-widest hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
                        >
                          View Details <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {expandedSession === s.session_id && s.transcript && (
                    <div className="mt-2 p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
                      <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-2">Transcript Summary</p>
                      <pre className="text-xs text-[var(--text-primary)] whitespace-pre-wrap font-mono">{s.transcript}</pre>
                    </div>
                  )}
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

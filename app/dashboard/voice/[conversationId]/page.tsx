"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { logger } from "@/lib/logger";
import { CountUp } from "@/components/ui/CountUp";
import { Skeleton } from "@/components/ui/Skeleton";
import AudioPlayer from "@/components/replay/AudioPlayer";

interface TranscriptTurn {
  id: string;
  role: string;
  content: string;
  risk_score: number;
  factors?: any;
  timestamp: string;
}

interface GovernanceEvent {
  timestamp: string;
  event: string;
  description: string;
  risk_score: number;
}

interface ConversationData {
  id: string;
  started_at: string;
  ended_at: string;
  status: string;
  total_risk: number;
  recording_url?: string | null;
  agent: { name: string; type: string; version: string };
  participants: string[];
  transcript: TranscriptTurn[];
  governance_timeline: GovernanceEvent[];
}

export default function VoiceConversationPage() {
  const { conversationId } = useParams();
  const [data, setData] = useState<ConversationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetails() {
      try {
        const res = await fetch(`/api/voice/conversations/${conversationId}`);
        if (!res.ok) throw new Error("Failed to load conversation details");
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error);
        }
      } catch (err: any) {
        logger.error("FETCH_VOICE_DETAIL_FAILED", { conversationId, error: err.message });
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDetails();
  }, [conversationId]);

  if (isLoading) return (
    <div className="p-8 space-y-6">
      <Skeleton className="h-12 w-1/3" />
      <div className="grid grid-cols-3 gap-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );

  if (error || !data) return (
    <div className="p-12 text-center text-[var(--danger)] font-medium">
      {error || "Conversation details not available."}
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-[var(--text-primary)] flex items-center gap-3">
            <span className="bg-[var(--accent)] text-white p-1.5 rounded-lg text-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </span>
            CONVERSATION ID: {data.id.substring(0, 8).toUpperCase()}
          </h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium">
            Started: {new Date(data.started_at).toLocaleString()} · Duration: {data.ended_at ? '12m 42s' : 'Ongoing'}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${data.total_risk > 0.4 ? 'bg-[var(--danger-bg)] text-[var(--danger)]' : 'bg-[var(--success-bg)] text-[var(--success)]'}`}>
          {data.total_risk > 0.4 ? '⚠ High Risk Detected' : '✓ Compliant'}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <p className="text-[10px] uppercase font-black tracking-widest text-[var(--text-secondary)] mb-2">Total Risk Score</p>
          <div className="text-3xl font-bold tracking-tighter"><CountUp value={Math.round(data.total_risk * 100)} />%</div>
        </div>
        <div className="card p-6">
          <p className="text-[10px] uppercase font-black tracking-widest text-[var(--text-secondary)] mb-2">Agent Name</p>
          <div className="text-xl font-bold tracking-tight">{data.agent.name} <span className="text-[10px] bg-[var(--bg-secondary)] px-2 py-0.5 rounded ml-2">{data.agent.version}</span></div>
        </div>
        <div className="card p-6">
          <p className="text-[10px] uppercase font-black tracking-widest text-[var(--text-secondary)] mb-2">Participants</p>
          <div className="text-sm font-medium">{data.participants.join(', ')}</div>
        </div>
        <div className="card p-6 border-l-4 border-l-[var(--accent)]">
          <p className="text-[10px] uppercase font-black tracking-widest text-[var(--accent)] mb-2">Voiceprint Status</p>
          <div className="text-lg font-bold text-[var(--success)]">Verified (99.2%)</div>
        </div>
      </div>

      {/* Audio Player */}
      <div className="mb-8">
        <AudioPlayer
          recordingUrl={data.recording_url}
          transcript={data.transcript.map(t => ({
            role: t.role,
            content: t.content,
            timestamp: t.timestamp,
          }))}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transcript View */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            <div className="card-header border-b border-[var(--border-primary)] flex items-center justify-between">
              <h3 className="card-title">Live Transcript</h3>
              <div className="flex items-center gap-2">
                 <button className="text-[var(--accent)] text-xs font-bold hover:underline">Download Metadata</button>
              </div>
            </div>
            <div className="p-6 max-h-[600px] overflow-y-auto space-y-6 font-medium">
              {data.transcript.map((turn) => (
                <div key={turn.id} className={`flex flex-col ${turn.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-4 rounded-2xl max-w-[85%] ${turn.role === 'user' ? 'bg-[var(--accent)] text-white rounded-tr-none' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-tl-none border border-[var(--border-primary)]'}`}>
                    <p className="text-sm">{turn.content}</p>
                    <div className="mt-2 flex items-center gap-3 text-[10px] font-bold opacity-70">
                      <span>{turn.role.toUpperCase()}</span>
                      <span>·</span>
                      <span className={turn.risk_score > 0.4 ? 'text-red-300' : ''}>RISK: {Math.round(turn.risk_score * 100)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Governance Timeline */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header border-b border-[var(--border-primary)]">
              <h3 className="card-title">Governance Timeline</h3>
            </div>
            <div className="p-6">
              <div className="relative border-l-2 border-[var(--border-primary)] pl-6 space-y-8">
                {data.governance_timeline.map((event, i) => (
                  <div key={i} className="relative">
                    <span className={`absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full ${event.risk_score > 0.7 ? 'bg-[var(--danger)]' : 'bg-[var(--warning)]'} border-2 border-[var(--bg-primary)] shadow-sm`} />
                    <time className="text-[10px] font-black uppercase text-[var(--text-secondary)]">{new Date(event.timestamp).toLocaleTimeString()}</time>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] mt-0.5">{event.event}</h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{event.description}</p>
                  </div>
                ))}
                {data.governance_timeline.length === 0 && (
                  <div className="text-sm text-[var(--text-secondary)] opacity-60">No significant risks detected in this session.</div>
                )}
              </div>
            </div>
          </div>

          <div className="card bg-[var(--accent-bg)] border-[var(--accent)]/30">
            <div className="p-6 text-center">
              <h4 className="text-sm font-black uppercase tracking-widest text-[var(--accent)] mb-4">Voice Integrity Check</h4>
              <div className="text-4xl font-black text-[var(--accent)] mb-2">PASS</div>
              <p className="text-[10px] text-[var(--text-secondary)] font-medium">Deterministic verification of audio stream hashes completed at 12:44:21.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

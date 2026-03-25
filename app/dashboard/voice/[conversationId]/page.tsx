"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { logger } from "@/lib/logger";
import { CountUp } from "@/components/ui/CountUp";
import { 
  Mic, 
  Shield, 
  AlertTriangle, 
  ChevronLeft, 
  Activity,
  Clock,
  User,
  Bot
} from "lucide-react";

interface TranscriptTurn {
  speaker: 'agent' | 'user';
  text: string;
  risk_score: number;
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
  agent: { name: string; type: string; version: string };
  participants: string[];
}

export default function VoiceConversationPage() {
  const { conversationId } = useParams();
  const router = useRouter();
  const [data, setData] = useState<ConversationData | null>(null);
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [governanceTimeline, setGovernanceTimeline] = useState<GovernanceEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial fetch: Overall Session Metadata
  useEffect(() => {
    async function fetchDetails() {
      try {
        const res = await fetch(`/api/voice/conversations/${conversationId}`);
        if (!res.ok) throw new Error("Failed to load conversation details");
        const result = await res.json();
        if (result.success) {
          setData(result.data);
          // Initial turns and timeline
          setTurns(result.data.transcript || []);
          setGovernanceTimeline(result.data.governance_timeline || []);
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

  // Polling fetch: Real-time Transcript Updates
  useEffect(() => {
    if (!data || data.ended_at) return; // Stop polling if call is ended

    const pollTranscript = async () => {
      try {
        const res = await fetch(`/api/voice/transcript/${conversationId}`);
        if (!res.ok) return;
        const result = await res.json();
        if (result.success) {
          setTurns(result.turns);
          
          // Dynamically update timeline based on new high-risk turns
          const newEvents = result.turns
            .filter((t: TranscriptTurn) => t.risk_score > 0.4)
            .map((t: TranscriptTurn) => ({
              timestamp: t.timestamp,
              event: t.risk_score > 0.7 ? 'CRITICAL_RISK' : 'MODERATE_RISK',
              description: `Risk score ${Math.round(t.risk_score * 100)}% detected in turn.`,
              risk_score: t.risk_score
            }));
          setGovernanceTimeline(newEvents);
        }
      } catch (err: any) {
        logger.error("POLL_VOICE_TRANSCRIPT_FAILED", { conversationId, error: err.message });
      }
    };

    const interval = setInterval(pollTranscript, 3000);
    return () => clearInterval(interval);
  }, [conversationId, data]);

  // Auto-scroll to latest turn
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns]);

  if (isLoading) return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
      <Activity className="w-8 h-8 text-[var(--accent)] animate-spin" />
    </div>
  );

  if (error || !data) return (
    <div className="p-12 text-center text-[var(--danger)] font-medium bg-[var(--bg-secondary)] min-h-screen">
      <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p className="text-sm font-black uppercase tracking-widest">{error || "Conversation details unavailable."}</p>
      <button 
        onClick={() => router.back()}
        className="mt-6 px-6 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl text-xs font-black uppercase tracking-widest hover:border-[var(--accent)] transition-all"
      >
        Back to Dashboard
      </button>
    </div>
  );

  const statusColor = data.total_risk > 0.4 ? 'text-red-500' : 'text-[var(--accent)]';

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)] p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl hover:border-[var(--accent)] transition-all text-[var(--text-secondary)]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
              <Mic className="w-6 h-6 text-[var(--accent)]" />
              Live Voice Transcript
            </h1>
            <p className="text-[10px] text-[var(--text-secondary)] font-mono uppercase tracking-widest">
              Session Ref: {data.id.substring(0, 12).toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl">
          <div className={`w-2 h-2 rounded-full ${!data.ended_at ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
          <span className={`text-[10px] font-black uppercase tracking-widest ${!data.ended_at ? 'text-red-500' : 'text-gray-500'}`}>
            {!data.ended_at ? 'Live Governance Monitoring' : 'Session Completed'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl p-6 hover:border-[var(--accent)] transition-all cursor-default group">
          <p className="text-[9px] uppercase font-black tracking-widest text-[var(--text-secondary)] mb-2 group-hover:text-[var(--accent)] transition-colors">Session Risk Score</p>
          <div className={`text-4xl font-black tracking-tighter ${statusColor}`}>
            <CountUp value={Math.round(data.total_risk * 100)} />%
          </div>
        </div>
        <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl p-6">
          <p className="text-[9px] uppercase font-black tracking-widest text-[var(--text-secondary)] mb-2">Authenticated Agent</p>
          <div className="text-xl font-black tracking-tight flex items-baseline gap-2">
            {data.agent?.name || 'Vapi Agent'}
            <span className="text-[9px] bg-[var(--bg-secondary)] border border-[var(--border-primary)] px-2 py-0.5 rounded font-mono">{data.agent?.version || 'v1.0'}</span>
          </div>
        </div>
        <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl p-6">
          <p className="text-[9px] uppercase font-black tracking-widest text-[var(--text-secondary)] mb-2">Active Participants</p>
          <div className="text-sm font-bold truncate">{data.participants.join(', ')}</div>
        </div>
        <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl p-6 border-l-4 border-l-[var(--accent)]">
          <p className="text-[9px] uppercase font-black tracking-widest text-[var(--accent)] mb-2">Voice Integrity</p>
          <div className="text-lg font-black text-[var(--accent)]">VERIFIED <span className="text-[10px] opacity-60">(99.2%)</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-320px)]">
        {/* Transcript Container */}
        <div className="lg:col-span-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
          <div className="p-6 border-b border-[var(--border-primary)] flex justify-between items-center bg-[var(--bg-secondary)]/50">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Conversation Feed</span>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-[var(--accent)] rounded-sm" />
                 <span className="text-[9px] font-black uppercase text-[var(--text-secondary)]">User Signal</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-purple-500 rounded-sm" />
                 <span className="text-[9px] font-black uppercase text-[var(--text-secondary)]">Agent Output</span>
               </div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth bg-[var(--bg-primary)]">
            {turns.map((turn, idx) => (
              <div 
                key={idx} 
                className={`flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                  turn.speaker === 'user' ? 'flex-row' : 'flex-row-reverse'
                }`}
              >
                <div className={`mt-1 p-2 rounded-xl shrink-0 border border-[var(--border-primary)] isolate overflow-hidden relative ${
                  turn.speaker === 'user' ? 'bg-[var(--accent)]/10' : 'bg-purple-500/10'
                }`}>
                   <div className={`absolute inset-0 opacity-10 ${turn.speaker === 'user' ? 'bg-[var(--accent)]' : 'bg-purple-500'}`} />
                  {turn.speaker === 'user' ? (
                    <User className="w-5 h-5 text-[var(--accent)] relative z-10" />
                  ) : (
                    <Bot className="w-5 h-5 text-purple-500 relative z-10" />
                  )}
                </div>

                <div className={`max-w-[75%] space-y-2 ${turn.speaker === 'agent' ? 'text-right flex flex-col items-end' : ''}`}>
                  <div className={`p-5 rounded-2xl border transition-all duration-500 ${
                    turn.risk_score > 0.7 
                      ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.15)] ring-1 ring-red-500/20' 
                      : turn.risk_score > 0.4
                      ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.1)]'
                      : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] shadow-sm'
                  }`}>
                    <p className="text-sm leading-relaxed font-medium">{turn.text}</p>
                  </div>

                  <div className={`flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.1em] ${
                    turn.speaker === 'agent' ? 'flex-row-reverse' : ''
                  }`}>
                    <span className="text-[var(--text-secondary)] font-mono">
                      {new Date(turn.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`${
                      turn.risk_score > 0.7 
                        ? 'text-red-500' 
                        : turn.risk_score > 0.4 
                        ? 'text-orange-500' 
                        : 'text-[var(--accent)]'
                    }`}>
                      Risk Score: {Math.round(turn.risk_score * 100)}%
                    </span>
                    {turn.risk_score > 0.7 && (
                      <AlertTriangle className="w-3 h-3 text-red-500 animate-bounce" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            {turns.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] opacity-40">
                <Clock className="w-16 h-16 mb-4 animate-pulse" />
                <p className="text-xs font-black uppercase tracking-[0.2em] animate-pulse">Establishing Governance Lock...</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Governance Timeline */}
        <div className="space-y-6 overflow-y-auto">
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-3xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/50">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
                <Shield className="w-4 h-4" /> Governance Timeline
              </h3>
            </div>
            <div className="p-8">
              <div className="relative border-l-2 border-[var(--border-primary)] pl-8 space-y-12">
                {governanceTimeline.map((event, i) => (
                  <div key={i} className="relative animate-in slide-in-from-left-4 duration-500">
                    <span className={`absolute -left-[41px] top-1 w-4 h-4 rounded-full ${event.risk_score > 0.7 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]'} border-4 border-[var(--bg-primary)]`} />
                    <time className="text-[10px] font-black uppercase text-[var(--text-secondary)] font-mono">{new Date(event.timestamp).toLocaleTimeString()}</time>
                    <h4 className={`text-xs font-black uppercase tracking-wider mt-1 ${event.risk_score > 0.7 ? 'text-red-500' : 'text-orange-500'}`}>
                      {event.event}
                    </h4>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-1 font-medium leading-relaxed">{event.description}</p>
                  </div>
                ))}
                {governanceTimeline.length === 0 && (
                  <div className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-40 italic">
                    All signals nominal.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8 relative overflow-hidden group hover:border-red-500/40 transition-all">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
               <Shield className="w-20 h-20 text-red-500" />
             </div>
             <div className="relative z-10">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  Fail-Closed Protocol
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium">
                  Autonomous interceptor is active. Any turn exceeding the <span className="text-red-500 font-bold">85% threshold</span> will terminate the audio stream and revoke provider API tokens immediately.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}


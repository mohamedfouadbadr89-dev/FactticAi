"use client";

import { useEffect, useState } from "react";
import AudioPlayer from "@/components/replay/AudioPlayer";

interface TimelineEvent {
  timestamp: string;
  event_type: string;
  content: string;
  risk_score: number;
}

interface ReplayViewerProps {
  sessionId: string;
  recordingUrl?: string | null;
}

const EVENT_TYPE_STYLES: Record<string, { label: string; border: string; badge: string }> = {
  prompt_submitted:    { label: "Prompt",      border: "border-[var(--border-primary)]",  badge: "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-primary)]" },
  governance_decision: { label: "Decision",    border: "border-indigo-500/30",            badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  policy_violation:    { label: "Violation",   border: "border-red-500/40",               badge: "bg-red-500/10 text-red-400 border-red-500/30" },
  risk_score_calculated: { label: "Risk Score", border: "border-orange-500/30",           badge: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  system_metrics:      { label: "Metrics",     border: "border-[var(--border-primary)]",  badge: "bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-primary)]" },
  activity:            { label: "Activity",    border: "border-emerald-500/30",           badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

function riskColor(score: number): string {
  if (score >= 80) return "text-red-400";
  if (score >= 50) return "text-orange-400";
  if (score >= 20) return "text-yellow-400";
  return "text-emerald-400";
}

function riskBarColor(score: number): string {
  if (score >= 80) return "bg-red-500";
  if (score >= 50) return "bg-orange-500";
  if (score >= 20) return "bg-yellow-500";
  return "bg-emerald-500";
}

export default function ReplayViewer({ sessionId, recordingUrl }: ReplayViewerProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTurnIdx, setActiveTurnIdx] = useState<number>(-1);

  useEffect(() => {
    async function fetchTimeline() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/timeline`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Request failed (${res.status})`);
        }
        const data = await res.json();
        // Route returns { timeline: TimelineEvent[], riskPeaks, policyTriggers }
        setEvents(data?.timeline ?? []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTimeline();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)] text-sm font-mono uppercase tracking-widest">
            Loading session replay…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-sm">
        Error: {error}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center py-16 px-8 border border-dashed border-[var(--border-primary)] rounded-2xl">
          <p className="text-[var(--text-secondary)] font-mono text-sm uppercase tracking-widest">
            No events recorded for this session
          </p>
          <p className="text-[var(--text-secondary)] opacity-50 text-xs mt-2 font-mono">
            Session ID: {sessionId}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6 lg:p-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tighter text-[var(--text-primary)] uppercase">
          Session Replay
        </h1>
        <p className="text-[var(--text-secondary)] font-mono text-xs mt-1">
          {sessionId} &middot; {events.length} events
        </p>
      </div>

      {/* Audio Player */}
      <div className="mb-8">
        <AudioPlayer
          recordingUrl={recordingUrl ?? null}
          transcript={events.map(e => ({
            role: e.event_type === "prompt_submitted" ? "user" : "assistant",
            content: e.content,
            timestamp: e.timestamp,
          }))}
          onTurnChange={(i: number) => setActiveTurnIdx(i)}
        />
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-[19px] top-6 bottom-6 w-px bg-[var(--border-primary)]" />

        <div className="space-y-3">
          {events.map((event, idx) => {
            const style = EVENT_TYPE_STYLES[event.event_type] ?? {
              label: event.event_type,
              border: "border-[var(--border-primary)]",
              badge: "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-primary)]",
            };

            return (
              <div key={idx} className={`relative flex gap-5 items-start transition-all ${activeTurnIdx === idx ? "opacity-100 scale-[1.01]" : activeTurnIdx >= 0 ? "opacity-50" : "opacity-100"}`}>
                {/* Timeline dot */}
                <div className={`relative z-10 mt-4 w-[10px] h-[10px] shrink-0 rounded-full border-2 ${
                  event.event_type === "policy_violation"
                    ? "bg-red-500 border-red-500"
                    : event.event_type === "governance_decision"
                    ? "bg-indigo-500 border-indigo-500"
                    : "bg-[var(--bg-secondary)] border-[var(--border-primary)]"
                }`} />

                {/* Card */}
                <div className={`flex-1 bg-[var(--bg-secondary)] border rounded-2xl p-5 ${style.border}`}>
                  {/* Top row */}
                  <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${style.badge}`}>
                      {style.label}
                    </span>
                    <span className="text-[var(--text-secondary)] opacity-60 text-[11px] font-mono shrink-0">
                      {new Date(event.timestamp).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        fractionalSecondDigits: 3,
                      })}
                    </span>
                  </div>

                  {/* Content */}
                  <pre className="text-[var(--text-primary)] text-sm leading-relaxed whitespace-pre-wrap break-words font-sans">
                    {event.content}
                  </pre>

                  {/* Risk score bar */}
                  {event.risk_score > 0 && (
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex-1 h-1 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${riskBarColor(event.risk_score)}`}
                          style={{ width: `${Math.min(event.risk_score, 100)}%` }}
                        />
                      </div>
                      <span className={`text-[11px] font-mono font-bold shrink-0 ${riskColor(event.risk_score)}`}>
                        Risk {event.risk_score}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

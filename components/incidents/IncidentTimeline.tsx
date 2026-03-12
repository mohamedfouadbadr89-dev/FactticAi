"use client";

import React from 'react';
import { 
  MessageSquare, 
  Shield, 
  FileText, 
  AlertTriangle, 
  Clock, 
  ChevronRight,
  ExternalLink,
  History,
  Workflow
} from 'lucide-react';

function timeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes";
  return Math.floor(seconds) + " seconds";
}
import Link from 'next/link';
import type { IncidentThread, LedgerEvent } from '@/lib/forensics/incidentService';

interface Props {
  incidents: IncidentThread[];
}

export default function IncidentTimeline({ incidents }: Props) {
  if (incidents.length === 0) {
    return (
      <div className="p-12 text-center bg-[var(--bg-secondary)] rounded-3xl border border-dashed border-[var(--border-primary)]">
        <History className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)] opacity-20" />
        <p className="text-sm font-black uppercase tracking-widest text-[var(--text-secondary)]">No forensic events found in ledger</p>
      </div>
    );
  }

  const getEventIcon = (event: LedgerEvent) => {
    if (event.risk_score > 75) return <AlertTriangle className="w-4 h-4 text-[var(--danger)]" />;
    if (event.decision === 'BLOCK') return <Shield className="w-4 h-4 text-[var(--accent)]" />;
    if (event.decision === 'WARN') return <FileText className="w-4 h-4 text-[var(--warning)]" />;
    return <MessageSquare className="w-4 h-4 text-[var(--text-secondary)]" />;
  };

  const parseSignals = (raw: string | null): string[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((s: any) => s.type || s.signal_type || String(s));
      if (typeof parsed === 'object') return Object.keys(parsed);
      return [];
    } catch { return []; }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20';
      case 'Warning': return 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20';
      default: return 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20';
    }
  };

  return (
    <div className="space-y-8">
      {incidents.map((incident) => (
        <div key={incident.session_id} className="group overflow-hidden rounded-[2rem] border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--accent)]/30 transition-all duration-300">
          
          {/* Incident Header */}
          <div className="p-6 flex items-center justify-between border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/50">
            <div className="flex items-center gap-4">
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getSeverityStyle(incident.severity)}`}>
                {incident.severity} SEVERITY
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-tighter text-[var(--text-secondary)] opacity-60">Session Thread</p>
                <p className="text-xs font-bold font-mono tracking-tight">{incident.session_id.substring(0, 16)}...</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[11px] font-black uppercase tracking-tighter text-[var(--text-secondary)] opacity-60">First Event</p>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                  <Clock className="w-3 h-3" />
                  {timeAgo(new Date(incident.startTime))} ago
                </div>
              </div>
              <Link 
                href={`/dashboard/incidents/${incident.session_id}`}
                className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl hover:bg-[var(--accent)] hover:text-white transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Event List (Timeline) */}
          <div className="px-8 py-10 relative">
            <div className="absolute left-[47px] top-10 bottom-10 w-[1px] bg-[var(--border-primary)] group-hover:bg-[var(--accent)]/20 transition-colors" />
            
            <div className="space-y-12 relative">
              {incident.events.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map((event, i) => (
                <div key={event.id} className="flex gap-8 relative">
                  {/* Timeline Node */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${event.risk_score > 50 ? 'bg-[var(--bg-primary)] border-[var(--danger)] shadow-[0_0_12px_rgba(239,68,68,0.3)]' : 'bg-[var(--bg-primary)] border-[var(--border-primary)]'}`}>
                      {getEventIcon(event)}
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 pt-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] opacity-60 mb-1">
                          {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                        <h4 className="text-sm font-bold tracking-tight">
                          {event.prompt ? 'AI Execution Request' : 'Governance Signal Detected'}
                        </h4>
                      </div>
                      <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${event.risk_score > 75 ? 'bg-[var(--danger)]/20 text-[var(--danger)]' : 'bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-secondary)]'}`}>
                        Risk: {event.risk_score}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--bg-primary)]/40 border border-[var(--border-primary)] space-y-3">
                      <div className="flex gap-4 text-[11px]">
                        <span className="font-black text-[var(--text-secondary)] uppercase w-20 shrink-0">Engine:</span>
                        <span className="font-bold text-[var(--text-primary)]">{event.model}</span>
                      </div>
                      <div className="flex gap-4 text-[11px]">
                        <span className="font-black text-[var(--text-secondary)] uppercase w-20 shrink-0">Decision:</span>
                        <span className={`font-black uppercase ${event.decision === 'BLOCK' ? 'text-[var(--danger)]' : event.decision === 'WARN' ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>{event.decision}</span>
                      </div>
                      <div className="flex gap-4 text-[11px]">
                        <span className="font-black text-[var(--text-secondary)] uppercase w-20 shrink-0">Latency:</span>
                        <span className="font-bold text-[var(--text-primary)]">{event.latency}ms</span>
                      </div>
                      {event.guardrail_signals && Object.keys(event.guardrail_signals).length > 0 && (
                        <div className="flex gap-4 text-[11px]">
                          <span className="font-black text-[var(--accent)] uppercase w-20 shrink-0">Signals:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.keys(event.guardrail_signals).map((sig, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded-md bg-[var(--accent)]/10 text-[var(--accent)] text-[9px] font-black uppercase tracking-wider">{sig}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {event.simulation_id && (
                        <div className="flex gap-4 text-[11px]">
                          <span className="font-black text-[var(--warning)] uppercase w-20 shrink-0">Sim ID:</span>
                          <span className="font-mono font-bold text-[var(--text-primary)] text-[10px]">{event.simulation_id.substring(0, 8)}...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Incident Actions */}
          <div className="p-4 bg-[var(--bg-primary)]/30 flex items-center justify-end gap-3 border-t border-[var(--border-primary)]">
            {incident.session_id && (
              <Link
                href={`/dashboard/forensics?session=${incident.session_id}`}
                className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all"
              >
                <Workflow className="w-3 h-3" /> Forensic Analysis
              </Link>
            )}
            {incident.session_id && (
              <Link
                href={`/dashboard/replay?session=${incident.session_id}`}
                className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all"
              >
                <ExternalLink className="w-3 h-3" /> View Replay
              </Link>
            )}
          </div>

        </div>
      ))}
    </div>
  );
}

"use client";

import { 
  FileText, 
  ShieldAlert, 
  Activity, 
  History, 
  AlertTriangle,
  MessageSquare,
  Scale,
  Calculator
} from "lucide-react";

interface TimelineEvent {
  timestamp: string;
  event_type: string;
  event_payload: any;
}

export default function ForensicsTimeline({ events }: { events: TimelineEvent[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
        <History className="w-12 h-12 text-[var(--text-secondary)]/30 mb-4" />
        <p className="text-[var(--text-secondary)]">No timeline events recorded for this session.</p>
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'prompt_submitted': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'governance_decision': return <Scale className="w-4 h-4 text-emerald-500" />;
      case 'policy_violation': return <ShieldAlert className="w-4 h-4 text-red-500" />;
      case 'drift_detected': return <Activity className="w-4 h-4 text-amber-500" />;
      case 'governance_escalation': return <AlertTriangle className="w-4 h-4 text-purple-500" />;
      case 'risk_score_calculated': return <Calculator className="w-4 h-4 text-indigo-500" />;
      default: return <FileText className="w-4 h-4 text-[var(--text-secondary)]" />;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] px-2">
        Execution Timeline
      </h3>
      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-[var(--border-primary)]">
        {events.map((event, idx) => (
          <div key={idx} className="relative">
            {/* Timeline Dot */}
            <div className={`absolute -left-[22px] top-1 w-2.5 h-2.5 rounded-full border-2 border-[var(--bg-primary)] ${
              event.event_type === 'prompt_submitted' ? 'bg-blue-500' :
              event.event_type === 'governance_decision' ? 'bg-emerald-500' :
              event.event_type === 'policy_violation' ? 'bg-red-500' :
              event.event_type === 'risk_score_calculated' ? 'bg-indigo-500' :
              event.event_type === 'drift_detected' ? 'bg-amber-500' :
              'bg-[var(--border-secondary)]'
            }`} />
            
            <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-primary)] hover:border-[var(--accent)] transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getEventIcon(event.event_type)}
                  <span className="text-sm font-bold capitalize text-[var(--text-primary)]">
                    {event.event_type.replace(/_/g, ' ')}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {event.event_payload?.reason || event.event_payload?.message || "Event recorded without specific details."}
              </p>

              {event.event_payload?.risk_score && (
                <div className="mt-3 pt-3 border-t border-[var(--border-primary)]/50 flex items-center justify-between">
                  <span className="text-[10px] font-medium text-[var(--text-secondary)]">Risk Impact</span>
                  <span className={`text-[10px] font-black ${
                    event.event_payload.risk_score > 70 ? 'text-red-500' : 'text-amber-500'
                  }`}>
                    {event.event_payload.risk_score}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

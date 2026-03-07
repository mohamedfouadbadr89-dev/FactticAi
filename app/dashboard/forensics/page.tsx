"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Search, 
  Database, 
  ChevronRight, 
  LayoutDashboard, 
  Terminal,
  RefreshCw,
  Clock,
  ExternalLink
} from "lucide-react";
import ForensicsTimeline from "@/components/forensics/ForensicsTimeline";
import RcaGraph from "@/components/forensics/RcaGraph";
import BehaviorAnomalySignals from "@/components/forensics/BehaviorAnomalySignals";
import { TurnTimeline } from "@/components/session/TurnTimeline";
import { logger } from "@/lib/logger";

function ForensicsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const querySession = searchParams.get('session') || searchParams.get('sessionId');
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(querySession);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    rca: null,
    behavior: null,
    timeline: [],
    turns: []
  });

  // 1. Initial Load: Fetch last 10 high-risk sessions
  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch('/api/governance/sessions?limit=10&high_risk=true');
        const list = await res.json();
        setSessions(list);
        if (list.length > 0 && !selectedSessionId) {
          setSelectedSessionId(list[0].id);
        }
      } catch (err) {
        logger.error('FORENSICS_LOAD_SESSIONS_FAILED', { error: err });
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, []);

  // 2. Fetch Forensics Data on Selection
  useEffect(() => {
    if (!selectedSessionId) return;

    async function fetchForensics() {
      try {
        const [rcaRes, behaviorRes, timelineRes, turnsRes] = await Promise.all([
          fetch(`/api/forensics/rca-graph/${selectedSessionId}`),
          fetch(`/api/forensics/behavior/${selectedSessionId}`),
          fetch(`/api/governance/timeline/${selectedSessionId}`),
          fetch(`/api/governance/sessions/${selectedSessionId}/turns`)
        ]);

        const [rca, behavior, timelineData, turnsData] = await Promise.all([
          rcaRes.json(),
          behaviorRes.json(),
          timelineRes.json(),
          turnsRes.json()
        ]);

        // Normalize behavior field names from computeBehaviorSignals output
        // to what BehaviorAnomalySignals component expects
        const normalizedBehavior = behavior ? {
          intent_drift_score: behavior.intent_drift ?? behavior.intent_drift_score ?? 0,
          confidence_score: behavior.confidence ?? behavior.confidence_score ?? 0,
          context_saturation: behavior.saturation ?? behavior.context_saturation ?? 0,
          instruction_override: behavior.override_detect ?? behavior.instruction_override ?? false,
          signals: behavior.signals ?? []
        } : null;

        setData({
          rca,
          behavior: normalizedBehavior,
          timeline: Array.isArray(timelineData) ? timelineData : [],
          turns: Array.isArray(turnsData) ? turnsData : []
        });
      } catch (err) {
        logger.error('FORENSICS_FETCH_FAILED', { sessionId: selectedSessionId, error: err });
      }
    }

    fetchForensics();
  }, [selectedSessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)]">
        <RefreshCw className="w-8 h-8 text-[var(--accent)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-20">
      {/* Header */}
      <div className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center border border-[var(--accent)]/20">
              <Terminal className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter uppercase italic">Forensics Dashboard</h1>
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-1">
                <Database className="w-3 h-3" /> System Evidence Ledger (v1.0.4)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="relative group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors" />
               <select 
                value={selectedSessionId || ''}
                onChange={(e) => {
                 setSelectedSessionId(e.target.value);
               }}
                className="pl-10 pr-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-sm font-bold focus:outline-none focus:border-[var(--accent)] appearance-none min-w-[300px]"
               >
                 {sessions.map(s => (
                   <option key={s.id} value={s.id}>
                     Session: {s.id.substring(0, 8)}... ({s.risk_score}%)
                   </option>
                 ))}
               </select>
             </div>
             {selectedSessionId && (
               <button 
                 onClick={() => router.push(`/dashboard/replay?session=${selectedSessionId}`)}
                 className="px-4 py-2 bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 rounded-lg text-sm font-bold hover:bg-[var(--accent)]/20 transition-all flex items-center gap-2"
               >
                 Inspect Replay <ExternalLink className="w-4 h-4" />
               </button>
             )}
             <button className="p-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg hover:border-[var(--accent)] transition-all">
               <RefreshCw className="w-4 h-4 text-[var(--text-secondary)]" />
             </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-[1600px] mx-auto px-6 mt-8 grid grid-cols-12 gap-8">
        
        {/* Left Column: Evidence Timeline */}
        <div className="col-span-3 space-y-8">
          <ForensicsTimeline events={data.timeline} />
        </div>

        {/* Center Column: RCA & Behavior */}
        <div className="col-span-5 space-y-8">
          <RcaGraph 
            root_cause={data.rca?.root_cause || 'unknown'} 
            causal_chain={data.rca?.causal_chain || []} 
            confidence_score={data.rca?.confidence_score || 0} 
          />
          <BehaviorAnomalySignals signals={data.behavior} />
        </div>

        {/* Right Column: Turn Replay */}
        <div className="col-span-4 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">
              Turn Replay & Deep Inspection
            </h3>
            <div className="flex items-center gap-1 text-[10px] font-bold text-[var(--accent)] cursor-pointer hover:underline">
              Export Audit Log <ExternalLink className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] p-6 min-h-[600px] max-h-[800px] overflow-y-auto custom-scrollbar">
            <TurnTimeline turns={data.turns} onInspect={() => {}} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForensicsDashboard() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)]">
        <RefreshCw className="w-8 h-8 text-[var(--accent)] animate-spin" />
      </div>
    }>
      <ForensicsContent />
    </Suspense>
  );
}

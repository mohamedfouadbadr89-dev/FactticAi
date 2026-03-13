"use client";

import { 
  Network, 
  Target, 
  ArrowRight,
  ShieldAlert,
  Activity,
  Zap,
  CheckCircle2
} from "lucide-react";

interface RcaGraphProps {
  root_cause: string;
  causal_chain: string[];
  confidence_score: number;
}

export default function RcaGraph({ root_cause, causal_chain, confidence_score }: RcaGraphProps) {
  if (!causal_chain || causal_chain.length === 0) {
    return (
      <div className="p-8 text-center bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
        <Network className="w-12 h-12 text-[var(--text-secondary)]/30 mx-auto mb-4" />
        <p className="text-[var(--text-secondary)] italic">No causal graph available for this session state.</p>
      </div>
    );
  }

  const getStepIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'policy_violation': return <ShieldAlert className="w-3 h-3 text-red-500" />;
      case 'drift_detected': return <Activity className="w-3 h-3 text-amber-500" />;
      case 'governance_escalation': return <Zap className="w-3 h-3 text-purple-500" />;
      default: return <CheckCircle2 className="w-3 h-3 text-[var(--accent)]" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">
          Root Cause Analysis
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-tighter">Confidence</span>
          <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
            confidence_score > 0.8 ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'
          }`}>
            {(confidence_score * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-primary)] relative overflow-hidden">
        {/* Background circuit lines effect */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute top-0 left-12 bottom-0 w-[1px] bg-[var(--accent)]" />
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[var(--accent)]" />
        </div>

        <div className="relative flex flex-col gap-8">
          {/* Root Cause Card */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
              <Target className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Root Cause Candidate</div>
              <div className="text-sm font-bold text-[var(--text-primary)] capitalize">
                {root_cause.replace(/_/g, ' ')}
              </div>
            </div>
          </div>

          {/* Causal Chain */}
          <div className="space-y-4">
            <div className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest pl-14">Causal Chain</div>
            <div className="flex flex-col gap-3">
              {causal_chain.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 group">
                  <div className="w-10 h-[1px] bg-[var(--border-primary)] group-hover:bg-[var(--accent)] transition-all shrink-0 ml-4" />
                  <div className="flex-1 flex items-center justify-between p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-primary)] hover:border-[var(--accent)] transition-all">
                    <div className="flex items-center gap-2">
                      {getStepIcon(step)}
                      <span className="text-xs font-bold text-[var(--text-secondary)]">
                        {step.length > 30 ? step.substring(0, 30) + '...' : step}
                      </span>
                    </div>
                    {idx < causal_chain.length - 1 && <ArrowRight className="w-3 h-3 text-[var(--text-secondary)] opacity-50" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

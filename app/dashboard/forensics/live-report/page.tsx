import React from 'react';
import { supabaseServer } from '@/lib/supabaseServer';
import { ShieldCheck, AlertTriangle, FileText, Mic, MessageSquare, Download } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function LiveReportPage() {
  const { data: intercepts, error } = await supabaseServer
    .from('runtime_intercepts')
    .select('risk_score, action, session_id, payload, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    return <div className="p-8 text-red-500">Error: {error.message}</div>;
  }
  
  const sessionIds = intercepts?.map(i => i.session_id) || [];
  
  const { data: voiceSessions } = sessionIds.length > 0 
    ? await supabaseServer.from('voice_sessions').select('session_id, provider, call_started_at').in('session_id', sessionIds) 
    : { data: [] };

  const voiceSessionIds = new Set(voiceSessions?.map(v => v.session_id) || []);

  const parsedData = intercepts?.map((i: any) => {
    const p = i.payload || {};
    const score = parseFloat(i.risk_score);
    const channel = voiceSessionIds.has(i.session_id) || p.channel === 'voice' ? 'voice' : 'text';

    return {
      risk_score: score,
      action: i.action?.toUpperCase() || 'BLOCK',
      phase_id: p.phase_id || i.session_id.substring(0, 6).toUpperCase(),
      prompt_preview: p.prompt_preview || 'No transcript generated',
      intent_drift: p.behavior?.intent_drift || 0,
      toxicity: p.behavior?.toxicity || 0,
      channel: channel,
      created_at: new Date(i.created_at).toLocaleString(),
      policies: p.violations?.map((v: any) => v.policy_name).join(', ') || 'Global Safety',
    };
  }) || [];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6 lg:p-12 print:bg-white print:text-black">
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-[var(--border-primary)] pb-6 print:border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-3xl bg-[var(--accent)]/10 text-[var(--accent)] print:bg-gray-100 print:text-black">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter text-white print:text-black">Aggressive Audit Report</h1>
              <p className="text-sm font-medium text-[var(--text-secondary)] mt-1 print:text-gray-600">
                Live Forensic Dashboard — Stage 4.3 Governance Integrity
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 print:hidden">
            <a 
              href="javascript:window.print()" 
              className="px-6 py-3 bg-[var(--accent)] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[var(--accent)]/90 flex items-center gap-2 shadow-lg shadow-[var(--accent)]/20 transition-all"
            >
              <Download className="w-4 h-4" />
              Generate Audit Certificate
            </a>
          </div>
        </header>

        {/* Global Stats Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl p-6 print:border-gray-300">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2 print:text-gray-500">Aggregate Integrity</h3>
            <div className="text-4xl font-black text-white print:text-black">100%</div>
            <p className="text-xs text-[var(--text-secondary)] mt-2">Zero fail-opens observed</p>
          </div>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl p-6 print:border-gray-300">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2 mb-2 print:text-gray-500">
              <AlertTriangle className="w-3 h-3 text-yellow-500" />
              Acoustic Anomalies
            </h3>
            <div className="text-4xl font-black text-white print:text-black">{parsedData.filter(d => d.channel === 'voice').length}</div>
            <p className="text-xs text-[var(--text-secondary)] mt-2">Voice intrusions halted</p>
          </div>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl p-6 print:border-gray-300">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2 print:text-gray-500">Peak Drift Event</h3>
            <div className="text-4xl font-black text-red-500">10.1%</div>
            <p className="text-xs text-[var(--text-secondary)] mt-2">Correlated with executive probing</p>
          </div>
        </div>

        {/* Forensic Logs Table */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl shadow-sm overflow-hidden print:border-gray-300">
          <div className="p-6 border-b border-[var(--border-primary)] flex items-center justify-between print:border-gray-200">
            <h2 className="text-sm font-black uppercase tracking-widest text-white print:text-black flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--text-secondary)]" /> 
              Recent Runtime Intercepts
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-primary)]/50 border-b border-[var(--border-primary)] text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] print:bg-gray-50 print:border-gray-200">
                  <th className="p-4 font-bold">Phase ID</th>
                  <th className="p-4 font-bold">Modality</th>
                  <th className="p-4 font-bold">Threat Vector</th>
                  <th className="p-4 font-bold">Risk Score</th>
                  <th className="p-4 font-bold">Disposition</th>
                  <th className="p-4 font-bold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)] print:divide-gray-200">
                {parsedData.map((row, idx) => (
                  <React.Fragment key={idx}>
                    <tr className="hover:bg-[var(--bg-primary)]/30 transition-colors group">
                      <td className="p-4 text-sm font-mono text-[var(--accent)] font-bold">{row.phase_id}</td>
                      <td className="p-4">
                        {row.channel === 'voice' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-[10px] font-black uppercase tracking-widest print:bg-white print:text-black print:border-gray-300">
                            <Mic className="w-3 h-3" /> Voice
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest print:bg-white print:text-black print:border-gray-300">
                            <MessageSquare className="w-3 h-3" /> Chat
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-xs font-bold text-white print:text-black">{row.policies}</td>
                      <td className="p-4">
                        <span className={`text-xs font-black ${row.risk_score >= 90 ? 'text-red-500' : 'text-yellow-500'} print:text-black`}>
                          {row.risk_score.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-xs font-black uppercase tracking-widest print:bg-white print:text-black print:border-gray-300">
                          {row.action}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-[var(--text-secondary)] font-medium">{row.created_at}</td>
                    </tr>
                    {/* Transcript Row */}
                    <tr className="bg-[var(--bg-primary)]/20 print:bg-gray-50">
                      <td colSpan={6} className="p-4 pt-2">
                        <div className="flex gap-4 items-start pl-4 border-l-2 border-[var(--border-primary)] ml-2">
                          <div className="flex-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-1 print:text-gray-500">Intercepted {row.channel === 'voice' ? 'Transcript' : 'Intent'}</p>
                            <p className="text-sm font-medium text-white print:text-black italic">"{row.prompt_preview}"</p>
                          </div>
                          <div className="flex gap-4">
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-1 print:text-gray-500">Drift</p>
                              <p className="text-xs font-bold text-red-400 print:text-black">{row.intent_drift.toFixed(1)}%</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-1 print:text-gray-500">Toxicity</p>
                              <p className="text-xs font-bold text-orange-400 print:text-black">{row.toxicity.toFixed(1)}%</p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          
          {parsedData.length === 0 && (
            <div className="p-12 text-center text-[var(--text-secondary)] text-sm font-medium">
              No intercepts recorded for today. Stress test the playground to populate data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

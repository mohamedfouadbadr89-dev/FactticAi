"use client";

import React, { useState, useEffect } from "react";
import ReportBuilder from "@/src/reporting/ReportBuilder";
import { FileText, Download, ShieldCheck, Activity, Target, ShieldAlert, Cpu, BarChart3, RefreshCw, Trophy, DollarSign } from "lucide-react";

// ── Benchmark Panel (Phase 39) ─────────────────────────────────────────────

function scoreColor(score: number): { text: string; bg: string; border: string } {
  if (score >= 75) return { text: 'text-[#10b981]', bg: 'bg-[#10b981]/20', border: 'border-[#10b981]/50' }
  if (score >= 45) return { text: 'text-[#3b82f6]', bg: 'bg-[#3b82f6]/20', border: 'border-[#3b82f6]/50' }
  return { text: 'text-[#ef4444]', bg: 'bg-[#ef4444]/20', border: 'border-[#ef4444]/50' }
}

function ScoreBar({ value, label }: { value: number; label: string }) {
  const c = scoreColor(value)
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
        <span className="text-[#9ca3af]">{label}</span>
        <span className={c.text}>{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${c.bg.replace('/20', '')} opacity-80`}
          style={{ width: `${Math.min(value, 100)}%`, backgroundColor: value >= 75 ? '#10b981' : value >= 45 ? '#3b82f6' : '#ef4444' }}
        />
      </div>
    </div>
  )
}

function BenchmarkPanel() {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchBenchmarks = async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true)
    try {
      const res = await fetch(`/api/benchmarks${refresh ? '?refresh=true' : ''}`)
      if (res.ok) {
        const data = await res.json()
        setReport(data.report)
      }
    } catch (e) {
      console.error('[BenchmarkPanel]', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchBenchmarks() }, [])

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-8 shadow-sm animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#2d2d2d]">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-[#3b82f6]" />
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">AI Governance Benchmark</h2>
            <p className="text-sm text-[var(--text-secondary)] font-mono mt-0.5">Cross-model reliability, safety and governance index</p>
          </div>
        </div>
        <button
          onClick={() => fetchBenchmarks(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 border border-[#444] hover:border-[#3b82f6] text-[#9ca3af] hover:text-[#3b82f6] rounded text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Recompute
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 animate-pulse">
          <Activity className="w-8 h-8 text-[#555] animate-spin" />
        </div>
      ) : !report || report.models.length === 0 ? (
        <div className="text-center py-16">
          <BarChart3 className="w-10 h-10 text-[#333] mx-auto mb-3" />
          <p className="text-xs font-black uppercase tracking-widest text-[#555]">No benchmark data</p>
          <p className="text-[10px] text-[#444] font-mono mt-1">Complete governance sessions to generate benchmark metrics.</p>
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-5 text-center">
              <Trophy className="w-5 h-5 mx-auto mb-2 text-[#10b981]" />
              <p className="text-[9px] font-black uppercase tracking-widest text-[#555] mb-1">Top Model</p>
              <p className="text-sm font-bold text-white truncate">{report.top_model ?? '—'}</p>
            </div>
            <div className={`bg-[#111] border rounded-xl p-5 text-center ${scoreColor(report.avg_governance_index).border}`}>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#555] mb-1">Avg Governance Index</p>
              <p className={`text-3xl font-black ${scoreColor(report.avg_governance_index).text}`}>{report.avg_governance_index.toFixed(1)}</p>
            </div>
            <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-5 text-center">
              <Cpu className="w-5 h-5 mx-auto mb-2 text-[#3b82f6]" />
              <p className="text-[9px] font-black uppercase tracking-widest text-[#555] mb-1">Models Tracked</p>
              <p className="text-3xl font-black text-white">{report.models.length}</p>
            </div>
          </div>

          {/* Per-model breakdown */}
          <div className="space-y-6">
            {report.models.map((model: any) => (
              <div key={model.model_name} className="bg-[#111] border border-[#2d2d2d] rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-sm font-bold text-white font-mono">{model.model_name}</span>
                  <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${
                    scoreColor(model.governance_index).text
                  } ${scoreColor(model.governance_index).bg} ${scoreColor(model.governance_index).border}`}>
                    Index {model.governance_index.toFixed(1)}
                  </span>
                </div>
                <div className="space-y-4">
                  <ScoreBar value={model.reliability_score} label="Model Reliability" />
                  <ScoreBar value={model.safety_score} label="Safety Score" />
                  <ScoreBar value={model.policy_adherence} label="Policy Adherence" />
                  <ScoreBar value={100 - model.hallucination_rate} label="Hallucination Resistance" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Governance Maturity Panel ─────────────────────────────────────────────

function GovernanceMaturityPanel() {
    const [maturityData, setMaturityData] = useState<any>(null);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const fetchMaturity = async () => {
            try {
                const res = await fetch('/api/governance/maturity');
                if (res.ok) {
                    const data = await res.json();
                    setMaturityData(data);
                }
            } catch (error) {
                console.error("Failed to load maturity index:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMaturity();
    }, []);

    const getColorClass = (score: number) => {
        if (score >= 80) return { text: 'text-[#10b981]', bg: 'bg-[#10b981]/20', border: 'border-[#10b981]/50' };
        if (score >= 50) return { text: 'text-[#3b82f6]', bg: 'bg-[#3b82f6]/20', border: 'border-[#3b82f6]/50' };
        return { text: 'text-[#ef4444]', bg: 'bg-[#ef4444]/20', border: 'border-[#ef4444]/50' };
    };

    if (loading) {
        return (
            <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-8 shadow-sm flex items-center justify-center animate-pulse min-h-[300px]">
                <Activity className="w-8 h-8 text-[#555] animate-spin" />
            </div>
        );
    }

    if (!maturityData) return null;

    const mainColor = getColorClass(maturityData.maturity_score);

    return (
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-8 shadow-sm animate-fade-in-up">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#2d2d2d]">
                <div>
                     <div className="flex items-center gap-3 mb-2">
                        <Target className={`w-6 h-6 ${mainColor.text}`} />
                        <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Governance Maturity Index</h2>
                     </div>
                     <p className="text-sm text-[var(--text-secondary)] font-mono">Real-time organizational posture against composite policy and drift bounds.</p>
                </div>
                <div className={`shrink-0 flex items-center justify-center w-24 h-24 rounded-full border-4 ${mainColor.border} bg-[#111]`}>
                     <span className={`text-3xl font-black ${mainColor.text}`}>{maturityData.maturity_score}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Policy Coverage', value: maturityData.metrics.policy_coverage, icon: ShieldCheck },
                    { label: 'Drift Stability', value: maturityData.metrics.drift_stability, icon: Activity },
                    { label: 'Risk Exposure', value: maturityData.metrics.risk_exposure, icon: ShieldAlert },
                    { label: 'Incident Frequency', value: maturityData.metrics.incident_frequency, icon: Cpu },
                ].map((metric, idx) => {
                    const metricColor = getColorClass(metric.value);
                    const Icon = metric.icon;
                    return (
                        <div key={idx} className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 flex flex-col items-center justify-center text-center">
                            <Icon className={`w-5 h-5 mb-3 ${metricColor.text}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#9ca3af] mb-1">{metric.label}</span>
                            <span className={`text-xl font-mono font-bold ${metricColor.text}`}>{metric.value}%</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function ReportsPage() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 md:p-10 space-y-10 animate-[fadeIn_.5s_ease-out]">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--border-color)] pb-10 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-white to-[var(--text-secondary)] bg-clip-text text-transparent">
            Governance Reports
          </h1>
          <p className="text-base text-[var(--text-secondary)] font-medium max-w-3xl leading-relaxed">
            Generate deterministic governance intelligence reports. Configure your metrics, date range, and format to export mission-critical analytics.
          </p>
        </div>
        <div className="p-4 bg-[var(--accent-soft)] rounded-2xl border border-[var(--accent)]/20">
          <FileText className="w-8 h-8 text-[var(--accent)]" />
        </div>
      </div>

      <div className="animate-[fadeIn_.4s_ease-out]">
        <ReportBuilder />
      </div>

      <GovernanceMaturityPanel />

      <BenchmarkPanel />

      <CostIntelligencePanel />

       {/* Audit Chain Export Tools */}
       <div className="mt-12 bg-[#111] border border-[#2d2d2d] rounded-2xl p-8 shadow-sm animate-fade-in-up">
         <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-6 h-6 text-[#10b981]" />
            <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Governance Event Ledger</h2>
         </div>
         <p className="text-sm text-[var(--text-secondary)] mb-8">
           Export cryptographically bound audit chains. Every recorded payload maps SHA-256 historical sequences secured by Org HMAC signatures proving zero-manipulation to auditors.
         </p>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-[#1a1a1a] rounded-xl border border-[#2d2d2d] flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[var(--text-primary)] tracking-wide uppercase text-sm mb-2">Audit Chain Export</h3>
                <p className="text-[11px] text-[var(--text-secondary)] font-mono leading-relaxed">
                  Extracts the raw ledger array mapping `previous_hash` and `current_hash` bounds directly from the core. Ideal for third-party verifiers mapping signature drops securely.
                </p>
              </div>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/governance/ledger');
                    const json = await res.json();
                    const blob = new Blob([JSON.stringify(json.timeline, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = `facttic-audit-chain-${Date.now()}.json`; a.click();
                  } catch(e) { console.error(e) }
                }}
                className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-[var(--bg-primary)] border border-[#3b82f6]/50 text-[#3b82f6] hover:bg-[#3b82f6]/20 text-xs font-black uppercase tracking-widest rounded transition-all">
                <Download className="w-4 h-4" /> Download Raw Ledger
              </button>
            </div>

            <div className="p-6 bg-[#1a1a1a] rounded-xl border border-[#2d2d2d] flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[var(--text-primary)] tracking-wide uppercase text-sm mb-2">Evidence Package Builder</h3>
                <p className="text-[11px] text-[var(--text-secondary)] font-mono leading-relaxed">
                  Compiles a certified execution sequence packaging risk artifacts, behavior maps, and the signature chain verifying structural integrity across temporal evaluation boundaries.
                </p>
              </div>
              <button 
                onClick={async (e) => {
                  const btn = e.currentTarget;
                  const originalText = btn.innerHTML;
                  btn.innerHTML = '<span class="animate-pulse">Building Package...</span>';
                  btn.disabled = true;
                  try {
                    // Extracting the last 30 days as standard payload range for the quick-export bound
                    const now = new Date();
                    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    const res = await fetch('/api/evidence/generate', {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({ 
                           org_id: 'dbad3ca2-3907-4279-9941-8f55c3c0efdc', // Natively bound via middleware in production
                           timeframe_start: thirtyDaysAgo.toISOString(),
                           timeframe_end: now.toISOString(),
                           report_type: 'AI_GOVERNANCE'
                       })
                    });
                    const json = await res.json();
                    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = `facttic-evidence-package-${Date.now()}.json`; a.click();
                  } catch(err) { console.error(err); }
                  finally { btn.innerHTML = originalText; btn.disabled = false; }
                }}
                className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-[var(--bg-primary)] border border-[#10b981]/50 text-[#10b981] hover:bg-[#10b981]/20 text-xs font-black uppercase tracking-widest rounded transition-all disabled:opacity-50"
              >
                <FileText className="w-4 h-4" /> Generate Certified Package
              </button>
            </div>
         </div>
       </div>
    </div>
  );
}

// ── Cost Intelligence Panel (Phase 47) ──────────────────────────────────────

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

function CostIntelligencePanel() {
  const [summary, setSummary] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [seeding, setSeeding] = React.useState(false)
  const [expanded, setExpanded] = React.useState<string | null>(null)

  const fetchData = React.useCallback(async (seed = false) => {
    if (seed) setSeeding(true); else setLoading(true)
    try {
      const res = await fetch(`/api/cost/metrics${seed ? '?seed=true' : ''}`)
      if (res.ok) { const d = await res.json(); setSummary(d.summary ?? null) }
    } catch (e) { console.error('[CostPanel]', e) }
    finally { setLoading(false); setSeeding(false) }
  }, [])

  React.useEffect(() => { fetchData() }, [fetchData])

  const effStyle = (e: string) => {
    if (e === 'efficient') return { color: '#10b981', badge: 'text-[#10b981] bg-[#10b981]/20 border-[#10b981]/50' }
    if (e === 'moderate')  return { color: '#3b82f6', badge: 'text-[#3b82f6] bg-[#3b82f6]/20 border-[#3b82f6]/50' }
    return                        { color: '#ef4444', badge: 'text-[#ef4444] bg-[#ef4444]/20 border-[#ef4444]/50' }
  }

  const barData = (summary?.models ?? []).map((m: any) => ({
    name: m.model_name.replace('claude-3-5-', 'claude-').replace('-turbo', ''),
    cost: m.total_cost_usd,
  }))

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#2d2d2d]">
        <div className="flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-[#10b981]" />
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase text-white">Cost Intelligence</h2>
            <p className="text-[10px] text-[#9ca3af] font-mono mt-0.5">30-day AI cost efficiency — per model, per risk point.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchData(true)} disabled={seeding}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#444] hover:border-[#10b981] text-[#555] hover:text-[#10b981] rounded text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50">
            {seeding ? <Activity className="w-3 h-3 animate-spin" /> : <DollarSign className="w-3 h-3" />} Seed Demo
          </button>
          <button onClick={() => fetchData()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#444] hover:border-[#3b82f6] text-[#9ca3af] hover:text-[#3b82f6] rounded text-[9px] font-black uppercase tracking-widest transition-colors">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><DollarSign className="w-7 h-7 text-[#555] animate-bounce" /></div>
      ) : !summary || summary.models.length === 0 ? (
        <div className="text-center py-12">
          <DollarSign className="w-10 h-10 text-[#333] mx-auto mb-3" />
          <p className="text-xs font-black uppercase tracking-widest text-[#555]">No cost data yet</p>
          <p className="text-[10px] text-[#444] font-mono mt-1">Click Seed Demo to populate 4-model demo data.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {([
              { label: 'Total Cost',    val: '$' + Number(summary.total_cost_usd).toFixed(4),      color: '#fff' },
              { label: 'Total Tokens',  val: summary.total_tokens.toLocaleString(),                color: '#9ca3af' },
              { label: '$/Session',     val: '$' + Number(summary.avg_cost_per_session).toFixed(5), color: '#3b82f6' },
              { label: 'Top Efficient', val: summary.most_efficient_model.split('-')[0],            color: '#10b981' },
            ] as {label:string;val:string;color:string}[]).map(({ label, val, color }) => (
              <div key={label} className="bg-[#111] border border-[#2d2d2d] rounded-xl p-3 text-center">
                <p className="text-[8px] font-black uppercase tracking-widest text-[#555] mb-1">{label}</p>
                <p className="text-sm font-black" style={{ color }}>{val}</p>
              </div>
            ))}
          </div>
          <div className="mb-6">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#555] mb-3">Total Cost per Model (USD)</p>
            <ResponsiveContainer width="100%" height={90}>
              <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -24 }}>
                <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#555' }} />
                <YAxis tick={{ fontSize: 8, fill: '#555' }} />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #2d2d2d', fontSize: 10 }}
                  formatter={(v: any) => ['$' + Number(v).toFixed(4), 'Cost']} />
                <Bar dataKey="cost" radius={[3,3,0,0]} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mb-6 space-y-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#555] mb-3">Risk-to-Cost Ratio</p>
            {summary.models.map((m: any) => {
              const s = effStyle(m.efficiency)
              const maxRatio = Math.max(...summary.models.map((x: any) => Number(x.cost_per_risk_point) || 0), 1)
              const pct = Math.min(100, ((Number(m.cost_per_risk_point) || 0) / maxRatio) * 100)
              return (
                <div key={m.model_name}>
                  <div className="flex justify-between text-[9px] mb-1">
                    <span className="font-mono text-[#9ca3af] truncate max-w-[160px]">{m.model_name}</span>
                    <span className={`px-1.5 py-0.5 rounded border text-[8px] font-black uppercase ${s.badge}`}>{m.efficiency}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#222] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: pct + '%', backgroundColor: s.color }} />
                    </div>
                    <span className="text-[8px] font-mono text-[#555] w-16 text-right">${Number(m.cost_per_risk_point).toFixed(5)}/pt</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="space-y-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#555]">Model Details</p>
            {summary.models.map((m: any) => {
              const s = effStyle(m.efficiency)
              const isOpen = expanded === m.model_name
              return (
                <div key={m.model_name} className="bg-[#111] border border-[#2d2d2d] rounded-xl overflow-hidden">
                  <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1a1a1a] transition-colors"
                    onClick={() => setExpanded(isOpen ? null : m.model_name)}>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black font-mono text-white">{m.model_name}</span>
                      <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase ${s.badge}`}>{m.efficiency} {m.efficiency_score}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black" style={{ color: s.color }}>${Number(m.total_cost_usd).toFixed(4)}</span>
                      <span className="text-[#444] text-xs">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-[#2d2d2d]">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 mb-4">
                        {[
                          { label: 'Tokens',    val: m.total_tokens.toLocaleString() },
                          { label: 'Sessions',  val: m.conversation_count },
                          { label: 'Avg Risk',  val: String(m.avg_risk_score) },
                          { label: '$/Session', val: '$' + Number(m.cost_per_conversation).toFixed(5) },
                        ].map(({ label, val }) => (
                          <div key={label} className="bg-[#1a1a1a] rounded p-2.5 text-center">
                            <p className="text-[8px] font-black uppercase tracking-widest text-[#555] mb-0.5">{label}</p>
                            <p className="text-xs font-black text-white">{val}</p>
                          </div>
                        ))}
                      </div>
                      {m.daily_trend?.length > 1 && (
                        <>
                          <p className="text-[8px] font-black uppercase tracking-widest text-[#555] mb-2">Daily Cost Trend</p>
                          <ResponsiveContainer width="100%" height={60}>
                            <LineChart data={m.daily_trend} margin={{ top: 0, right: 0, bottom: 0, left: -28 }}>
                              <XAxis dataKey="date" tick={{ fontSize: 7, fill: '#555' }} tickFormatter={(d: string) => d.slice(5)} />
                              <YAxis tick={{ fontSize: 7, fill: '#555' }} />
                              <Tooltip contentStyle={{ background: '#111', border: '1px solid #2d2d2d', fontSize: 9 }}
                                formatter={(v: any) => ['$' + Number(v).toFixed(5), 'Cost']} />
                              <Line type="monotone" dataKey="cost_usd" stroke={s.color} strokeWidth={1.5} dot={{ r: 1.5, fill: s.color }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

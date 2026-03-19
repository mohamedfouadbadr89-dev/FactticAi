'use client'

import React from 'react'
import { 
  Bot, 
  Cpu, 
  Activity, 
  ShieldAlert, 
  Search, 
  Zap, 
  Terminal, 
  Play, 
  Pause, 
  ShieldX, 
  Clock3,
  BarChart3,
  LayoutGrid,
  AlertTriangle,
  CheckCircle2,
  GitCommitHorizontal,
  ArrowRight
} from 'lucide-react'
import { 
  BarChart, Bar, 
  LineChart, Line, 
  AreaChart, Area, 
  XAxis, YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend, 
  PieChart, Pie, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis
} from 'recharts'

// ── Mock Data for Initial Render ─────────────────────────────────────────

const AGENT_STATS = [
  { name: 'Active Agents', value: 12, icon: Bot, color: '#3b82f6' },
  { name: 'Total Steps (24h)', value: 1420, icon: Activity, color: '#10b981' },
  { name: 'Blocked Tools', value: 8, icon: ShieldX, color: '#ef4444' },
  { name: 'Avg Risk Score', value: 12.4, icon: ShieldAlert, color: '#f59e0b' },
]

import { useInteractionMode } from '@/store/interactionMode';
import { useRouter } from 'next/navigation';

// ── Components ──────────────────────────────────────────────────────────

export default function AgentsPage() {
  const { mode } = useInteractionMode();
  const router = useRouter();
  const [sessions, setSessions] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [seeding, setSeeding] = React.useState(false)

  const fetchData = React.useCallback(async (seed = false) => {
    if (seed) setSeeding(true); else setLoading(true)
    try {
      if (seed) {
        await fetch('/api/agents/step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seed: true })
        })
      }

      const res = await fetch('/api/agents/sessions')
      if (res.ok) {
        const json = await res.json()
        setSessions(json)
      }
    } catch (e) {
      console.error('[AgentsPage]', e)
    } finally {
      setLoading(false)
      setSeeding(false)
    }
  }, [])

  const controlSession = React.useCallback(async (sessionId: string, action: 'resume' | 'block') => {
    try {
      await fetch('/api/agents/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, action })
      })
      await fetchData()
    } catch (e) {
      console.error('[AgentsPage] control', e)
    }
  }, [fetchData])

  React.useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)] p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] flex items-center justify-center shadow-2xl">
            <Bot className="w-6 h-6 text-[#3b82f6]" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase">
              {mode === 'voice' ? 'Voice Agent Orchestration' : 'AI Agent Control'}
            </h1>
            <p className="text-[10px] text-[var(--text-secondary)] font-mono tracking-widest uppercase mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" /> 
              {mode === 'voice' ? 'Audio Protocol Guardrails Active' : 'Real-time monitoring / Tool Usage Guardrails Active'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard/gateway')} className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] hover:underline">Gateway →</button>
          <button onClick={() => router.push('/dashboard/observability')} className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] hover:underline">Observability →</button>
          <button
            onClick={() => fetchData(true)}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-[#3b82f6] text-[#9ca3af] hover:text-[#3b82f6] rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {seeding ? <Activity className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            Spawn Demo Agent
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {AGENT_STATS.map((stat) => (
          <div key={stat.name} className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl p-6 relative overflow-hidden group hover:border-[var(--border-primary)] transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#3b82f611] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <stat.icon className="w-5 h-5 mb-4" style={{ color: stat.color }} />
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-1">{stat.name}</p>
            <p className="text-2xl font-black">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
        {/* Active Agents Monitor */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
                <LayoutGrid className="w-3 h-3 text-[#3b82f6]" /> Managed Agent Sessions
              </h2>
              <span className="text-[9px] font-mono text-[var(--text-secondary)] uppercase tracking-tighter">Live Sync: ACTIVE</span>
            </div>

            <div className="space-y-4">
              {loading && !sessions.length ? (
                <div className="h-64 flex items-center justify-center animate-pulse text-[var(--text-secondary)]">
                   <Terminal className="w-8 h-8 animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="h-48 border border-dashed border-[var(--border-primary)] rounded-xl flex flex-col items-center justify-center text-[var(--text-secondary)]">
                   <Bot className="w-8 h-8 mb-3 opacity-20" />
                   <p className="text-[10px] font-black uppercase tracking-widest">No active agent workflows detected</p>
                </div>
              ) : sessions.map((s) => (
                <div key={s.id} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-5 group hover:border-[#3b82f644] transition-all">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                         <div className="w-12 h-12 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] flex items-center justify-center">
                            <Bot className="w-6 h-6 text-[#3b82f6]" />
                         </div>
                         <div>
                            <div className="flex items-center gap-2">
                               <h3 className="text-sm font-black text-white">{s.agent_name}</h3>
                               <div className="px-2 py-0.5 rounded text-[8px] font-black bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] uppercase font-mono">
                                  {s.session_id}
                               </div>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                               <div className="flex items-center gap-1.5 text-[9px] font-black text-[var(--text-secondary)] uppercase">
                                  <Clock3 className="w-3 h-3" /> {new Date(s.started_at).toLocaleTimeString()}
                               </div>
                               <div className="flex items-center gap-1.5 text-[9px] font-black text-[var(--text-secondary)] uppercase">
                                  <GitCommitHorizontal className="w-3 h-3" /> {s.steps} steps
                               </div>
                               <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase ${s.risk_score > 50 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
                                  <ShieldAlert className="w-3 h-3" /> Risk: {s.risk_score}%
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="flex items-center gap-4">
                         <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                           s.status === 'running' ? 'bg-[#3b82f611] text-[#3b82f6] border-[#3b82f644]' :
                           s.status === 'blocked' ? 'bg-[#ef444411] text-[#ef4444] border-[#ef444444]' :
                           'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-primary)]'
                         }`}>
                           {s.status}
                         </div>
                         <div className="flex items-center gap-2">
                            <button
                              onClick={() => controlSession(s.id, 'resume')}
                              title="Resume session"
                              className="p-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-[#3b82f6] rounded-lg transition-colors group"
                            >
                               <Play className="w-3 h-3 text-[var(--text-secondary)] group-hover:text-[#3b82f6]" />
                            </button>
                            <button
                              onClick={() => controlSession(s.id, 'block')}
                              title="Block session"
                              className="p-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-[#ef4444] rounded-lg transition-colors group"
                            >
                               <ShieldX className="w-3 h-3 text-[var(--text-secondary)] group-hover:text-[#ef4444]" />
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risk monitor & Tool Usage */}
        <div className="space-y-8">
           <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl p-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-6 flex items-center gap-2">
                 <ShieldAlert className="w-4 h-4" /> Agent Risk Heatmap
              </h3>
              <div className="h-[240px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={[
                      { subject: 'Tool Misuse', A: 45, fullMark: 100 },
                      { subject: 'Looping', A: 20, fullMark: 100 },
                      { subject: 'Data Leak', A: 85, fullMark: 100 },
                      { subject: 'API Poison', A: 35, fullMark: 100 },
                      { subject: 'Hallucin.', A: 65, fullMark: 100 },
                    ]}>
                      <PolarGrid stroke="#2d2d2d" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#555', fontSize: 9, fontWeight: 900 }} />
                      <Radar name="Threat Level" dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
                      <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '10px' }} />
                    </RadarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl p-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-6 flex items-center gap-2">
                 <Cpu className="w-4 h-4" /> Top Tool Triggers
              </h3>
              <div className="space-y-4">
                 {[
                   { name: 'sql_executor', usage: 420 },
                   { name: 'web_search', usage: 310 },
                   { name: 'aws_lambda', usage: 120 },
                   { name: 'internal_api', usage: 85 },
                 ].map((tool) => (
                   <div key={tool.name} className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase">
                         <span className="text-white tracking-widest">{tool.name}</span>
                         <span className="text-[var(--text-secondary)] font-mono">{tool.usage} calls</span>
                      </div>
                      <div className="h-1 bg-[var(--bg-secondary)] rounded-full overflow-hidden border border-[#1a1a1a]">
                         <div className="h-full bg-gradient-to-r from-[#3b82f6] to-[#10b981]" style={{ width: `${(tool.usage / 420) * 100}%` }} />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}

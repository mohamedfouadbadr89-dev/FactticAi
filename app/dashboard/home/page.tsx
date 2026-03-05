'use client'

import React from 'react'
import {
  ShieldCheck,
  Zap,
  Activity,
  Shield,
  BrainCircuit,
  ArrowRight,
  Bot,
  LayoutGrid
} from 'lucide-react'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts'

type OverviewData = {
  health_score: number
  risk_level: string
  metrics: Record<string, number>
  gateway: {
    active_providers: number
  }
  intelligence: {
    model_count: number
    drift_alerts: number
  }
  governance: {
    blocked_responses: number
    total_intercepts: number
  }
  agents: {
    active_agents: number
  }
}

export default function HomePage() {
  const [data, setData] = React.useState<OverviewData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [executiveMode, setExecutiveMode] = React.useState(false)

  React.useEffect(() => {
    fetch('/api/product/overview')
      .then(res => res.json())
      .then(json => {
        setData(json)
        setLoading(false)
      })
      .catch(e => {
        console.error(e)
        setLoading(false)
      })
  }, [])

  if (loading || !data)
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center animate-pulse text-[#333]">
        <Shield className="w-12 h-12 animate-spin" />
      </div>
    )

  const statusColor =
    data.health_score >= 85
      ? '#10b981'
      : data.health_score >= 65
      ? '#3b82f6'
      : '#ef4444'

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">

      {/* Header */}

      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-3">
            <LayoutGrid className="w-8 h-8 text-[#3b82f6]" />
            Facttic v1 Dashboard
          </h1>

          <p className="text-[10px] text-[#555] font-mono tracking-widest uppercase mt-1">
            Unified Control Plane / Enterprise AI Governance
          </p>
        </div>

        <div className="flex items-center gap-4 bg-[#111] p-1 rounded-xl border border-[#2d2d2d]">
          <button
            onClick={() => setExecutiveMode(false)}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              !executiveMode
                ? 'bg-[#3b82f6] text-white'
                : 'text-[#555] hover:text-white'
            }`}
          >
            Engine View
          </button>

          <button
            onClick={() => setExecutiveMode(true)}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              executiveMode
                ? 'bg-[#10b981] text-white'
                : 'text-[#555] hover:text-white'
            }`}
          >
            Executive View
          </button>
        </div>
      </div>

      {/* GRID */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT */}

        <div className="space-y-8">

          {/* HEALTH CARD */}

          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-3xl p-8 relative overflow-hidden">

            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#555]">
                AI Health Index
              </span>

              <div
                className="px-2 py-1 rounded text-[9px] font-black uppercase border"
                style={{
                  borderColor: statusColor + '44',
                  color: statusColor,
                  backgroundColor: statusColor + '11'
                }}
              >
                {data.risk_level} risk
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-8">
              <span
                className="text-7xl font-black tracking-tighter"
                style={{ color: statusColor }}
              >
                {data.health_score}
              </span>

              <span className="text-[10px] font-black text-[#444] uppercase">
                /100
              </span>
            </div>

            <div className="space-y-3">

              {Object.entries(data.metrics || {}).map(([key, val]) => (

                <div key={key} className="flex flex-col gap-1.5">

                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-[#555]">
                    <span>{key}</span>
                    <span>{val}%</span>
                  </div>

                  <div className="h-1 bg-[#111] rounded-full overflow-hidden">

                    <div
                      className="h-full"
                      style={{
                        width: `${val}%`,
                        backgroundColor: statusColor
                      }}
                    />

                  </div>

                </div>

              ))}

            </div>
          </div>

          {/* ENTERPRISE PROTECTION */}

          <div className="bg-[#111] border border-[#2d2d2d] rounded-2xl p-6">

            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#444] mb-4">
              Enterprise Protection
            </h3>

            <div className="grid grid-cols-2 gap-4">

              <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#2d2d2d]">

                <p className="text-[8px] font-black text-[#555] uppercase mb-1">
                  Blocked Responses
                </p>

                <p className="text-xl font-black">
                  {data.governance.blocked_responses}
                </p>

              </div>

              <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#2d2d2d]">

                <p className="text-[8px] font-black text-[#555] uppercase mb-1">
                  Drift Alerts
                </p>

                <p className="text-xl font-black">
                  {data.intelligence.drift_alerts}
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* RIGHT */}

        <div className="lg:col-span-2 space-y-8">

          {/* PILLARS */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* GATEWAY */}

            <PillarCard
              icon={<Zap className="w-5 h-5 text-[#3b82f6]" />}
              title="AI Gateway"
              description="Facttic routes requests across providers optimizing cost, risk, and latency."
              metric={data.gateway.active_providers}
              label="Provider Count"
            />

            {/* INTELLIGENCE */}

            <PillarCard
              icon={<BrainCircuit className="w-5 h-5 text-[#a855f7]" />}
              title="AI Intelligence"
              description="Profiles model behaviour and detects performance drift."
              metric={data.intelligence.model_count}
              label="Models Tracked"
            />

            {/* GOVERNANCE */}

            <PillarCard
              icon={<ShieldCheck className="w-5 h-5 text-[#10b981]" />}
              title="AI Governance"
              description="Real-time policy enforcement for every AI interaction."
              metric={data.governance.total_intercepts}
              label="Intercepts"
            />

            {/* AGENTS */}

            <PillarCard
              icon={<Bot className="w-5 h-5 text-[#f59e0b]" />}
              title="AI Agents"
              description="Control multi-step workflows and tool usage guardrails."
              metric={data.agents.active_agents}
              label="Active Agents"
            />

          </div>

          {/* ACTIVITY CHART */}

          <div className="bg-[#111] border border-[#2d2d2d] rounded-3xl p-8">

            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#555] flex items-center gap-2 mb-6">
              <Activity className="w-4 h-4" />
              Multi-Layer Activity Timeline
            </h3>

            <div className="h-[200px] w-full">

              <ResponsiveContainer width="100%" height="100%">

                <AreaChart
                  data={[
                    { time: '00:00', gateway: 45, governance: 30, intelligence: 20 },
                    { time: '04:00', gateway: 52, governance: 35, intelligence: 25 },
                    { time: '08:00', gateway: 85, governance: 45, intelligence: 30 },
                    { time: '12:00', gateway: 65, governance: 40, intelligence: 35 },
                    { time: '16:00', gateway: 95, governance: 50, intelligence: 45 },
                    { time: '20:00', gateway: 70, governance: 38, intelligence: 30 }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="time" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #2d2d2d', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Area type="monotone" dataKey="gateway" stroke="#3b82f6" fillOpacity={1} fill="url(#colorGateway)" strokeWidth={2} />
                  <Area type="monotone" dataKey="governance" stroke="#10b981" fillOpacity={1} fill="url(#colorGovernance)" strokeWidth={2} />
                  <Area type="monotone" dataKey="intelligence" stroke="#a855f7" fillOpacity={1} fill="url(#colorIntelligence)" strokeWidth={2} />
                  <defs>
                    <linearGradient id="colorGateway" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorGovernance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorIntelligence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PillarCard({
  icon,
  title,
  description,
  metric,
  label
}: {
  icon: React.ReactNode
  title: string
  description: string
  metric: number
  label: string
}) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 hover:border-[#444] transition-all group">

      <div className="flex items-center gap-3 mb-6">

        <div className="p-2 bg-[#111] rounded-lg border border-[#2d2d2d]">
          {icon}
        </div>

        <h2 className="text-xs font-black uppercase tracking-widest">
          {title}
        </h2>

      </div>

      <p className="text-[10px] text-[#555] font-mono leading-relaxed mb-4">
        {description}
      </p>

      <div className="flex items-end justify-between border-t border-[#2d2d2d] pt-4">

        <div>
          <p className="text-[9px] font-black text-[#333] uppercase">
            {label}
          </p>

          <p className="text-lg font-black">
            {metric}
          </p>
        </div>

        <ArrowRight className="w-4 h-4 text-[#333] group-hover:text-white transition-colors" />

      </div>

    </div>
  )
}
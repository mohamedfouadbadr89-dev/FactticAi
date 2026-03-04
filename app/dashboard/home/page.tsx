'use client'

import React from 'react'
import { 
  ShieldCheck, 
  ShieldAlert, 
  Zap, 
  Activity, 
  Shield, 
  Cpu, 
  BrainCircuit, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight,
  Gauge,
  Network,
  GitBranch,
  Bot,
  AlertTriangle,
  LayoutGrid
} from 'lucide-react'
import { 
  AreaChart, Area, 
  XAxis, YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  PieChart, Pie, Cell
} from 'recharts'

export default function HomePage() {
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [executiveMode, setExecutiveMode] = React.useState(false)

  React.useEffect(() => {
    fetch('/api/product/overview')
      .then(res => res.json())
      .then(json => {
        setData(json)
        setLoading(false)
      })
      .catch(e => console.error(e))
  }, [])

  if (loading || !data) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center animate-pulse text-[#333]"><Shield className="w-12 h-12 animate-spin" /></div>

  const statusColor = data.health_score >= 85 ? '#10b981' : data.health_score >= 65 ? '#3b82f6' : '#ef4444'

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-3">
             <LayoutGrid className="w-8 h-8 text-[#3b82f6]" /> Facttic v1 Dashboard
          </h1>
          <p className="text-[10px] text-[#555] font-mono tracking-widest uppercase mt-1">Unified Control Plane / Enterprise AI Governance</p>
        </div>
        <div className="flex items-center gap-4 bg-[#111] p-1 rounded-xl border border-[#2d2d2d]">
           <button 
             onClick={() => setExecutiveMode(false)}
             className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!executiveMode ? 'bg-[#3b82f6] text-white' : 'text-[#555] hover:text-white'}`}
           >
             Engine View
           </button>
           <button 
             onClick={() => setExecutiveMode(true)}
             className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${executiveMode ? 'bg-[#10b981] text-white' : 'text-[#555] hover:text-white'}`}
           >
             Executive View
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Health & Executive Summary */}
        <div className="space-y-8">
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#10b98111] to-transparent opacity-50" />
            
            <div className="flex items-center justify-between mb-6">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#555]">AI Health Index</span>
               <div className={`px-2 py-1 rounded text-[9px] font-black uppercase border`} style={{ borderColor: statusColor + '44', color: statusColor, backgroundColor: statusColor + '11' }}>
                  {data.risk_level} risk
               </div>
            </div>

            <div className="flex items-baseline gap-2 mb-8">
               <span className="text-7xl font-black tracking-tighter" style={{ color: statusColor }}>{data.health_score}</span>
               <span className="text-[10px] font-black text-[#444] uppercase">/ 100</span>
            </div>

            <div className="space-y-3">
               {Object.entries(data.metrics).map(([key, val]: any) => (
                 <div key={key} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-[#555]">
                       <span>{key}</span>
                       <span>{val}%</span>
                    </div>
                    <div className="h-1 bg-[#111] rounded-full overflow-hidden">
                       <div className="h-full" style={{ width: `${val}%`, backgroundColor: statusColor }} />
                    </div>
                 </div>
               ))}
            </div>
          </div>

          <div className="bg-[#111] border border-[#2d2d2d] rounded-2xl p-6">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#444] mb-4">Enterprise Protection</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#2d2d2d]">
                   <p className="text-[8px] font-black text-[#555] uppercase mb-1">Blocked Reponses</p>
                   <p className="text-xl font-black">{data.governance.blocked_responses}</p>
                </div>
                <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#2d2d2d]">
                   <p className="text-[8px] font-black text-[#555] uppercase mb-1">Drift Alerts</p>
                   <p className="text-xl font-black">{data.intelligence.drift_alerts}</p>
                </div>
             </div>
          </div>
        </div>

        {/* Center/Right Column: Pillar Visualization */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Gateway Pillar */}
             <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 hover:border-[#3b82f644] transition-all group">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2 bg-[#111] rounded-lg border border-[#2d2d2d] group-hover:border-[#3b82f644] transition-colors">
                      <Zap className="w-5 h-5 text-[#3b82f6]" />
                   </div>
                   <h2 className="text-xs font-black uppercase tracking-widest">AI Gateway</h2>
                </div>
                <div className="space-y-4">
                   <p className="text-[10px] text-[#555] font-mono leading-relaxed">Facttic acts as an intelligent routing brain selecting models based on cost, risk, and latency.</p>
                   <div className="flex items-end justify-between border-t border-[#2d2d2d] pt-4">
                      <div>
                         <p className="text-[9px] font-black text-[#333] uppercase">Provider Count</p>
                         <p className="text-lg font-black">{data.gateway.active_providers}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#333] group-hover:text-[#3b82f6] transition-colors" />
                   </div>
                </div>
             </div>

             {/* Intelligence Pillar */}
             <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 hover:border-[#a855f744] transition-all group">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2 bg-[#111] rounded-lg border border-[#2d2d2d] group-hover:border-[#a855f744] transition-colors">
                      <BrainCircuit className="w-5 h-5 text-[#a855f7]" />
                   </div>
                   <h2 className="text-xs font-black uppercase tracking-widest">AI Intelligence</h2>
                </div>
                <div className="space-y-4">
                   <p className="text-[10px] text-[#555] font-mono leading-relaxed">Aggregating global signals to profile model behavior and detect performance drift.</p>
                   <div className="flex items-end justify-between border-t border-[#2d2d2d] pt-4">
                      <div>
                         <p className="text-[9px] font-black text-[#333] uppercase">Models Tracked</p>
                         <p className="text-lg font-black">{data.intelligence.model_count}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#333] group-hover:text-[#a855f7] transition-colors" />
                   </div>
                </div>
             </div>

             {/* Governance Pillar */}
             <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 hover:border-[#10b98144] transition-all group">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2 bg-[#111] rounded-lg border border-[#2d2d2d] group-hover:border-[#10b98144] transition-colors">
                      <ShieldCheck className="w-5 h-5 text-[#10b981]" />
                   </div>
                   <h2 className="text-xs font-black uppercase tracking-widest">AI Governance</h2>
                </div>
                <div className="space-y-4">
                   <p className="text-[10px] text-[#555] font-mono leading-relaxed">Real-time policy enforcement and autonomous intervention for all AI interactions.</p>
                   <div className="flex items-end justify-between border-t border-[#2d2d2d] pt-4">
                      <div>
                         <p className="text-[9px] font-black text-[#333] uppercase">Intercepts</p>
                         <p className="text-lg font-black">{data.governance.total_intercepts}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#333] group-hover:text-[#10b981] transition-colors" />
                   </div>
                </div>
             </div>

             {/* Agents Pillar */}
             <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 hover:border-[#f59e0b44] transition-all group">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2 bg-[#111] rounded-lg border border-[#2d2d2d] group-hover:border-[#f59e0b44] transition-colors">
                      <Bot className="w-5 h-5 text-[#f59e0b]" />
                   </div>
                   <h2 className="text-xs font-black uppercase tracking-widest">AI Agents</h2>
                </div>
                <div className="space-y-4">
                   <p className="text-[10px] text-[#555] font-mono leading-relaxed">Control multi-step agent workflows, tool usage, and reasoning chain guardrails.</p>
                   <div className="flex items-end justify-between border-t border-[#2d2d2d] pt-4">
                      <div>
                         <p className="text-[9px] font-black text-[#333] uppercase">Active Agents</p>
                         <p className="text-lg font-black">{data.agents.active_agents}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#333] group-hover:text-[#f59e0b] transition-colors" />
                   </div>
                </div>
             </div>
          </div>

          <div className="bg-[#111] border border-[#2d2d2d] rounded-3xl p-8 relative group overflow-hidden">
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '16px 16px' }} />
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#555] flex items-center gap-2">
                   <Activity className="w-4 h-4 " /> Multi-Layer Activity Timeline
                </h3>
             </div>
             <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={[
                     { time: '00:00', gateway: 45, governance: 30, intelligence: 20 },
                     { time: '04:00', gateway: 52, governance: 35, intelligence: 25 },
                     { time: '08:00', gateway: 85, governance: 45, intelligence: 40 },
                     { time: '12:00', gateway: 65, governance: 40, intelligence: 35 },
                     { time: '16:00', gateway: 95, governance: 50, intelligence: 45 },
                     { time: '20:00', gateway: 70, governance: 38, intelligence: 30 },
                   ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis dataKey="time" hide />
                      <YAxis hide />
                      <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '10px' }} />
                      <Area type="monotone" dataKey="gateway" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                      <Area type="monotone" dataKey="governance" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                      <Area type="monotone" dataKey="intelligence" stackId="1" stroke="#a855f7" fill="#a855f7" fillOpacity={0.1} />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client";

import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { Activity, Clock, ShieldCheck } from 'lucide-react';
import { demoSignals } from '@/lib/demo/demoSignals';

interface Props {
  orgId: string;
}

export default function GovernanceHealthTimeline({ orgId }: Props) {
  const [range, setRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard/governance/health-timeline?org_id=${orgId}&range=${range}`);
        const json = await res.json();
        
        if (json.timeline && json.timeline.length > 0) {
          setData(json.timeline);
        } else {
          // Fallback to demo signals if no real data
          setData(demoSignals.riskTrend.map(d => ({
            timestamp: new Date(Date.now() + d.hour * 3600000).toISOString(),
            risk: d.score,
            health: 100 - d.score
          })));
        }
      } catch (e) {
        console.error("Timeline reach-out failed", e);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orgId, range]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-[#111] border border-[#2d2d2d] p-4 rounded-xl shadow-2xl space-y-2">
          <p className="text-[10px] font-black text-[#555] uppercase tracking-widest leading-none">
            {new Date(d.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
          </p>
          <div className="flex items-center justify-between gap-8">
            <span className="text-[10px] font-bold text-white uppercase">Health Index</span>
            <span className="text-sm font-black text-[#10b981]">{d.health}%</span>
          </div>
          <div className="flex items-center justify-between gap-8 opacity-60">
            <span className="text-[9px] font-bold text-[#555] uppercase">Risk Tension</span>
            <span className="text-xs font-bold text-[#ef4444]">{d.risk}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#151515] border border-[#2d2d2d] rounded-3xl p-8 h-[400px] flex flex-col group">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#10b981]" /> Governance Health Velocity
        </h3>
        
        <div className="flex bg-[#111] rounded-lg p-1 border border-[#222]">
          {(['24h', '7d', '30d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${
                range === r ? 'bg-[#10b981] text-white shadow-lg' : 'text-[#444] hover:text-[#777]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
            <XAxis 
              dataKey="timestamp" 
              hide 
            />
            <YAxis 
              domain={[0, 100]} 
              stroke="#333" 
              fontSize={10} 
              tickFormatter={(v) => `${v}%`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="health" 
              stroke="#10b981" 
              fillOpacity={1} 
              fill="url(#colorHealth)" 
              strokeWidth={3}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 pt-6 border-t border-[#222] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[9px] font-black text-[#555] uppercase tracking-[0.2em]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /> Optimal Stability
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-black text-[#555] uppercase tracking-[0.2em]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" /> Risk Contagion
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[#444] font-mono">
          <Clock className="w-3 h-3" /> Sample: {data.length} pts
        </div>
      </div>
    </div>
  );
}

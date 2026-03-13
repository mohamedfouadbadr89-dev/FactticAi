"use client";

import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';
import { Target, ShieldCheck, Zap, History } from 'lucide-react';
import { Tooltip as InfoTooltip } from '@/components/ui/Tooltip';

/* ─── Mock Data ─── */
const COMPLIANCE_TREND = [
  { time: '08:00', compliance: 94 },
  { time: '10:00', compliance: 96 },
  { time: '12:00', compliance: 95 },
  { time: '14:00', compliance: 98 },
  { time: '16:00', compliance: 97 },
  { time: '18:00', compliance: 99 },
];

const CATEGORY_SCORES = [
  { subject: 'Privacy', score: 88, fullMark: 100 },
  { subject: 'Safety', score: 94, fullMark: 100 },
  { subject: 'Reliability', score: 78, fullMark: 100 },
  { subject: 'Alignment', score: 91, fullMark: 100 },
  { subject: 'Security', score: 85, fullMark: 100 },
];

const DRIFT_DISTR = [
  { name: 'Monday', value: 2.1 },
  { name: 'Tuesday', value: 1.8 },
  { name: 'Wednesday', value: 3.4 },
  { name: 'Thursday', value: 2.7 },
  { name: 'Friday', value: 4.1 },
  { name: 'Saturday', value: 1.2 },
  { name: 'Sunday', value: 0.9 },
];

export default function AdvancedAnalytics() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Policy Adherence Trend */}
      <div className="card h-[400px] flex flex-col">
        <div className="card-header p-5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h3 className="card-title text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              Policy Adherence Over Time
              <InfoTooltip side="right" content="Graphs the aggregate compliance score (0-100) calculated from all live evaluations evaluated against core behavioral policies over the trailing 12 hour window." />
            </h3>
          </div>
        </div>
        <div className="flex-1 p-5">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={COMPLIANCE_TREND}>
              <defs>
                <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(16, 185, 129)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="rgb(16, 185, 129)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="time" stroke="var(--text-secondary)" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis domain={[80, 100]} stroke="var(--text-secondary)" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Area type="monotone" dataKey="compliance" stroke="#10b981" fillOpacity={1} fill="url(#colorCompliance)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Evaluation Scores by Category */}
      <div className="card h-[400px] flex flex-col">
        <div className="card-header p-5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            <h3 className="card-title text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              Governance Dimension Scores
              <InfoTooltip side="right" content="A multi-dimensional breakdown of the current system health across critical axes (Privacy, Safety, Reliability, Alignment, Security). A perfectly balanced system approaches a full regular polygon." />
            </h3>
          </div>
        </div>
        <div className="flex-1 p-5 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={CATEGORY_SCORES}>
              <PolarGrid stroke="var(--border-color)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Score"
                dataKey="score"
                stroke="var(--accent)"
                fill="var(--accent)"
                fillOpacity={0.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Drift Frequency distribution */}
      <div className="card h-[400px] flex flex-col">
        <div className="card-header p-5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h3 className="card-title text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              Behavioral Drift Magnitude
              <InfoTooltip side="right" content="Measures the statistical deviation of agent responses from the baseline reference sets across the rolling 7-day period. Values > 3 indicate significant semantic drift requiring attention." />
            </h3>
          </div>
        </div>
        <div className="flex-1 p-5">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={DRIFT_DISTR}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis stroke="var(--text-secondary)" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {DRIFT_DISTR.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.value > 3 ? '#ef4444' : 'var(--accent)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Decision Logs / Audit Trail Placeholder */}
      <div className="card h-[400px] flex flex-col">
        <div className="card-header p-5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" />
            <h3 className="card-title text-sm font-bold uppercase tracking-widest">Audit Trail & Decision Logs</h3>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {[
            { id: 'AUTH-90', action: 'Policy Override', result: 'Rejected', time: '2m ago' },
            { id: 'RULE-12', action: 'Alert Rule Modified', result: 'Success', time: '15m ago' },
            { id: 'GEN-44', action: 'Report Generated', result: 'Success', time: '1h ago' },
            { id: 'EVAL-02', action: 'Deterministic Validation', result: 'Verified', time: '3h ago' },
            { id: 'SYS-01', action: 'Engine Heartbeat', result: 'Healthy', time: '5h ago' },
          ].map((log, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono text-gray-500">{log.id}</span>
                <span className="font-bold">{log.action}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded uppercase text-[9px] font-bold ${
                  log.result === 'Rejected' ? 'bg-red-900/40 text-red-500' : 'bg-emerald-900/40 text-emerald-500'
                }`}>{log.result}</span>
                <span className="text-gray-500">{log.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

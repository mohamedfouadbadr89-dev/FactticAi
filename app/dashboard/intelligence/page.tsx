"use client";

import React, { useState, useEffect } from 'react'
import { isFeatureEnabled } from '@/lib/featureFlags'
import { ComingSoonBlock } from '@/components/layout/ComingSoonBlock'
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, RadialBarChart, RadialBar, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, ZAxis } from 'recharts'
import { Activity, ShieldAlert, Cpu, BrainCircuit, TrendingDown, Clock3, Search, AlertTriangle, Fingerprint, ShieldX, RefreshCw, TrendingUp, Mic, ShieldCheck, Edit3, Globe, Zap, Bot, Gauge, Network, GitBranch } from 'lucide-react'

// Mock fetching hook implementation mapped to real API (Cross Session)
function useCrossSessionData(orgId: string | null) {
  const [data, setData] = useState<{ distribution: any[], patterns: any[], loading: boolean }>({ distribution: [], patterns: [], loading: true });

  useEffect(() => {
    if (!orgId) return;
    fetch('/api/intelligence/cross-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, timeframe: 24 })
    })
      .then(res => res.json())
      .then(res => {
        if (!res.error) {
          setData({
            loading: false,
            distribution: [
              { name: 'Hallucinations', count: res.cluster_distribution.hallucinations, fill: '#ef4444' },
              { name: 'Drift', count: res.cluster_distribution.behavior_drift, fill: '#ef4444' },
              { name: 'Policy Fails', count: res.cluster_distribution.policy, fill: '#3b82f6' }
            ],
            patterns: res.pattern_clusters || []
          });
        }
      })
      .catch((_) => setData({ distribution: [], patterns: [], loading: false }));
  }, [orgId]);

  return data;
}

// Mock fetching hook implementation mapped to real API (Silent Regression)
function useRegressionData(orgId: string | null, modelVersion: string) {
  const [data, setData] = useState<{ signals: any[], timeline: any[], drift: number, severity: string, loading: boolean }>({ signals: [], timeline: [], drift: 0, severity: 'low', loading: true });

  useEffect(() => {
    if (!orgId) return;
    fetch('/api/intelligence/regression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, model_version: modelVersion, timeframe: 24 })
    })
      .then(res => res.json())
      .then(res => {
        if (!res.error) {
          const formattedTimeline = (res.regression_signals || []).map((s: any, index: number) => ({
             time: `t-${index}`,
             hallucinationDrift: s.signal_type === 'hallucination_rate' ? s.delta : 0,
             confidenceDrop: s.signal_type === 'confidence_drop' ? s.delta : 0,
          }));

          setData({
            loading: false,
            signals: res.regression_signals || [],
            drift: res.drift_magnitude,
            severity: res.severity,
            timeline: formattedTimeline.length > 0 ? formattedTimeline : [
                { time: '00:00', hallucinationDrift: 0.05, confidenceDrop: -0.01 }, { time: '12:00', hallucinationDrift: 0.15, confidenceDrop: -0.05 }, { time: '24:00', hallucinationDrift: 0.35, confidenceDrop: -0.15 }
            ]
          });
        }
      })
      .catch((_) => setData({ signals: [], timeline: [], drift: 0, severity: 'low', loading: false }));
  }, [orgId, modelVersion]);

  return data;
}

// Mock fetching hook implementation mapped to real API (Behavior Forensics)
function useForensicsData(sessionId: string | null) {
  const [data, setData] = useState<{ signals: any[], riskBreakdown: any, loading: boolean }>({ signals: [], riskBreakdown: null, loading: true });

  useEffect(() => {
    if (!sessionId) return;
    fetch('/api/forensics/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    })
      .then(res => res.json())
      .then(res => {
        if (!res.error) {
          setData({
            loading: false,
            signals: res.behavior_signals || [],
            riskBreakdown: res.risk_scores || null
          });
        }
      })
      .catch((_) => setData({ signals: [], riskBreakdown: null, loading: false }));
  }, [sessionId]);

  return data;
}

export default function IntelligencePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'evals' | 'guardrails' | 'forensics'>('overview');
  // Mock org id, in deep implementation this is supplied via context
  const { distribution, patterns, loading: crossLoading } = useCrossSessionData('mock-org-id'); 
  const { signals, timeline, drift, severity, loading: regLoading } = useRegressionData('mock-org-id', 'gpt-4'); 
  // Normally triggers via active selection bounds, mock UUID for implementation demonstration
  const { signals: forensicSignals, riskBreakdown, loading: forLoading } = useForensicsData('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'); 

  if (!isFeatureEnabled('advancedIntelligence')) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6 md:p-8">
        <ComingSoonBlock moduleName="Advanced Intelligence" status="RCA_DETERMINISTIC_G1" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold mb-1 text-[var(--text-primary)]">Advanced Intelligence</h1>
          <p className="text-[var(--text-secondary)] text-sm">Next-generation Cross-session behavior & drift patterns.</p>
        </div>
      </div>

      {/* TABS */}
      <div className="border-b border-[#2d2d2d] flex space-x-6 text-sm">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2 border-b-2 font-medium ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('evals')}
          className={`pb-2 border-b-2 font-medium ${activeTab === 'evals' ? 'border-primary text-primary' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          Evaluation Analysis
        </button>
        <button
          onClick={() => setActiveTab('guardrails')}
           className={`pb-2 border-b-2 font-medium ${activeTab === 'guardrails' ? 'border-primary text-primary' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          Alert Guardrails
        </button>
        <button
          onClick={() => setActiveTab('forensics')}
           className={`pb-2 border-b-2 font-medium ${activeTab === 'forensics' ? 'border-primary text-primary' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          Behavior Forensics
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
          {/* Systemic Hallucination Clusters */}
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-[#ef4444]" />
              <h3 className="font-semibold text-[var(--text-primary)]">Systemic Hallucination Clusters</h3>
            </div>
            {crossLoading ? <div className="animate-pulse h-40 bg-[#222] rounded-lg"></div> : (
              <div className="h-48 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distribution.filter(d => d.name === 'Hallucinations')}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Behavioral Drift Clusters */}
           <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-5 h-5 text-[#ef4444]" />
              <h3 className="font-semibold text-[var(--text-primary)]">Behavioral Drift Clusters</h3>
            </div>
            {crossLoading ? <div className="animate-pulse h-40 bg-[#222] rounded-lg"></div> : (
              <div className="h-48 w-full mt-4">
                 <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distribution.filter(d => d.name === 'Drift')}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Policy Failure Patterns */}
           <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-5 h-5 text-[#3b82f6]" />
              <h3 className="font-semibold text-[var(--text-primary)]">Policy Failure Patterns</h3>
            </div>
            {crossLoading ? <div className="animate-pulse h-40 bg-[#222] rounded-lg"></div> : (
              <div className="h-48 w-full mt-4">
                 <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distribution.filter(d => d.name === 'Policy Fails')}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'evals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
           {/* Model Behavior Drift */}
           <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <BrainCircuit className="w-5 h-5 text-[#ef4444]" />
                 <h3 className="font-semibold text-[var(--text-primary)]">Model Behavior Drift</h3>
               </div>
               <span className={`px-2 py-1 text-xs font-semibold rounded ${severity === 'critical' ? 'bg-[#ef4444]/20 text-[#ef4444]' : 'bg-[#10b981]/20 text-[#10b981]'}`}>
                 {severity.toUpperCase()} DRIFT
               </span>
            </div>
            {regLoading ? <div className="animate-pulse h-40 bg-[#222] rounded-lg"></div> : (
              <div className="h-48 w-full mt-4">
                 <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeline}>
                    <defs>
                      <linearGradient id="colorHallucination" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="time" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff' }} />
                    <Area type="monotone" dataKey="hallucinationDrift" stroke="#ef4444" fillOpacity={1} fill="url(#colorHallucination)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            <p className="text-xs text-[var(--text-secondary)] mt-4">Total measured drift magnitude: {(drift * 100).toFixed(2)}% over 24h</p>
          </div>

          <div className="space-y-6">
             {/* Regression Timeline */}
            <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Clock3 className="w-5 h-5 text-[#3b82f6]" />
                <h3 className="font-semibold text-[var(--text-primary)]">Regression Timeline</h3>
              </div>
              <div className="space-y-3">
                {signals.length === 0 && !regLoading && <p className="text-sm text-[var(--text-secondary)]">No silent regressions detected.</p>}
                {signals.map((s, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-[#222] rounded-lg border border-[#333]">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{s.signal_type}</span>
                    <span className="text-xs text-[#ef4444]">+{s.delta}% shift</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confidence Degradation */}
            <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-5 h-5 text-[#ef4444]" />
                <h3 className="font-semibold text-[var(--text-primary)]">Confidence Degradation</h3>
              </div>
              {regLoading ? <div className="animate-pulse h-24 bg-[#222] rounded-lg"></div> : (
                <div className="h-24 w-full mt-4">
                   <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="time" stroke="#888" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff' }} />
                      <Line type="monotone" dataKey="confidenceDrop" stroke="#ef4444" strokeWidth={2} dot={{r:4}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'guardrails' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
           {/* Active Rules Panel */}
           <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm flex flex-col h-full">
            <div className="flex items-center gap-2 mb-6 border-b border-[#2d2d2d] pb-4">
              <ShieldAlert className="w-5 h-5 text-[#10b981]" />
              <h3 className="font-bold text-[var(--text-primary)] text-sm tracking-wide uppercase">Active Governance Guardrails</h3>
            </div>
            
            <div className="space-y-4 flex-1">
              {[
                  { type: 'Safety Violations', threshold: 0.1, action: 'BLOCK' },
                  { type: 'Hallucination Shifts', threshold: 0.6, action: 'WARN' },
                  { type: 'Policy Drift Risk', threshold: 0.8, action: 'ESCALATE' }
              ].map((rule, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#222] rounded-xl border border-[#333]">
                  <div className="mb-2 sm:mb-0">
                     <span className="text-xs font-bold text-[var(--text-primary)] tracking-wide uppercase block">{rule.type}</span>
                     <span className="text-[10px] text-[var(--text-secondary)] font-mono">Intercept Trigger {'>'} {(rule.threshold * 100).toFixed(0)}%</span>
                  </div>
                  <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded border ${
                      rule.action === 'BLOCK' ? 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/50' : 
                      rule.action === 'WARN' ? 'bg-[#ef4444]/20 opacity-70 text-[#ef4444] border-[#ef4444]/50' : 
                      rule.action === 'PASS' ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/50' :
                      'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/50'
                  }`}>
                    {rule.action}
                  </span>
                </div>
              ))}
            </div>
            <button className="mt-6 w-full py-3 bg-[#111] hover:bg-[#222] border border-[#333] text-[var(--text-secondary)] hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest rounded">
               Configure New Bound
            </button>
           </div>

           {/* Execution Metrics Panel */}
           <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm flex flex-col h-full">
            <div className="flex items-center gap-2 mb-6 border-b border-[#2d2d2d] pb-4">
              <Activity className="w-5 h-5 text-[#3b82f6]" />
              <h3 className="font-bold text-[var(--text-primary)] text-sm tracking-wide uppercase">Real-Time Execution Logs (24h)</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
               <div className="p-4 bg-[#222] rounded-xl border border-red-900/30">
                 <div className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mb-1">Responses Blocked</div>
                 <div className="text-3xl font-black text-red-500">14</div>
               </div>
               <div className="p-4 bg-[#222] rounded-xl border border-[#3b82f6]/30">
                 <div className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mb-1">Triggers Executed</div>
                 <div className="text-3xl font-black text-[#3b82f6]">182</div>
               </div>
            </div>

            <div className="flex-1 space-y-3 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent z-10 pointer-events-none h-12 bottom-0 top-auto"></div>
               {[
                 { action: 'BLOCKED', reason: 'CRITICAL INTERCEPT: Exceeded safety_violation threshold', time: 'Just now' },
                 { action: 'WARN', reason: 'WARNING: Exceeded hallucination_risk threshold', time: '12m ago' },
                 { action: 'ESCALATE', reason: 'ESCALATION: Safety override logic triggered', time: '1h ago' },
                 { action: 'BLOCKED', reason: 'CRITICAL INTERCEPT: Exceeded policy_risk threshold', time: '4h ago' },
                 { action: 'BLOCKED', reason: 'CRITICAL INTERCEPT: Exceeded hallucination_risk threshold', time: '5h ago' }
               ].map((log, lidx) => (
                 <div key={lidx} className="flex justify-between items-start text-[11px] p-2 hover:bg-[#222] rounded">
                    <div>
                       <span className={`font-black tracking-wider uppercase mr-2 ${
                           log.action === 'BLOCKED' ? 'text-red-500' :
                           log.action === 'WARN' ? 'text-amber-500' :
                           'text-sky-400'
                       }`}>{log.action}</span>
                       <span className="font-mono text-[var(--text-secondary)]">{log.reason}</span>
                    </div>
                    <span className="text-[9px] font-bold text-gray-600 whitespace-nowrap ml-4 uppercase tracking-widest">{log.time}</span>
                 </div>
               ))}
            </div>
           </div>
         </div>
      )}

      {activeTab === 'forensics' && (
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
           {/* Intent Drift Index */}
           <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
             <div className="flex items-center gap-2 mb-4">
                <Search className="w-5 h-5 text-[#3b82f6]" />
                <h3 className="font-semibold text-[var(--text-primary)]">Intent Drift Index</h3>
             </div>
             {forLoading ? <div className="animate-pulse h-40 w-40 bg-[#222] rounded-full mt-4"></div> : (
               <div className="h-48 w-full relative mt-4">
                 <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                        cx="50%" 
                        cy="50%" 
                        innerRadius="60%" 
                        outerRadius="100%" 
                        barSize={15} 
                        data={[{ name: 'Intent Drift', value: (forensicSignals.find(s => s.signal_type === 'intent_drift')?.signal_score || 0) * 100, fill: riskBreakdown?.max_drift_alert ? '#ef4444' : '#3b82f6' }]}
                        startAngle={180} 
                        endAngle={0}
                    >
                      <RadialBar background={{ fill: '#222' }} dataKey="value" />
                    </RadialBarChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                     <span className={`text-3xl font-black ${riskBreakdown?.max_drift_alert ? 'text-[#ef4444]' : 'text-[#3b82f6]'}`}>
                        {((forensicSignals.find(s => s.signal_type === 'intent_drift')?.signal_score || 0) * 100).toFixed(0)}%
                     </span>
                     <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest mt-1">Drift Value</span>
                 </div>
               </div>
             )}
           </div>

           {/* Boundary & Override Panel */}
           <div className="md:col-span-2 bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm">
             <div className="flex items-center gap-2 mb-6 border-b border-[#2d2d2d] pb-4">
               <Fingerprint className="w-5 h-5 text-[var(--text-primary)]" />
               <h3 className="font-bold text-[var(--text-primary)] text-sm tracking-wide uppercase">AI Behavior Anomalies</h3>
             </div>

             <div className="space-y-6">
                {/* Instruction Override */}
                <div>
                   <div className="flex justify-between items-end mb-2">
                      <div className="flex items-center gap-2">
                         <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
                         <span className="text-sm font-bold text-[var(--text-primary)]">Instruction Override Signals</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-mono">
                          {((forensicSignals.find(s => s.signal_type === 'instruction_override')?.signal_score || 0) * 100).toFixed(1)}% Saturation
                      </span>
                   </div>
                   <div className="w-full bg-[#222] rounded-full h-2.5">
                      <div className="bg-[#ef4444] h-2.5 rounded-full" style={{ width: `${(forensicSignals.find(s => s.signal_type === 'instruction_override')?.signal_score || 0) * 100}%` }}></div>
                   </div>
                   <p className="text-[10px] text-[var(--text-secondary)] mt-2">Measures frequency of explicit system prompt refusal or apology loops breaking requested logic states.</p>
                </div>

                {/* Prompt Violations */}
                <div>
                   <div className="flex justify-between items-end mb-2">
                      <div className="flex items-center gap-2">
                         <ShieldAlert className="w-4 h-4 text-[#10b981]" />
                         <span className="text-sm font-bold text-[var(--text-primary)]">Prompt Boundary Breaches</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-mono">
                          {((forensicSignals.find(s => s.signal_type === 'prompt_violation')?.signal_score || 0) * 100).toFixed(1)}% Leakage
                      </span>
                   </div>
                   <div className="w-full bg-[#222] rounded-full h-2.5">
                      <div className={`h-2.5 rounded-full ${riskBreakdown?.boundary_breach ? 'bg-[#ef4444]' : 'bg-[#10b981]'}`} style={{ width: `${Math.max((forensicSignals.find(s => s.signal_type === 'prompt_violation')?.signal_score || 0) * 100, 2)}%` }}></div>
                   </div>
                   <p className="text-[10px] text-[var(--text-secondary)] mt-2">Explicit extraction or revelation of hidden architectural directives.</p>
                </div>
             </div>
           </div>
         </div>
      )}

      <ModelDriftMonitorPanel />

      <VoiceTelemetryPanel />

      <LiveInterceptsPanel orgId="mock-org-id" />

      <AiGatewayTrafficPanel />

      <ModelBehaviorIntelligencePanel />

      <GlobalIntelligencePanel />

      <AiRoutingIntelligencePanel />

      <RuntimeInterceptsPanel />
    </div>
  )
}
// ── Model Drift Monitor Panel (Phase 44) ─────────────────────────────────────

function ModelDriftMonitorPanel() {
  const [reports, setReports] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [seeding, setSeeding] = React.useState(false)

  const fetchReports = React.useCallback(async () => {
    try {
      const res = await fetch('/api/drift/models')
      if (res.ok) {
        const data = await res.json()
        setReports(data.reports ?? [])
      }
    } catch (e) {
      console.error('[ModelDriftMonitor]', e)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { fetchReports() }, [fetchReports])

  const handleSeed = async () => {
    setSeeding(true)
    try {
      await fetch('/api/drift/models?seed=true')
      await fetchReports()
    } finally {
      setSeeding(false)
    }
  }

  const statusStyle = (status: string) => {
    if (status === 'critical')  return { badge: 'text-[#ef4444] bg-[#ef4444]/20 border-[#ef4444]/50', color: '#ef4444' }
    if (status === 'drifting')  return { badge: 'text-[#f59e0b] bg-[#f59e0b]/20 border-[#f59e0b]/50', color: '#f59e0b' }
    return                               { badge: 'text-[#10b981] bg-[#10b981]/20 border-[#10b981]/50', color: '#10b981' }
  }

  const deltaBadge = (delta: number) =>
    delta > 0 ? `text-[#ef4444]` : delta < 0 ? `text-[#10b981]` : `text-[#555]`

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#2d2d2d]">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-[#f59e0b]" />
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase text-white">Model Drift Monitor</h2>
            <p className="text-[10px] text-[#9ca3af] font-mono mt-0.5">Behavioral drift detection across AI models over time.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#444] hover:border-[#f59e0b] text-[#555] hover:text-[#f59e0b] rounded text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            {seeding ? <Activity className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
            Seed Demo
          </button>
          <button
            onClick={fetchReports}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#444] hover:border-[#3b82f6] text-[#9ca3af] hover:text-[#3b82f6] rounded text-[9px] font-black uppercase tracking-widest transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 animate-pulse">
          <TrendingUp className="w-7 h-7 text-[#555] animate-bounce" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-14">
          <TrendingUp className="w-10 h-10 text-[#333] mx-auto mb-3" />
          <p className="text-xs font-black uppercase tracking-widest text-[#555]">No drift data yet</p>
          <p className="text-[10px] text-[#444] font-mono mt-1 mb-4">Click Seed Demo to populate test data, or record snapshots via the engine.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reports.map((report: any) => {
            const s = statusStyle(report.drift_status)
            const timeline = (report.timeline ?? []).map((t: any, i: number) => ({
              ...t,
              index: i,
              label: new Date(t.recorded_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            }))

            return (
              <div key={report.model_name} className="bg-[#111] border border-[#2d2d2d] rounded-xl p-5">
                {/* Model header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-white font-mono">{report.model_name}</span>
                    <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest ${s.badge}`}>
                      {report.drift_status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#555]">Stability</p>
                    <p className="text-lg font-black" style={{ color: s.color }}>{report.stability_score}%</p>
                  </div>
                </div>

                {/* Current metrics */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {([
                    { label: 'Hallucination',    val: report.latest.hallucination_rate,    delta: report.deltas.hallucination_rate_delta },
                    { label: 'Policy Violation', val: report.latest.policy_violation_rate, delta: report.deltas.policy_violation_delta },
                    { label: 'Confidence Drop',  val: report.latest.confidence_drop,       delta: report.deltas.confidence_delta },
                  ] as { label: string; val: number; delta: number }[]).map(({ label, val, delta }) => (
                    <div key={label} className="bg-[#1a1a1a] rounded-lg p-3">
                      <p className="text-[8px] font-black uppercase tracking-widest text-[#555] mb-0.5">{label}</p>
                      <p className="text-lg font-black text-white">{Number(val).toFixed(1)}%</p>
                      <p className={`text-[9px] font-mono ${deltaBadge(delta)}`}>
                        {delta > 0 ? `+${delta}` : delta}% vs baseline
                      </p>
                    </div>
                  ))}
                </div>

                {/* Drift score bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-1">
                    <span className="text-[#555]">Drift Score</span>
                    <span style={{ color: s.color }}>{Number(report.latest.drift_score).toFixed(1)} / 100</span>
                  </div>
                  <div className="h-2 bg-[#222] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${report.latest.drift_score}%`, backgroundColor: s.color }}
                    />
                  </div>
                </div>

                {/* Timeline chart */}
                {timeline.length > 1 && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#555] mb-2">Drift Score Timeline</p>
                    <ResponsiveContainer width="100%" height={80}>
                      <LineChart data={timeline} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                        <XAxis dataKey="label" tick={{ fontSize: 8, fill: '#555' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: '#555' }} />
                        <Tooltip
                          contentStyle={{ background: '#111', border: '1px solid #2d2d2d', fontSize: 10 }}
                          labelStyle={{ color: '#9ca3af' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="drift_score"
                          stroke={s.color}
                          strokeWidth={2}
                          dot={{ r: 2, fill: s.color }}
                          name="Drift Score"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Voice Telemetry Panel (Phase 45) ──────────────────────────────────

function VoiceTelemetryPanel() {
  const [summaries, setSummaries] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [seeding, setSeeding] = React.useState(false)

  const fetchData = React.useCallback(async (seed = false) => {
    if (seed) setSeeding(true); else setLoading(true)
    try {
      const res = await fetch(`/api/voice/telemetry${seed ? '?seed=true' : ''}`)
      if (res.ok) {
        const data = await res.json()
        setSummaries(data.summaries ?? [])
      }
    } catch (e) {
      console.error('[VoiceTelemetry]', e)
    } finally {
      setLoading(false)
      setSeeding(false)
    }
  }, [])

  React.useEffect(() => { fetchData() }, [fetchData])

  const qualityStyle = (q: string) => {
    if (q === 'bad')     return { color: '#ef4444', badge: 'text-[#ef4444] bg-[#ef4444]/20 border-[#ef4444]/50' }
    if (q === 'warning') return { color: '#3b82f6', badge: 'text-[#3b82f6] bg-[#3b82f6]/20 border-[#3b82f6]/50' }
    return                      { color: '#10b981', badge: 'text-[#10b981] bg-[#10b981]/20 border-[#10b981]/50' }
  }

  const metricBar = (value: number, max: number, color: string, inverted = false) => {
    const pct = Math.min(100, (value / max) * 100)
    const barColor = inverted
      ? pct < 40 ? '#ef4444' : pct < 70 ? '#3b82f6' : '#10b981'
      : pct > 60 ? '#ef4444' : pct > 30 ? '#3b82f6' : '#10b981'
    return (
      <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: barColor }} />
      </div>
    )
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#2d2d2d]">
        <div className="flex items-center gap-3">
          <Mic className="w-5 h-5 text-[#3b82f6]" />
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase text-white">Voice Telemetry</h2>
            <p className="text-[10px] text-[#9ca3af] font-mono mt-0.5">Real-time voice conversation quality — latency, packet loss, audio integrity.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#444] hover:border-[#3b82f6] text-[#555] hover:text-[#3b82f6] rounded text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            {seeding ? <Activity className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
            Seed Demo
          </button>
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#444] hover:border-[#3b82f6] text-[#9ca3af] hover:text-[#3b82f6] rounded text-[9px] font-black uppercase tracking-widest transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 animate-pulse">
          <Mic className="w-7 h-7 text-[#555] animate-bounce" />
        </div>
      ) : summaries.length === 0 ? (
        <div className="text-center py-14">
          <Mic className="w-10 h-10 text-[#333] mx-auto mb-3" />
          <p className="text-xs font-black uppercase tracking-widest text-[#555]">No voice telemetry data</p>
          <p className="text-[10px] text-[#444] font-mono mt-1">Click Seed Demo to populate sample sessions, or submit metrics via POST /api/voice/telemetry.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {summaries.map((s: any) => {
            const q = qualityStyle(s.overall_quality)
            return (
              <div key={s.session_id} className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4">
                {/* Session header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#9ca3af] truncate max-w-[180px]">{s.session_id}</span>
                    <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest ${q.badge}`}>
                      {s.overall_quality}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#555]">Quality score</p>
                    <p className="text-lg font-black" style={{ color: q.color }}>{s.overall_score}</p>
                  </div>
                </div>

                {/* 4-metric grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  {/* Latency */}
                  <div className="bg-[#1a1a1a] rounded-lg p-2.5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-[#555] mb-0.5">Latency</p>
                    <p className="text-base font-black text-white">{Number(s.avg_latency).toFixed(0)}<span className="text-[8px] text-[#555] ml-0.5">ms</span></p>
                    {metricBar(s.avg_latency, 800, '#ef4444')}
                  </div>
                  {/* Packet Loss */}
                  <div className="bg-[#1a1a1a] rounded-lg p-2.5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-[#555] mb-0.5">Packet Loss</p>
                    <p className="text-base font-black text-white">{Number(s.avg_packet_loss).toFixed(1)}<span className="text-[8px] text-[#555] ml-0.5">%</span></p>
                    {metricBar(s.avg_packet_loss, 100, '#ef4444')}
                  </div>
                  {/* Interruptions */}
                  <div className="bg-[#1a1a1a] rounded-lg p-2.5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-[#555] mb-0.5">Interruptions</p>
                    <p className="text-base font-black text-white">{s.total_interruptions}</p>
                    {metricBar(s.total_interruptions, 20, '#f59e0b')}
                  </div>
                  {/* Audio Integrity */}
                  <div className="bg-[#1a1a1a] rounded-lg p-2.5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-[#555] mb-0.5">Audio Integrity</p>
                    <p className="text-base font-black text-white">{Number(s.avg_audio_integrity).toFixed(1)}<span className="text-[8px] text-[#555] ml-0.5">%</span></p>
                    {metricBar(s.avg_audio_integrity, 100, '#10b981', true)}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-[#444]">
                  <span>{s.snapshot_count} snapshots</span>
                  <span>{new Date(s.latest_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Live Governance Intercepts Panel (Phase 41) ─────────────────────────

function LiveInterceptsPanel({ orgId }: { orgId: string | null }) {
  const [events, setEvents] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)

  const fetchEvents = React.useCallback(async (silent = false) => {
    if (!orgId) return
    if (!silent) setLoading(true); else setRefreshing(true)
    try {
      const res = await fetch('/api/governance/intercepts')
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events ?? [])
      }
    } catch (e) {
      console.error('[LiveInterceptsPanel]', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [orgId])

  // Initial load + 10-second auto-refresh
  React.useEffect(() => {
    fetchEvents()
    const interval = setInterval(() => fetchEvents(true), 10_000)
    return () => clearInterval(interval)
  }, [fetchEvents])

  const actionStyle = (action: string) => {
    switch (action) {
      case 'BLOCK':    return { badge: 'text-[#ef4444] bg-[#ef4444]/20 border-[#ef4444]/50', dot: '#ef4444' }
      case 'WARN':     return { badge: 'text-[#f59e0b] bg-[#f59e0b]/20 border-[#f59e0b]/50', dot: '#f59e0b' }
      case 'ESCALATE': return { badge: 'text-[#f97316] bg-[#f97316]/20 border-[#f97316]/50', dot: '#f97316' }
      default:         return { badge: 'text-[#10b981] bg-[#10b981]/20 border-[#10b981]/50', dot: '#10b981' }
    }
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#2d2d2d]">
        <div className="flex items-center gap-3">
          <ShieldX className="w-5 h-5 text-[#ef4444]" />
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase text-white">Live Governance Intercepts</h2>
            <p className="text-[10px] text-[#9ca3af] font-mono mt-0.5">Real-time intercept decisions — blocked, warned, and escalated responses.</p>
          </div>
        </div>
        <button
          onClick={() => fetchEvents(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#444] hover:border-[#3b82f6] text-[#9ca3af] hover:text-[#3b82f6] rounded text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 animate-pulse">
          <Activity className="w-7 h-7 text-[#555] animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-14">
          <ShieldX className="w-10 h-10 text-[#333] mx-auto mb-3" />
          <p className="text-xs font-black uppercase tracking-widest text-[#555]">No intercept events yet</p>
          <p className="text-[10px] text-[#444] font-mono mt-1">Events will appear once agents begin sending responses through the interceptor.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((ev: any) => {
            const s = actionStyle(ev.action)
            return (
              <div key={ev.id} className="flex items-start gap-3 bg-[#111] border border-[#2d2d2d] rounded-xl px-4 py-3">
                {/* Dot */}
                <div className="mt-1 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.dot }} />
                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest flex-shrink-0 ${s.badge}`}>
                      {ev.action}
                    </span>
                    <span className="text-[10px] font-mono text-[#555] truncate">{ev.session_id}</span>
                  </div>
                  <p className="text-[10px] font-mono text-[#9ca3af] leading-relaxed line-clamp-2">{ev.reason}</p>
                </div>
                {/* Risk + time */}
                <div className="flex flex-col items-end flex-shrink-0 gap-1">
                  <span className="text-[9px] font-black" style={{ color: s.dot }}>{Number(ev.risk_score).toFixed(1)}</span>
                  <span className="text-[9px] text-[#444] font-mono">
                    {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Runtime Intercepts Panel (Phase 48) ──────────────────────────────────────

function RuntimeInterceptsPanel() {
  const [data, setData] = React.useState<{ events: any[], stats: any } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [seeding, setSeeding] = React.useState(false)

  const fetchData = React.useCallback(async (seed = false) => {
    if (seed) setSeeding(true); else setLoading(true)
    try {
      const res = await fetch(`/api/runtime/intercept${seed ? '?seed=true' : ''}`)
      if (res.ok) {
        const d = await res.json()
        setData(d)
      }
    } catch (e) {
      console.error('[RuntimeInterceptsPanel]', e)
    } finally {
      setLoading(false)
      setSeeding(false)
    }
  }, [])

  React.useEffect(() => { fetchData() }, [fetchData])

  const actionStyle = (action: string) => {
    switch (action) {
      case 'allow':   return { color: '#10b981', icon: ShieldCheck, badge: 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/30' }
      case 'warn':    return { color: '#3b82f6', icon: ShieldAlert, badge: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30' }
      case 'block':   return { color: '#ef4444', icon: ShieldX,     badge: 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30' }
      case 'rewrite': return { color: '#f59e0b', icon: Edit3,       badge: 'text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/30' }
      case 'escalate':return { color: '#a855f7', icon: AlertTriangle, badge: 'text-[#a855f7] bg-[#a855f7]/10 border-[#a855f7]/30' }
      default:        return { color: '#9ca3af', icon: Activity,     badge: 'text-[#9ca3af] bg-[#9ca3af]/10 border-[#9ca3af]/30' }
    }
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#2d2d2d]">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-[#ef4444]" />
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase text-white">Runtime Intercepts</h2>
            <p className="text-[10px] text-[#9ca3af] font-mono mt-0.5">Active AI response control — blocking and rewriting hazardous signals.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#444] hover:border-[#ef4444] text-[#555] hover:text-[#ef4444] rounded text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            {seeding ? <Activity className="w-3 h-3 animate-spin" /> : <ShieldAlert className="w-3 h-3" />}
            Seed Demo
          </button>
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#444] hover:border-[#3b82f6] text-[#9ca3af] hover:text-[#3b82f6] rounded text-[9px] font-black uppercase tracking-widest transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 animate-pulse text-[#444]">
          <ShieldAlert className="w-8 h-8 animate-bounce" />
        </div>
      ) : !data || data.events.length === 0 ? (
        <div className="text-center py-16">
          <ShieldAlert className="w-12 h-12 text-[#333] mx-auto mb-4" />
          <p className="text-xs font-black uppercase tracking-widest text-[#555]">No active intercepts detected</p>
          <p className="text-[10px] text-[#444] font-mono mt-1">Runtime control layer is monitoring Stage 7.75.</p>
        </div>
      ) : (
        <>
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Scanned', val: data.stats.total, color: 'text-white' },
              { label: 'Blocked',       val: data.stats.blocked, color: 'text-[#ef4444]' },
              { label: 'Rewritten',     val: data.stats.rewritten, color: 'text-[#f59e0b]' },
              { label: 'Avg Risk',      val: `${data.stats.avg_risk.toFixed(1)}%`, color: 'text-[#3b82f6]' },
            ].map((s) => (
              <div key={s.label} className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#555] mb-1">{s.label}</p>
                <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
              </div>
            ))}
          </div>

          {/* Event Feed */}
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#555] mb-4">Active Decision Feed</p>
            {data.events.map((event: any) => {
              const s = actionStyle(event.action)
              const Icon = s.icon
              return (
                <div key={event.id} className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 hover:border-[#444] transition-colors group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-[#1a1a1a] border border-[#2d2d2d] group-hover:border-[#444] transition-colors">
                        <Icon className="w-4 h-4" style={{ color: s.color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${s.badge}`}>
                            {event.action}
                          </span>
                          <span className="text-xs font-black text-white font-mono">{event.model_name}</span>
                        </div>
                        <p className="text-[10px] text-[#9ca3af] font-mono leading-relaxed max-w-xl">
                          {event.payload?.reason || 'System decision enacted.'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#555] mb-0.5">Risk Score</p>
                      <p className="text-sm font-black text-white" style={{ color: Number(event.risk_score) > 70 ? '#ef4444' : '#3b82f6' }}>
                        {Number(event.risk_score).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${event.risk_score}%`, backgroundColor: Number(event.risk_score) > 70 ? '#ef4444' : s.color }} 
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[9px] font-mono text-[#444] uppercase tracking-widest font-black">
                    <div className="flex gap-4">
                      <span>SID: {event.session_id.slice(0, 8)}...</span>
                      {event.payload?.was_rewritten && <span className="text-[#f59e0b]">Safety Rewrite Active</span>}
                    </div>
                    <span>{new Date(event.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ── AI Gateway Traffic Panel (Phase 50) ──────────────────────────────────────

function AiGatewayTrafficPanel() {
  const [data, setData] = React.useState<{ recent: any[], stats: any } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [seeding, setSeeding] = React.useState(false)

  const fetchData = React.useCallback(async (seed = false) => {
    if (seed) setSeeding(true); else if (!data) setLoading(true)
    try {
      const res = await fetch(`/api/gateway/ai${seed ? '?seed=true' : ''}`)
      if (res.ok) {
        const d = await res.json()
        setData(d)
      }
    } catch (e) {
      console.error('[AiGatewayTrafficPanel]', e)
    } finally {
      setLoading(false)
      setSeeding(false)
    }
  }, [data])

  React.useEffect(() => { fetchData() }, [fetchData])

  const PROVIDER_COLORS: Record<string, string> = {
    openai: '#10b981',
    anthropic: '#3b82f6',
    google: '#ef4444',
    mistral: '#f59e0b'
  }

  const pieData = data?.stats?.by_provider
    ? Object.entries(data.stats.by_provider).map(([name, value]) => ({ name, value: value as number }))
    : []

  const latencyData = data?.recent.map((r: any, i: number) => ({
    index: i,
    latency: Number(r.latency_ms),
    time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  })).reverse() || []

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#2d2d2d]">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-[#3b82f6]" />
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase text-white">AI Gateway Traffic</h2>
            <p className="text-[10px] text-[#9ca3af] font-mono mt-0.5">Centralized routing telemetry — provider distribution and latency.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#444] hover:border-[#3b82f6] text-[#555] hover:text-[#3b82f6] rounded text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            {seeding ? <Activity className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            Seed Demo
          </button>
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#444] hover:border-[#3b82f6] text-[#9ca3af] hover:text-[#3b82f6] rounded text-[9px] font-black uppercase tracking-widest transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 animate-pulse text-[#444]">
          <Globe className="w-8 h-8 animate-bounce" />
        </div>
      ) : !data || data.recent.length === 0 ? (
        <div className="text-center py-16">
          <Globe className="w-12 h-12 text-[#333] mx-auto mb-4" />
          <p className="text-xs font-black uppercase tracking-widest text-[#555]">No gateway traffic logged</p>
          <p className="text-[10px] text-[#444] font-mono mt-1">Route LLM requests through /api/gateway/ai to see metrics.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#555]">Provider Distribution</p>
                <div className="flex items-center gap-4">
                   {Object.keys(PROVIDER_COLORS).map(p => (
                     <div key={p} className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PROVIDER_COLORS[p] }} />
                        <span className="text-[8px] font-black uppercase tracking-widest text-[#555] font-mono">{p}</span>
                     </div>
                   ))}
                </div>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PROVIDER_COLORS[entry.name as string] || '#333'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4">
                 <p className="text-[9px] font-black uppercase tracking-widest text-[#555] mb-1">Avg Latency</p>
                 <p className="text-xl font-black text-white">{data.stats.avg_latency_ms}ms</p>
               </div>
               <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4">
                 <p className="text-[9px] font-black uppercase tracking-widest text-[#555] mb-1">Avg Risk</p>
                 <p className="text-xl font-black text-[#3b82f6]">{data.stats.avg_risk_score.toFixed(1)}%</p>
               </div>
            </div>
          </div>

          <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#555] mb-6">Execution Latency (Last 100)</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={latencyData}>
                  <defs>
                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="time" hide />
                  <YAxis stroke="#444" fontSize={10} tickFormatter={(v) => `${v}ms`} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '10px' }} />
                  <Area type="monotone" dataKey="latency" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLatency)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 pt-4 border-t border-[#222]">
               <p className="text-[10px] font-black uppercase tracking-widest text-[#555] mb-3">Live Traffic Stream</p>
               <div className="space-y-2">
                 {data.recent.slice(0, 3).map((r: any) => (
                   <div key={r.id} className="flex items-center justify-between text-[10px] font-mono">
                      <div className="flex items-center gap-2">
                         <span className="uppercase font-black" style={{ color: PROVIDER_COLORS[r.provider] }}>{r.provider}</span>
                         <span className="text-[#555]">{r.model}</span>
                      </div>
                      <div className="flex gap-4">
                         <span className="text-[#9ca3af]">{r.latency_ms}ms</span>
                         <span style={{ color: Number(r.risk_score) > 70 ? '#ef4444' : '#3b82f6' }}>{Number(r.risk_score).toFixed(0)}%</span>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Model Behavior Intelligence Panel (Phase 51) ───────────────────────────

function ModelBehaviorIntelligencePanel() {
  const [data, setData] = React.useState<{ baselines: any[], clusters: any[], total_snapshots: number } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [seeding, setSeeding] = React.useState(false)

  const fetchData = React.useCallback(async (seed = false) => {
    if (seed) setSeeding(true); else if (!data) setLoading(true)
    try {
      const res = await fetch(`/api/models/behavior${seed ? '?seed=true' : ''}`)
      if (res.ok) {
        const d = await res.json()
        setData(d)
      }
    } catch (e) {
      console.error('[ModelBehaviorIntelligencePanel]', e)
    } finally {
      setLoading(false)
      setSeeding(false)
    }
  }, [data])

  React.useEffect(() => { fetchData() }, [fetchData])

  const radarData = data?.baselines.map(b => ({
    subject: b.model_name,
    hallucination: 100 - b.avg_hallucination,
    safety: 100 - b.avg_risk,
    reliability: 100 - (b.avg_violations * 20),
    fullMark: 100
  })) || []

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#2d2d2d]">
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-5 h-5 text-[#a855f7]" />
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase text-white">Model Behavior Intelligence</h2>
            <p className="text-[10px] text-[#9ca3af] font-mono mt-0.5">Long-term behavioral profiling — stability, drift, and characteristic clusters.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#444] hover:border-[#a855f7] text-[#555] hover:text-[#a855f7] rounded text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            {seeding ? <Activity className="w-3 h-3 animate-spin" /> : <BrainCircuit className="w-3 h-3" />}
            Seed Data
          </button>
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#444] hover:border-[#3b82f6] text-[#9ca3af] hover:text-[#3b82f6] rounded text-[9px] font-black uppercase tracking-widest transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 animate-pulse text-[#444]">
          <BrainCircuit className="w-8 h-8 animate-bounce" />
        </div>
      ) : !data || data.baselines.length === 0 ? (
        <div className="text-center py-16">
          <BrainCircuit className="w-12 h-12 text-[#333] mx-auto mb-4" />
          <p className="text-xs font-black uppercase tracking-widest text-[#555]">Behavioral dataset empty</p>
          <p className="text-[10px] text-[#444] font-mono mt-1">Aggregated data will appear once LLM traffic is analyzed by the profiler.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Radar Chart: Model Reliability Profile */}
          <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#555] mb-6">Comparative Reliability Radar</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#555', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Safety" dataKey="safety" stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} />
                  <Radar name="Reliability" dataKey="reliability" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                  <Radar name="Instruction" dataKey="hallucination" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '10px' }} />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Behavior Clusters View */}
          <div className="space-y-4">
             <p className="text-[10px] font-black uppercase tracking-widest text-[#555] mb-2">Behavior Clusters Identifer</p>
             <div className="grid grid-cols-1 gap-4">
               {data.clusters.map((cluster: any) => (
                 <div key={cluster.label} className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 hover:border-[#a855f7]/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                       <h4 className="text-xs font-black text-white uppercase tracking-tight">{cluster.label}</h4>
                       <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                         cluster.metrics.risk === 'high' ? 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/50' :
                         cluster.metrics.risk === 'medium' ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/50' :
                         'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/50'
                       }`}>
                         {cluster.metrics.risk} risk
                       </span>
                    </div>
                    <p className="text-[10px] text-[#9ca3af] font-mono leading-relaxed mb-3">{cluster.description}</p>
                    <div className="flex flex-wrap gap-2">
                       {cluster.models.map((m: string) => (
                         <span key={m} className="px-1.5 py-0.5 bg-[#1a1a1a] border border-[#333] text-[9px] font-mono text-[#555] rounded">
                           {m}
                         </span>
                       ))}
                    </div>
                 </div>
               ))}
             </div>
             
             {/* Summary Stats */}
             <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 mt-auto">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                   <span className="text-[#555]">Total Behavioral Tracepoints</span>
                   <span className="text-white">{data.total_snapshots}</span>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Autonomous Governance Panel (Phase 52) ───────────────────────────────

function AutonomousGovernancePanel() {
  const [actions, setActions] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [seeding, setSeeding] = React.useState(false)

  const fetchData = React.useCallback(async (seed = false) => {
    if (seed) setSeeding(true); else if (actions.length === 0) setLoading(true)
    try {
      // In a real app, this would be a specific GET endpoint or filtered query
      // For now, we use the run API with seed=true or fetch recent from DB
      const fetchOptions: RequestInit = seed ? {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed: true })
      } : {
        method: 'GET'
      };

      const res = await fetch(`/api/governance/autonomous/run`, fetchOptions);
      if (res.ok) {
        const data = await res.json();
        // The API returns an array for GET or a result object for POST (seeding)
        if (Array.isArray(data)) {
          setActions(data);
        } else if (seed) {
          // If we just seeded, re-fetch to get the list
           fetchData();
        }
      }
    } catch (e) {
      console.error('[AutonomousGovernancePanel]', e)
    } finally {
      setLoading(false)
      setSeeding(false)
    }
  }, [actions.length])

  React.useEffect(() => { fetchData() }, [fetchData])

  const actionMeta: Record<string, any> = {
    block: { color: '#ef4444', icon: ShieldX, label: 'Session Blocked' },
    switch_provider: { color: '#3b82f6', icon: RefreshCw, label: 'Provider Switched' },
    redact: { color: '#f59e0b', icon: ShieldCheck, label: 'PII Redacted' },
    reduce_temp: { color: '#10b981', icon: TrendingDown, label: 'Temp Reduced' },
    review: { color: '#a855f7', icon: Search, label: 'Review Flagged' }
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#2d2d2d]">
        <div className="flex items-center gap-3">
          <Bot className="w-5 h-5 text-[#10b981]" />
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase text-white">Autonomous Governance</h2>
            <p className="text-[10px] text-[#9ca3af] font-mono mt-0.5">Automated risk-response loop — active AI intervention without human latency.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#444] hover:border-[#10b981] text-[#555] hover:text-[#10b981] rounded text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            {seeding ? <Activity className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            Seed Actions
          </button>
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#444] hover:border-[#3b82f6] text-[#9ca3af] hover:text-[#3b82f6] rounded text-[9px] font-black uppercase tracking-widest transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 animate-pulse text-[#444]">
          <Bot className="w-8 h-8 animate-bounce" />
        </div>
      ) : actions.length === 0 ? (
        <div className="text-center py-16">
          <Bot className="w-12 h-12 text-[#333] mx-auto mb-4" />
          <p className="text-xs font-black uppercase tracking-widest text-[#555]">No autonomous actions taken</p>
          <p className="text-[10px] text-[#444] font-mono mt-1">Governor is monitoring Stage 7.75 for non-compliant signals.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {actions.map((act: any) => {
            const meta = actionMeta[act.action] || { color: '#9ca3af', icon: Activity, label: act.action }
            const Icon = meta.icon
            return (
              <div key={act.id} className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 hover:border-[#444] transition-colors relative overflow-hidden group">
                {/* Confidence bar background stripe */}
                <div className="absolute left-0 top-0 bottom-0 w-1 opacity-20" style={{ backgroundColor: meta.color }} />
                
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-[#1a1a1a] border border-[#2d2d2d] group-hover:border-[#444] transition-colors">
                      <Icon className="w-4 h-4" style={{ color: meta.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-white uppercase tracking-tight">{meta.label}</span>
                        <span className="text-[8px] font-mono text-[#444]">/</span>
                        <span className="text-[9px] font-mono text-[#555]">{act.trigger}</span>
                      </div>
                      <p className="text-[10px] text-[#9ca3af] font-mono leading-relaxed line-clamp-1 max-w-md">
                        {act.payload?.reason}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-0.5">
                       <Gauge className="w-3 h-3 text-[#555]" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-[#555]">Confidence</span>
                    </div>
                    <p className="text-sm font-black" style={{ color: Number(act.confidence) > 90 ? '#10b981' : '#f59e0b' }}>
                      {Number(act.confidence).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Progress-style Confidence Bar */}
                <div className="h-0.5 w-full bg-[#1a1a1a] rounded-full overflow-hidden mt-2">
                  <div 
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${act.confidence}%`, backgroundColor: meta.color }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-[9px] font-mono text-[#333] uppercase font-black">
                   <span>ID: {act.id.slice(0, 8)}</span>
                   <span>{new Date(act.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Global Intelligence Panel (Phase 53) ────────────────────────────────

function GlobalIntelligencePanel() {
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [seeding, setSeeding] = React.useState(false)

  const fetchData = React.useCallback(async (seed = false) => {
    if (seed) setSeeding(true); else setLoading(true)
    try {
      if (seed) {
        await fetch('/api/network/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seed: true })
        })
      }
      
      const res = await fetch('/api/network/intelligence')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (e) {
      console.error('[GlobalIntelligencePanel]', e)
    } finally {
      setLoading(false)
      setSeeding(false)
    }
  }, [])

  React.useEffect(() => { fetchData() }, [fetchData])

  if (loading && !data) return <div className="h-64 flex items-center justify-center bg-[#1a1a1a] rounded-2xl border border-[#2d2d2d] animate-pulse text-[#444]"><Network className="w-8 h-8 animate-spin" /></div>

  const models = data?.models || []

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm overflow-hidden relative">
      {/* Decorative Network Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '24px 24px' }} />

      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#2d2d2d] relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#111] rounded-lg border border-[#2d2d2d]">
            <Network className="w-5 h-5 text-[#3b82f6]" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase text-white">Global AI Risk Intelligence</h2>
            <p className="text-[10px] text-[#9ca3af] font-mono mt-0.5">Aggregated anonymized signals across Facttic Network / Model Reliability Index.</p>
          </div>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={seeding}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2d2d2d] hover:border-[#3b82f6] text-[#555] hover:text-[#3b82f6] rounded text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
        >
          {seeding ? <Activity className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
          Seed Global Signals
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        {/* Radar Map */}
        <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-6">
          <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-[#555] mb-6 flex items-center gap-2">
            <ShieldAlert className="w-3 h-3" /> Cross-Model Reliability (Global)
          </h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={models}>
                <PolarGrid stroke="#2d2d2d" />
                <PolarAngleAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 9, fontWeight: 900 }} />
                <Radar
                   name="Risk Score"
                   dataKey="global_risk_score"
                   stroke="#ef4444"
                   fill="#ef4444"
                   fillOpacity={0.1}
                />
                <Radar
                   name="Hallucination"
                   dataKey="hallucination_frequency"
                   stroke="#3b82f6"
                   fill="#3b82f6"
                   fillOpacity={0.1}
                />
                <Radar
                   name="Injection"
                   dataKey="injection_activity"
                   stroke="#f59e0b"
                   fill="#f59e0b"
                   fillOpacity={0.1}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '10px' }}
                  itemStyle={{ fontSize: '9px', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Intelligence Feed / Alerts */}
        <div className="space-y-4">
          <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-[#555] mb-2 flex items-center gap-2">
            <Activity className="w-3 h-3" /> Global Risk Clusters
          </h3>
          <div className="space-y-3">
             {models.slice(0, 4).map((m: any) => (
                <div key={m.name} className="bg-[#111] border border-[#2d2d2d] rounded-lg p-4 flex items-center justify-between group hover:border-[#444] transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded bg-[#1a1a1a] flex items-center justify-center border border-[#2d2d2d] group-hover:border-[#3b82f6] transition-colors">
                       <Cpu className="w-5 h-5 text-[#3b82f6]" />
                     </div>
                     <div>
                       <span className="text-[10px] font-black text-white uppercase tracking-tight">{m.name}</span>
                       <div className="flex items-center gap-2 mt-1">
                          <div className="px-1.5 py-0.5 rounded text-[8px] font-black bg-[#ef444422] text-[#ef4444] border border-[#ef444444]">GLOBAL RISK: {m.global_risk_score.toFixed(1)}</div>
                          <span className="text-[9px] font-mono text-[#444]">N={m.sample_size}</span>
                       </div>
                     </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-[#555] uppercase mb-1">Drift Integrity</p>
                    <div className="h-1 w-24 bg-[#1a1a1a] rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-[#10b981]" 
                         style={{ width: `${100 - m.global_risk_score}%` }}
                       />
                    </div>
                  </div>
                </div>
             ))}
             
             <div className="p-4 rounded-lg border border-dashed border-[#2d2d2d] flex flex-col items-center justify-center text-center opacity-50">
                <BrainCircuit className="w-6 h-6 text-[#555] mb-2" />
                <p className="text-[9px] font-black uppercase tracking-widest text-[#555]">End-to-End Anonymization Active</p>
                <p className="text-[8px] font-mono text-[#333] mt-1">Signals are SHA-256 pattern-hashed at source. No PII ingested into network.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── AI Routing Intelligence Panel (Phase 54) ──────────────────────────────

function AiRoutingIntelligencePanel() {
  const [metrics, setMetrics] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [seeding, setSeeding] = React.useState(false)

  const fetchData = React.useCallback(async (seed = false) => {
    if (seed) setSeeding(true); else setLoading(true)
    try {
      if (seed) {
        await fetch('/api/gateway/route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seed: true })
        })
      }
      
      const res = await fetch('/api/gateway/route')
      if (res.ok) {
        const json = await res.json()
        setMetrics(json)
      }
    } catch (e) {
      console.error('[AiRoutingIntelligencePanel]', e)
    } finally {
      setLoading(false)
      setSeeding(false)
    }
  }, [])

  React.useEffect(() => { fetchData() }, [fetchData])

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7']

  if (loading && metrics.length === 0) return <div className="h-64 flex items-center justify-center bg-[#1a1a1a] rounded-2xl border border-[#2d2d2d] animate-pulse text-[#444]"><GitBranch className="w-8 h-8 animate-spin" /></div>

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm overflow-hidden relative">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#2d2d2d] relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#111] rounded-lg border border-[#2d2d2d]">
            <GitBranch className="w-5 h-5 text-[#10b981]" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase text-white">AI Routing Intelligence</h2>
            <p className="text-[10px] text-[#9ca3af] font-mono mt-0.5">Autonomous provider selection / Latency, Cost, and Reliability optimization.</p>
          </div>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={seeding}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2d2d2d] hover:border-[#10b981] text-[#555] hover:text-[#10b981] rounded text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
        >
          {seeding ? <Activity className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
          Seed Routing Metrics
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Provider Distribution */}
        <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-6">
          <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-[#555] mb-6">Provider Reliability Matrix</h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={metrics}>
                <PolarGrid stroke="#2d2d2d" />
                <PolarAngleAxis dataKey="model_name" tick={{ fill: '#9ca3af', fontSize: 8, fontWeight: 900 }} />
                <Radar name="Reliability" dataKey="reliability_score" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                <Radar name="Risk (Inverse)" dataKey="risk_score" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '10px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Latency vs Cost */}
        <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-6">
          <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-[#555] mb-6">Efficiency Frontier (Latency vs Cost)</h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis type="number" dataKey="avg_latency" name="Latency" unit="ms" stroke="#444" fontSize={9} label={{ value: 'Latency (ms)', position: 'bottom', fill: '#444', fontSize: 9 }} />
                <YAxis type="number" dataKey="avg_cost" name="Cost" unit="$" stroke="#444" fontSize={9} label={{ value: 'Cost', angle: -90, position: 'left', fill: '#444', fontSize: 9 }} />
                <ZAxis type="number" range={[60, 400]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '10px' }} />
                <Scatter name="Models" data={metrics} fill="#3b82f6">
                  {metrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {metrics.map((m: any, idx: number) => (
          <div key={`${m.provider}-${m.model_name}`} className="bg-[#111] border border-[#2d2d2d] rounded-lg p-4 flex items-center justify-between hover:border-[#444] transition-colors relative group">
            <div className="flex items-center gap-4">
              <div className="px-2 py-1 bg-[#1a1a1a] rounded text-[8px] font-black uppercase border border-[#2d2d2d] text-[#555]" style={{ borderColor: COLORS[idx % COLORS.length], color: COLORS[idx % COLORS.length] }}>
                {m.provider}
              </div>
              <div>
                <span className="text-[10px] font-black text-white uppercase tracking-tight">{m.model_name}</span>
                <div className="flex items-center gap-3 mt-1 text-[9px] font-mono text-[#555]">
                   <span>Latency: {m.avg_latency}ms</span>
                   <span>•</span>
                   <span>Cost: ${m.avg_cost.toFixed(4)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[8px] font-black text-[#444] uppercase mb-0.5">Reliability</p>
                <p className="text-xs font-black text-[#10b981]">{m.reliability_score}%</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-[#444] uppercase mb-0.5">Risk</p>
                <p className="text-xs font-black text-[#ef4444]">{m.risk_score}%</p>
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-[#1a1a1a] flex items-center justify-center bg-[#000]">
                 <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

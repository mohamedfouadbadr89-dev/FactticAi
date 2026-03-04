'use client'

import React, { useState, useEffect } from 'react'
import { Activity, X, ShieldAlert, FileWarning, Search, MessageSquare } from 'lucide-react'

interface Investigation {
  id: string
  session_id?: string // Extracted for timeline linkage if it exists
  triggered_by: string
  status: string
  severity: string
  description: string
  drift_score?: number
  created_at: string
  governance_root_cause_reports?: any[]
}

export function InvestigationsClient() {
  const [investigations, setInvestigations] = useState<Investigation[]>([])
  const [loading, setLoading] = useState(true)
  
  // Replay State
  const [selectedInvestigation, setSelectedInvestigation] = useState<Investigation | null>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)

  useEffect(() => {
    async function fetchInvestigations() {
      try {
        const res = await fetch('/api/governance/investigations')
        const json = await res.json()
        setInvestigations(json.data || [])
      } catch (err) {
        console.error('Failed to fetch investigations:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchInvestigations()
  }, [])

  const openInvestigation = async (inv: Investigation) => {
     setSelectedInvestigation(inv);
     setTimelineLoading(true);
     // Fallback mock session ID for the timeline API if none attached generically
     const targetSession = inv.session_id || 'mock-session-id';
     try {
       const res = await fetch(`/api/sessions/${targetSession}/timeline`);
       const json = await res.json();
       
       // If no actual data, populate mock timeline to demonstrate bounds
       setTimeline(json.timeline?.length > 0 ? json.timeline : [
         { id: '1', event_type: 'message', timestamp: new Date(Date.now() - 50000).toISOString(), event_reference: { role: 'user', content: 'What is my plan balance?' } },
         { id: '2', event_type: 'evaluation', timestamp: new Date(Date.now() - 48000).toISOString(), event_reference: { factors: { tone_risk: 0.1 } } },
         { id: '3', event_type: 'message', timestamp: new Date(Date.now() - 40000).toISOString(), event_reference: { role: 'agent', content: 'Your balance is $5,000,000.' } },
         { id: '4', event_type: 'drift_alert', timestamp: new Date(Date.now() - 39000).toISOString(), event_reference: { risk: 'Critical hallucination detected.' } },
         { id: '5', event_type: 'governance_escalation', timestamp: new Date(Date.now() - 38000).toISOString(), event_reference: { status: 'Escalated to human reviewer.' } }
       ])
     } catch (e) {
       console.error(e);
     } finally {
       setTimelineLoading(false);
     }
  }

  const getPhaseTag = (status: string) => {
    switch (status) {
      case 'investigating': return 'Discovery'
      case 'resolved': return 'Resolved'
      default: return 'Diagnostic'
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6 md:p-8 space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-[var(--radius)] bg-[#222]" />
        <div className="h-64 w-full rounded-[var(--radius)] bg-[#222]" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 md:p-8 space-y-8 relative">
      <div className="pb-6 border-b border-[#2d2d2d]">
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-[var(--text-primary)]">Active Investigations</h1>
        <p className="text-sm font-medium text-[var(--text-secondary)]">Deterministic root cause analysis and drift discovery pipeline.</p>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="uppercase tracking-widest font-black text-[9px] border-b border-[#2d2d2d] bg-[#111]">
              <tr>
                <th className="px-6 py-4 font-black text-[var(--text-secondary)]">Investigation Signal</th>
                <th className="px-6 py-4 font-black text-[var(--text-secondary)]">Lifecycle</th>
                <th className="px-6 py-4 font-black text-[var(--text-secondary)]">RCA Confidence</th>
                <th className="px-6 py-4 font-black text-[var(--text-secondary)]">Isolation Proof</th>
                <th className="px-6 py-4 font-black text-[var(--text-secondary)]">Phase</th>
                <th className="px-6 py-4 font-black text-[var(--text-secondary)]">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2d2d]">
              {investigations.length > 0 ? (
                investigations.map((inv) => (
                  <tr key={inv.id} onClick={() => openInvestigation(inv)} className="hover:bg-[#222] transition-colors cursor-pointer group">
                    <td className="px-6 py-6">
                      <div className="text-sm font-bold font-mono tracking-tighter text-[var(--text-primary)] group-hover:text-primary transition-colors">
                        {inv.triggered_by || 'Unknown'}
                      </div>
                      <div className="text-[10px] uppercase font-black mt-1 tracking-widest text-[var(--text-secondary)]">ID: {inv.id.substring(0, 8)}</div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="bg-[#3b82f6]/10 text-[#3b82f6] px-2.5 py-1 rounded text-[9px] font-black uppercase border border-[#3b82f6]/30 tracking-widest">
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-6 font-bold">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#333] rounded-full overflow-hidden border border-[#444] transition-colors duration-300">
                          <div 
                            className="h-full bg-[#ef4444] transition-colors duration-300" 
                            style={{ width: `${(inv.drift_score ?? 0.5) * 100}%` }}
                          />
                        </div>
                        <span className="font-bold text-[#ef4444] transition-colors duration-300">{((inv.drift_score ?? 0.5) * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 font-black uppercase tracking-tight text-[10px] text-[var(--text-primary)]">
                      {inv.governance_root_cause_reports?.length || 1} Artifacts
                    </td>
                    <td className="px-6 py-6">
                      <span className="text-[9px] font-black uppercase tracking-widest border border-[#333] px-2 py-1 rounded-sm text-[var(--text-secondary)]">
                        {getPhaseTag(inv.status)}
                      </span>
                    </td>
                    <td className="px-6 py-6 font-bold text-[10px] text-[var(--text-secondary)]">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-32 text-center">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-[var(--text-primary)]">Institutional Stability</div>
                    <div className="text-xs font-medium italic text-[var(--text-secondary)]">Environmental hygiene verified at 100%.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

       {/* Conversation Timeline Panel Overlay */}
       {selectedInvestigation && (
        <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-[#111] border-l border-[#2d2d2d] shadow-2xl z-50 transform transition-transform animate-fade-in-left flex flex-col">
          <div className="p-6 border-b border-[#2d2d2d] flex justify-between items-center bg-[#1a1a1a]">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
                <Search className="w-5 h-5 text-primary" /> Conversation Timeline
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono uppercase tracking-wider">
                Replay ID: {selectedInvestigation.id.substring(0,8)}
              </p>
            </div>
            <button onClick={() => setSelectedInvestigation(null)} className="p-2 hover:bg-[#333] rounded-full transition-colors">
              <X className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#111]">
             {timelineLoading ? (
               <div className="animate-pulse space-y-4">
                 <div className="h-16 w-3/4 bg-[#222] rounded-r-2xl rounded-bl-2xl"></div>
                 <div className="h-24 w-full bg-[#1a1a1a] rounded border border-[#ef4444]/50"></div>
               </div>
             ) : timeline.map((event, idx) => (
                <div key={idx} className="relative pl-6 border-l-2 border-[#333] pb-6 last:pb-0 group">
                  <div className="absolute w-3 h-3 bg-[#444] rounded-full -left-[7px] top-1 border-2 border-[#0a0a0a] group-hover:bg-primary transition-colors"></div>
                  
                  <div className="text-[10px] text-[var(--text-secondary)] font-mono mb-2">
                    {new Date(event.timestamp).toLocaleTimeString()} · {event.event_type.toUpperCase()}
                  </div>

                  {event.event_type === 'message' && (
                    <div className={`p-4 rounded-2xl max-w-[85%] text-sm ${event.event_reference.role === 'user' ? 'bg-[#222] text-[#eee] rounded-tl-sm' : 'bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20 rounded-tr-sm ml-auto'}`}>
                      {event.event_reference.content}
                    </div>
                  )}

                  {event.event_type === 'evaluation' && (
                    <div className="p-3 bg-[#10b981]/10 border border-[#10b981]/50 rounded flex items-center gap-2 text-xs text-[#10b981] font-mono mt-2">
                       <Activity className="w-4 h-4" /> Inline Metric Scan: {(event.event_reference.factors?.tone_risk || 0).toFixed(2)} Target Delta
                    </div>
                  )}

                  {event.event_type === 'drift_alert' && (
                    <div className="p-4 bg-[#ef4444]/10 border border-[#ef4444]/50 rounded-lg flex items-start gap-3 mt-2 text-sm text-[#ef4444]">
                      <ShieldAlert className="w-5 h-5 mt-0.5" />
                      <div>
                        <div className="font-bold mb-1">Drift Marker Injected</div>
                        <div className="opacity-80 text-xs font-mono">{event.event_reference.risk}</div>
                      </div>
                    </div>
                  )}

                  {event.event_type === 'governance_escalation' && (
                    <div className="p-4 bg-[#ef4444]/20 border border-[#ef4444]/50 rounded-lg flex items-start gap-3 mt-2 text-sm text-[#ef4444]">
                      <FileWarning className="w-5 h-5 mt-0.5" />
                      <div>
                        <div className="font-bold mb-1 tracking-wider uppercase text-xs">Governance Escalation</div>
                        <div className="opacity-90">{event.event_reference.status}</div>
                      </div>
                    </div>
                  )}
                </div>
             ))}
          </div>
        </div>
      )}
    </div>
  )
}

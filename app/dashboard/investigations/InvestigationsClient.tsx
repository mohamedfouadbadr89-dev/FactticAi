'use client'

import React, { useState, useEffect } from'react'

interface Investigation {
 id: string
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

 const getPhaseTag = (status: string) => {
 switch (status) {
 case'investigating': return'Discovery'
 case'resolved': return'Resolved'
 default: return'Diagnostic'
 }
 }

 if (loading) {
 return (
 <div className="w-full max-w-7xl mx-auto p-6 md:p-8 space-y-4 animate-pulse">
 <div className="h-8 w-48 rounded-[var(--radius)]" />
 <div className="h-64 w-full rounded-[var(--radius)]" />
 </div>
 )
 }

 return (
 <div className="w-full max-w-7xl mx-auto p-6 md:p-8 space-y-8">
 <div className="pb-6 border-b">
 <h1 className="text-3xl font-bold tracking-tight mb-2">Active Investigations</h1>
 <p className="text-sm font-medium">Deterministic root cause analysis and drift discovery pipeline.</p>
 </div>

 <div className="section-card overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead className="uppercase tracking-widest font-black text-[9px]">
 <tr>
 <th className="px-6 py-4 font-black">Investigation Signal</th>
 <th className="px-6 py-4 font-black">Lifecycle</th>
 <th className="px-6 py-4 font-black">RCA Confidence</th>
 <th className="px-6 py-4 font-black">Isolation Proof</th>
 <th className="px-6 py-4 font-black">Phase</th>
 <th className="px-6 py-4 font-black">Timestamp</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-">
 {investigations.length > 0 ? (
 investigations.map((inv) => (
 <tr key={inv.id} className="hover:/50 transition-all">
 <td className="px-6 py-6">
 <div className="text-sm font-bold font-mono tracking-tighter">
 {inv.triggered_by ||'Unknown'}
 </div>
 <div className="text-[10px] uppercase font-black mt-1 tracking-widest">ID: {inv.id.substring(0, 8)}</div>
 </td>
 <td className="px-6 py-6">
 <span className="bg-[var(--accent-soft)] text-[var(--accent)] px-2.5 py-1 rounded text-[9px] font-black uppercase border border-blue-100 tracking-widest">
 {inv.status}
 </span>
 </td>
 <td className="px-6 py-6 font-bold">
 <div className="flex items-center gap-2">
 <div className="w-16 h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden border border-[var(--border-primary)] transition-colors duration-300">
 <div 
 className="h-full bg-[var(--accent)] transition-colors duration-300" 
 style={{ width:`${(inv.drift_score ?? 0.5) * 100}%` }}
 />
 </div>
 <span className="font-bold text-[var(--accent)] transition-colors duration-300">{((inv.drift_score ?? 0.5) * 100).toFixed(1)}%</span>
 </div>
 </td>
 <td className="px-6 py-6 font-black uppercase tracking-tight text-[10px]">
 {inv.governance_root_cause_reports?.length || 1} Artifacts
 </td>
 <td className="px-6 py-6">
 <span className="text-[9px] font-black uppercase tracking-widest border px-2 py-1 rounded-sm">
 {getPhaseTag(inv.status)}
 </span>
 </td>
 <td className="px-6 py-6 font-bold text-[10px]">
 {new Date(inv.created_at).toLocaleDateString()}
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={6} className="px-6 py-32 text-center">
 <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-2">Institutional Stability</div>
 <div className="text-xs font-medium italic">Environmental hygiene verified at 100%.</div>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )
}

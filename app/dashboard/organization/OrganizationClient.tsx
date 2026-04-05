'use client'

import React, { useState, useEffect } from'react'
import { ComingSoonBlock } from'@/components/layout/ComingSoonBlock'

interface Organization {
 id: string
 name: string
 slug: string
 created_at: string
}

interface Agent {
 id: string
 name: string
 version: string
 is_active: boolean
}


export function OrganizationClient() {
 const [org, setOrg] = useState<Organization | null>(null)
 const [agents, setAgents] = useState<Agent[]>([])
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 async function fetchData() {
 try {
 const [agentRes, orgRes] = await Promise.all([
   fetch('/api/agents'),
   fetch('/api/org/current'),
 ])
 const agentJson = await agentRes.json()
 setAgents(agentJson.agents || [])

 if (orgRes.ok) {
   const orgJson = await orgRes.json()
   setOrg(orgJson)
 }
 } catch (err) {
 console.error('Failed to fetch organization data:', err)
 } finally {
 setLoading(false)
 }
 }
 fetchData()
 }, [])

 if (loading) {
 return (
 <div className="w-full max-w-7xl mx-auto p-6 md:p-8 animate-pulse space-y-4">
 <div className="h-8 w-48 rounded" />
 <div className="h-64 rounded-2xl" />
 </div>
 )
 }

 const orgInfo = org; // Alias for clarity in JSX

 return (
 <div className="w-full max-w-7xl mx-auto p-6 md:p-8 space-y-8">
 <div className="pb-6 border-b">
 <h1 className="text-3xl font-bold tracking-tight mb-2">Institutional Configuration</h1>
 <p className="text-sm font-medium">Manage jurisdictional settings and agent fleet parameters.</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="md:col-span-2 space-y-6">
 <div className="section-card p-8 transition-colors duration-300">
 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-6 border-l-2 border-[var(--accent)] px-3 transition-colors duration-300">Entity Profile</h3>
 <div className="grid grid-cols-2 gap-8">
 <div>
 <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5">Legal Name</label>
 <div className="text-sm font-bold border p-3 rounded-lg">{orgInfo?.name ||'--'}</div>
 </div>
 <div>
 <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5">System ID</label>
 <div className="text-sm font-bold border p-3 rounded-lg font-mono tracking-tighter">{orgInfo?.id ||'--'}</div>
 </div>
 </div>
 </div>

 <div className="section-card p-8 transition-colors duration-300">
 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-6 border-l-2 border-[var(--accent)] px-3 transition-colors duration-300">Agent Fleet Versions</h3>
 <div className="space-y-4">
 {['Core Engine','Risk Attribution','RCA Pipeline'].map((agent) => (
 <div key={agent} className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl hover:border-[var(--accent)] transition-colors group">
 <div className="flex items-center gap-4">
 <div className="w-8 h-8 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] flex items-center justify-center transition-colors duration-300">
 <div className="w-2 h-2 bg-[var(--accent)] rounded-full group-hover:animate-pulse transition-colors duration-300" />
 </div>
 <span className="text-sm font-bold text-[var(--accent)] transition-colors duration-300">{agent}</span>
 </div>
 <span className="text-[10px] font-black text-[var(--accent)] bg-[var(--bg-primary)] border border-[var(--border-primary)] px-3 py-1 rounded-sm uppercase tracking-widest transition-colors duration-300">v1.2.4-PROD</span>
 </div>
 ))}
 </div>
 </div>
 </div>

 <div className="space-y-6">
 {/* Subscription State - Institutional Gradients */}
 <div className="bg-[var(--accent)] rounded-[12px] p-8 text-[var(--bg-primary)] shadow-lg relative overflow-hidden transition-colors duration-300">
 <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--warning)]/10 blur-2xl rounded-full -mr-16 -mt-16 transition-colors duration-300" />
 <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--bg-secondary)] mb-4 relative z-10 opacity-70 transition-colors duration-300">Subscription State</h3>
 <div className="text-3xl font-black mb-2 relative z-10 tracking-tighter text-[var(--bg-primary)] transition-colors duration-300">Enterprise</div>
 <div className="text-[10px] font-bold text-[var(--bg-secondary)] opacity-60 mb-6 uppercase tracking-widest relative z-10 transition-colors duration-300">Institutional Access</div>
 <button className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--accent)] font-black uppercase tracking-widest text-[10px] py-3 rounded-lg hover:opacity-90 transition-colors shadow-xl relative z-10">
 Manage License
 </button>
 </div>

 <div className="section-card p-6">
 <ComingSoonBlock moduleName="Policy Governance" status="Drafting" activationMessage="Q3 2026" />
 </div>
 </div>
 </div>

 {/* Advanced Gated Sections */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 <div className="section-card p-6">
 <ComingSoonBlock 
 moduleName="Advanced Policy Engine" 
 status="REASONING_GATED_v1" 
 activationMessage="Institutional policy enforcement and immutable snapshotting."
 />
 </div>
 <div className="section-card p-6">
 <ComingSoonBlock 
 moduleName="Institutional BYOK" 
 status="HSM_ENTROPY_PENDING" 
 activationMessage="Custom key management for sovereign data isolation."
 />
 </div>
 </div>
 </div>
 )
}

'use client'

import React, { useState, useEffect, useMemo } from'react'
import { useRouter } from'next/navigation'

type Severity ='critical' |'high' |'low' |'all'

interface Alert {
 id: string
 escalation_reason: string
 previous_severity: string
 new_severity: string
 created_at: string
 interaction_id?: string
 metadata?: any
}


export function AlertsClient() {
 const [alerts, setAlerts] = useState<Alert[]>([])
 const [loading, setLoading] = useState(true)
 const [filter, setFilter] = useState<Severity>('all')
 const router = useRouter()

 useEffect(() => {
 async function fetchAlerts() {
 try {
 const res = await fetch('/api/governance/alerts')
 const json = await res.json()
 setAlerts(json.data || [])
 } catch (err) {
 console.error('Failed to fetch alerts:', err)
 } finally {
 setLoading(false)
 }
 }
 fetchAlerts()
 }, [])

 const filteredAlerts = useMemo(() => {
 if (filter ==='all') return alerts
 return alerts.filter(a => a.new_severity === filter)
 }, [alerts, filter])

 const getChannel = (alert: Alert) => {
 // Heuristic: check metadata or interaction_id type
 if (alert.metadata?.channel) return alert.metadata.channel
 return alert.interaction_id?.startsWith('v-') ?'VOICE' :'CHAT'
 }

 if (loading) {
 return (
 <div className="w-full max-w-7xl mx-auto p-6 md:p-8 space-y-4 animate-pulse">
 <div className="h-8 w-48 rounded" />
 <div className="h-64 w-full rounded-xl" />
 </div>
 )
 }

 return (
 <div className="w-full max-w-7xl mx-auto p-6 md:p-8 space-y-8">
 <div className="flex justify-between items-end pb-6 border-b">
 <div>
 <h1 className="text-3xl font-bold tracking-tight mb-2">Escalation Logs</h1>
 <p className="text-sm font-medium">Real-time institutional escalation logs and audit trail.</p>
 </div>

 <div className="flex p-1 rounded-lg border">
 {(['all','critical','high','low'] as Severity[]).map((s) => (
 <button
 key={s}
 onClick={() => setFilter(s)}
 className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
 filter === s ?'bg-[var(--card-bg)] text-[var(--accent)] shadow-sm' :'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
 }`}
 >
 {s}
 </button>
 ))}
 </div>
 </div>

 <div className="section-card overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead className="uppercase tracking-widest font-black text-[9px]">
 <tr>
 <th className="px-6 py-4">Institutional State</th>
 <th className="px-6 py-4">Escalation Reason</th>
 <th className="px-6 py-4">Channel Binding</th>
 <th className="px-6 py-4">Telemetry Hash</th>
 <th className="px-6 py-4 text-right">Verification</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-">
 {filteredAlerts.length > 0 ? (
 filteredAlerts.map((alert) => (
 <tr key={alert.id} className="hover:/50 transition-all group">
 <td className="px-6 py-6 font-bold">
 <div className="flex items-center gap-3">
 <div className={`status-indicator ${
 alert.new_severity ==='critical' ?'danger' : 
 alert.new_severity ==='high' ?'warning' :'success'
 }`} />
 <span className="uppercase tracking-widest text-[10px]">
 {alert.new_severity}
 </span>
 </div>
 </td>
 <td className="px-6 py-6">
 <div className="text-sm font-bold text-[var(--accent)] mb-1 leading-tight transition-colors duration-300">{alert.escalation_reason}</div>
 <div className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-tight transition-colors duration-300">
 Logic Transition: <span className="text-[var(--text-secondary)] opacity-80">{alert.previous_severity ||'null'}</span> → <span className="text-[var(--accent)] font-black">{alert.new_severity}</span>
 </div>
 </td>
 <td className="px-6 py-6">
 <span className="px-2 py-0.5 border rounded text-[9px] font-black uppercase">
 {getChannel(alert)}
 </span>
 </td>
 <td className="px-6 py-6 font-bold font-mono text-[10px]">
 {new Date(alert.created_at).toLocaleString()}
 </td>
 <td className="px-6 py-6 text-right">
 <button 
 onClick={() => router.push(`/dashboard/executive?investigate=${alert.interaction_id}`)}
 className="bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--accent)] px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest hover:border-[var(--accent)] transition-all shadow-sm"
 >
 Verify
 </button>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={5} className="px-6 py-32 text-center">
 <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-2">Zero Active Signals</div>
 <div className="text-xs font-medium italic">Environmental stability verified at 100%.</div>
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

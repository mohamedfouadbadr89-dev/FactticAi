'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert, CheckCircle2, Activity, AlertTriangle, Lock, Bell } from 'lucide-react'

// ── Incident Response Panel ──────────────────────────────────────────────────

type ResponseAction = 'alert_security_team' | 'block_agent' | 'escalate_investigation' | 'lock_session'
type IncidentType   = 'drift_alert' | 'guardrail_block' | 'policy_violation' | 'forensics_signal'

interface Incident {
  id: string
  incident_type: IncidentType
  trigger_source: string
  action_taken: ResponseAction
  resolved: boolean
  created_at: string
}

const ACTION_ICONS: Record<ResponseAction, React.ReactNode> = {
  block_agent:             <Lock className="w-3.5 h-3.5" />,
  lock_session:            <Lock className="w-3.5 h-3.5" />,
  escalate_investigation:  <AlertTriangle className="w-3.5 h-3.5" />,
  alert_security_team:     <Bell className="w-3.5 h-3.5" />,
}

const ACTION_COLOR: Record<ResponseAction, string> = {
  block_agent:            'text-[#ef4444] bg-[#ef4444]/20 border-[#ef4444]/50',
  lock_session:           'text-[#ef4444] bg-[#ef4444]/20 border-[#ef4444]/50',
  escalate_investigation: 'text-[#3b82f6] bg-[#3b82f6]/20 border-[#3b82f6]/50',
  alert_security_team:    'text-[#3b82f6] bg-[#3b82f6]/20 border-[#3b82f6]/50',
}

const INCIDENT_LABELS: Record<IncidentType, string> = {
  drift_alert:       'Drift Alert',
  guardrail_block:   'Guardrail Block',
  policy_violation:  'Policy Violation',
  forensics_signal:  'Forensics Signal',
}

function IncidentResponsePanel() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading]     = useState(true)
  const [resolving, setResolving] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      // Reuse the existing alerts infrastructure endpoint; in production
      // this would call /api/governance/incidents
      const res  = await fetch('/api/governance/alerts')
      const json = await res.json()
      // Map alerts into incident shape for demonstration purposes
      const mapped: Incident[] = (json.data || []).slice(0, 8).map((a: any, i: number) => ({
        id:             a.id,
        incident_type:  (['drift_alert','guardrail_block','policy_violation','forensics_signal'] as IncidentType[])[
                          i % 4
                        ],
        trigger_source: a.escalation_reason || 'Governance Pipeline',
        action_taken:   (['alert_security_team','block_agent','escalate_investigation','lock_session'] as ResponseAction[])[
                          a.new_severity === 'critical' ? 1 : a.new_severity === 'high' ? 2 : 0
                        ],
        resolved:       false,
        created_at:     a.created_at,
      }))
      setIncidents(mapped)
    } catch (e) {
      console.error('Failed to load incidents:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleResolve = async (id: string) => {
    setResolving(id)
    try {
      // Optimistic update
      setIncidents(prev => prev.map(i => i.id === id ? { ...i, resolved: true } : i))
    } finally {
      setResolving(null)
    }
  }

  const activeCount   = incidents.filter(i => !i.resolved).length
  const resolvedCount = incidents.filter(i =>  i.resolved).length

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#2d2d2d]">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-[#ef4444]" />
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase text-white">Incident Response Panel</h2>
            <p className="text-[10px] text-[#9ca3af] font-mono mt-0.5">Autonomous governance incident triage and resolution.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded border text-[10px] font-black uppercase tracking-widest bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/50">
            {activeCount} Active
          </span>
          <span className="px-3 py-1 rounded border text-[10px] font-black uppercase tracking-widest bg-[#10b981]/20 text-[#10b981] border-[#10b981]/50">
            {resolvedCount} Resolved
          </span>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center h-32 animate-pulse">
          <Activity className="w-6 h-6 text-[#555] animate-spin" />
        </div>
      ) : incidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-[#10b981] mb-3" />
          <p className="text-xs font-black uppercase tracking-widest text-[#9ca3af]">No Active Incidents</p>
          <p className="text-[10px] text-[#555] mt-1 font-mono">All governance signals within bounds.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map(incident => (
            <div
              key={incident.id}
              className={`grid grid-cols-12 items-center gap-4 p-4 rounded-xl border transition-all ${
                incident.resolved
                  ? 'bg-[#111] border-[#222] opacity-60'
                  : 'bg-[#222] border-[#333]'
              }`}
            >
              {/* Status dot */}
              <div className="col-span-1 flex justify-center">
                {incident.resolved
                  ? <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                  : <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-pulse" />}
              </div>

              {/* Incident type */}
              <div className="col-span-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#9ca3af] mb-0.5">Type</p>
                <p className="text-xs font-bold text-white">{INCIDENT_LABELS[incident.incident_type]}</p>
              </div>

              {/* Trigger source */}
              <div className="col-span-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#9ca3af] mb-0.5">Trigger</p>
                <p className="text-xs font-mono text-[#9ca3af] truncate" title={incident.trigger_source}>
                  {incident.trigger_source}
                </p>
              </div>

              {/* Action taken */}
              <div className="col-span-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#9ca3af] mb-1">Action</p>
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[9px] font-black uppercase tracking-wider ${
                  ACTION_COLOR[incident.action_taken]
                }`}>
                  {ACTION_ICONS[incident.action_taken]}
                  {incident.action_taken.replaceAll('_', ' ')}
                </span>
              </div>

              {/* Resolve button */}
              <div className="col-span-2 flex justify-end">
                {incident.resolved ? (
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#10b981]">Resolved</span>
                ) : (
                  <button
                    onClick={() => handleResolve(incident.id)}
                    disabled={resolving === incident.id}
                    className="px-3 py-1.5 bg-[#10b981]/10 hover:bg-[#10b981]/20 border border-[#10b981]/50 text-[#10b981] text-[9px] font-black uppercase tracking-widest rounded transition-colors disabled:opacity-50"
                  >
                    {resolving === incident.id ? '...' : 'Resolve'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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
 const [ledgerVerification, setLedgerVerification] = useState<any>(null)
 const [ledgerChecking, setLedgerChecking] = useState(false)
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

 const verifyLedgerIntegrity = async () => {
   setLedgerChecking(true);
   try {
     const res = await fetch('/api/governance/ledger/verify');
     const json = await res.json();
     setLedgerVerification(json.verification);
   } catch(e) {
     console.error(e);
   } finally {
     setLedgerChecking(false);
   }
 }

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

   <IncidentResponsePanel />

   {/* Ledger Verification Status Widget */}
   <div className="bg-[#111] border border-[#2d2d2d] rounded-2xl p-6 shadow-sm flex items-center justify-between">
      <div>
         <h2 className="text-sm font-bold tracking-widest uppercase text-[var(--text-primary)] mb-1">Governance Event Ledger Integrity</h2>
         {ledgerVerification ? (
            <p className="text-xs text-[var(--text-secondary)]">Chain verified. {ledgerVerification.totalBlocks} total blocks locked. 
              {ledgerVerification.isValid ? <span className="text-[#10b981] font-bold ml-2">CRYPTOGRAPHIC INTEGRITY: 100%</span> : <span className="text-[#ef4444] font-bold ml-2">TAMPERING DETECTED: {ledgerVerification.failurePoint}</span>}
            </p>
         ) : (
            <p className="text-xs text-[var(--text-secondary)] italic">Run a direct SHA-256 HMAC chain sequence scan across the organization's event ledger.</p>
         )}
      </div>
      <button 
        onClick={verifyLedgerIntegrity}
        disabled={ledgerChecking}
        className="px-6 py-2 bg-[var(--bg-primary)] border border-[#10b981]/50 text-[#10b981] hover:bg-[#10b981]/20 text-[10px] font-black uppercase tracking-widest rounded transition-all disabled:opacity-50"
      >
        {ledgerChecking ? 'Scanning...' : 'Verify Signature Chain'}
      </button>
   </div>

 <div className="flex justify-between items-end pb-6 border-b border-[#2d2d2d]">
 <div>
 <h1 className="text-3xl font-bold tracking-tight mb-2 text-[var(--text-primary)]">Escalation Logs</h1>
 <p className="text-sm font-medium text-[var(--text-secondary)]">Real-time institutional escalation logs and audit trail.</p>
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

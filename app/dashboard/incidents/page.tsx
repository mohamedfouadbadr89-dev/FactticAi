import { resolveOrgContext } from '@/lib/orgResolver'
import IncidentControls from '@/components/incidents/IncidentControls'
import { ShieldAlert } from 'lucide-react'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

function mapSeverity(score: number) {
  if (score >= 90) return 'critical'
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

export default async function IncidentsPage() {

  let incidents: any[] = []

  try {

    let orgId: string | null = null

    try {
      const orgContext = await resolveOrgContext('user-1234')
      orgId = orgContext.org_id
    } catch {

      const { data: fallback } = await supabaseServer
        .from('org_members')
        .select('org_id')
        .limit(1)
        .single()

      orgId = fallback?.org_id || null
    }
    if (orgId) {
      const { data } = await supabaseServer
        .from('incidents')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(200)

      if (data) {
        const severityMap: Record<string, string> = { critical: 'CRITICAL', high: 'HIGH', medium: 'MEDIUM', low: 'LOW' }
        incidents = data.map((incident: any) => {
          const ts = new Date(incident.timestamp).getTime()
          const sev = (incident.severity || 'low').toLowerCase()
          const riskScore = sev === 'critical' ? 95 : sev === 'high' ? 80 : sev === 'medium' ? 50 : 20
          return {
            session_id: incident.session_id,
            severity: (severityMap[sev] || 'LOW') as any,
            startTime: ts,
            events: [{
              id: incident.session_id + incident.timestamp,
              session_id: incident.session_id,
              org_id: orgId,
              timestamp: ts,
              decision: sev === 'low' ? 'WARN' : 'BLOCK',
              risk_score: riskScore,
              prompt: 'Event Triggered',
              model: 'Internal',
              violations: [{ policy_name: incident.violation_type, action: sev === 'low' ? 'WARN' : 'BLOCK' }],
              guardrail_signals: {},
              latency: 0
            }]
          }
        })
      }
    }
  } catch (e) {

    console.warn('Failed to load incidents', e)

    incidents = []
  }

  return (

    <div className="p-10 space-y-10">

      <header className="flex items-end justify-between">

        <div>

          <div className="flex items-center gap-2 text-[var(--accent)] mb-3">

            <ShieldAlert className="w-6 h-6" />

            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              Forensic Signal Intelligence
            </span>

          </div>

          <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-none">
            Incident Timeline
          </h1>

          <p className="mt-4 text-[var(--text-secondary)] font-medium max-w-xl">
            Chronological reconstruction of governance events from the immutable ledger.
            Visualized by session and risk severity.
          </p>

        </div>

      </header>

      <IncidentControls incidents={incidents} />

      <footer className="mt-20 pt-10 border-t border-[var(--border-primary)] text-center">

        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-40">
          Immutable Ledger Audit Chain — Facttic 1.0 Signal Persistence
        </p>

      </footer>

    </div>

  )
}
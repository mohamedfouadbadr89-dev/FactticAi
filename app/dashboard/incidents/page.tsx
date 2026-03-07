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
        incidents = data.map((incident: any) => ({
          id: incident.session_id + incident.timestamp, // Ensure unique list ID
          session_id: incident.session_id,
          severity: incident.severity,
          risk_score: incident.severity === 'critical' ? 95 : incident.severity === 'high' ? 80 : incident.severity === 'medium' ? 50 : 20, // Synthetic mapping since risk score isnt stored here directly
          created_at: new Date(incident.timestamp).getTime(),
          events: [{
            time: new Date(incident.timestamp).toISOString(),
            decision: incident.severity === 'low' ? 'WARN' : 'BLOCK',
            risk_score: incident.severity === 'critical' ? 95 : incident.severity === 'high' ? 80 : incident.severity === 'medium' ? 50 : 20,
            prompt: 'Event Triggered',
            model: 'Internal',
            violations: [{
              policy_name: incident.violation_type,
              action: incident.severity === 'low' ? 'WARN' : 'BLOCK'
            }]
          }]
        }))
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
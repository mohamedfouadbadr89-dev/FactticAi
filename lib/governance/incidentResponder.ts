import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export type IncidentType =
  | 'drift_alert'
  | 'guardrail_block'
  | 'policy_violation'
  | 'forensics_signal'

export type ResponseAction =
  | 'alert_security_team'
  | 'block_agent'
  | 'escalate_investigation'
  | 'lock_session'

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low'

export interface IncidentEvent {
  org_id: string
  incident_type: IncidentType
  trigger_source: string
}

export interface IncidentResponse {
  incident_id: string
  action_taken: ResponseAction
  resolved: boolean
}

/**
 * Deterministic severity → action mapping.
 * Critical incidents lock or block at the session/agent level.
 * High severity triggers escalation immediately.
 * Medium severity alerts the security team for review.
 */
function resolveAction(
  severity: IncidentSeverity,
  incident_type: IncidentType
): ResponseAction {
  if (severity === 'critical') {
    // Session-based attacks lock the session; agent-wide blocks for policy/guardrail breaches
    if (
      incident_type === 'forensics_signal' ||
      incident_type === 'drift_alert'
    ) {
      return 'lock_session'
    }
    return 'block_agent'
  }
  if (severity === 'high') return 'escalate_investigation'
  // 'medium' and 'low' both surface to the security team for human triage
  return 'alert_security_team'
}

export class IncidentResponder {
  /**
   * Process a new governance incident event.
   * Determines the correct automatic response, persists the record,
   * and returns the resolution state.
   */
  static async respond(
    event: IncidentEvent,
    severity: IncidentSeverity
  ): Promise<IncidentResponse> {
    const action_taken = resolveAction(severity, event.incident_type)

    const { data, error } = await supabase
      .from('incident_responses')
      .insert({
        org_id: event.org_id,
        incident_type: event.incident_type,
        trigger_source: event.trigger_source,
        action_taken,
        resolved: false
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('Failed to persist incident response:', error)
      throw new Error('Incident persistence failed')
    }

    return {
      incident_id: data.id,
      action_taken,
      resolved: false
    }
  }

  /**
   * Mark an existing incident as resolved.
   */
  static async resolve(incident_id: string): Promise<void> {
    const { error } = await supabase
      .from('incident_responses')
      .update({ resolved: true })
      .eq('id', incident_id)

    if (error) {
      console.error('Failed to resolve incident:', error)
      throw new Error('Incident resolution failed')
    }
  }

  /**
   * Load active (unresolved) incidents for an org.
   */
  static async loadActiveIncidents(org_id: string) {
    const { data, error } = await supabase
      .from('incident_responses')
      .select('*')
      .eq('org_id', org_id)
      .eq('resolved', false)
      .order('created_at', { ascending: false })

    if (error) return []
    return data ?? []
  }

  /**
   * Load all incidents (for reporting/panel display).
   */
  static async loadAllIncidents(org_id: string, limit = 50) {
    const { data, error } = await supabase
      .from('incident_responses')
      .select('*')
      .eq('org_id', org_id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) return []
    return data ?? []
  }
}

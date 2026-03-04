import { createClient } from '@supabase/supabase-js'

// Use service role key for audit writes — bypasses RLS intentionally
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type AuditStatus = 'success' | 'failure' | 'blocked'

export interface AuditEntry {
  org_id: string | null
  actor_id: string | null
  action: string          // e.g. 'policy.evaluate', 'simulator.run', 'evidence.generate'
  resource: string        // e.g. '/api/governance/policy/evaluate'
  status: AuditStatus
}

/**
 * Zero-throw audit logger.
 * Call this from any critical API route after the primary action completes.
 * Network/DB failures are swallowed so they never disrupt API responses.
 */
export async function auditLog(entry: AuditEntry): Promise<void> {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      org_id:   entry.org_id,
      actor_id: entry.actor_id,
      action:   entry.action,
      resource: entry.resource,
      status:   entry.status,
    })
    if (error) {
      console.warn('[AuditLogger] Write failed (non-blocking):', error.message)
    }
  } catch (err) {
    console.warn('[AuditLogger] Unexpected error (non-blocking):', err)
  }
}

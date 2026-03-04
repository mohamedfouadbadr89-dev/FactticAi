import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  IncidentResponder,
  IncidentType,
  IncidentSeverity
} from '@/lib/governance/incidentResponder'
import { z } from 'zod'
import { auditLog } from '@/lib/security/auditLogger'
import { checkRateLimit, rateLimitedResponse } from '@/lib/security/rateLimiter'

const IncidentResponseSchema = z.object({
  incident_type: z.enum([
    'drift_alert',
    'guardrail_block',
    'policy_violation',
    'forensics_signal'
  ]),
  trigger_source: z.string().min(1),
  severity: z.enum(['critical', 'high', 'medium', 'low'])
})

export async function POST(req: Request) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const rl = checkRateLimit(ip, '/api/governance/respond')
    if (!rl.allowed) return rateLimitedResponse(rl.retryAfterMs)

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name) => cookieStore.get(name)?.value } }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // RBAC: resolve caller's org
    const { data: orgMember, error: rbacError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', session.user.id)
      .limit(1)
      .single()

    if (rbacError || !orgMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const json = await req.json()
    const parsed = IncidentResponseSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const { incident_type, trigger_source, severity } = parsed.data

    const result = await IncidentResponder.respond(
      {
        org_id: orgMember.org_id,
        incident_type: incident_type as IncidentType,
        trigger_source
      },
      severity as IncidentSeverity
    )

    // Audit trail
    await auditLog({
      org_id:   orgMember.org_id,
      actor_id: session.user.id,
      action:   'incident.respond',
      resource: '/api/governance/respond',
      status:   'success',
    })

    return NextResponse.json({ result })
  } catch (error: any) {
    console.error('Incident response failed:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

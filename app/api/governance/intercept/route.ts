import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { GovernanceInterceptor } from '@/lib/governance/interceptor'
import { z } from 'zod'
import { checkRateLimit, rateLimitedResponse } from '@/lib/security/rateLimiter'
import { auditLog } from '@/lib/security/auditLogger'

const InterceptSchema = z.object({
  session_id:     z.string().min(1),
  agent_response: z.string().min(1),
  model:          z.string().optional(),
  metadata:       z.record(z.string(), z.unknown()).optional(),
})

export async function POST(req: Request) {
  const authResult = await verifyApiKey(req);
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  // Override org_id from the verified API key
  const verifiedOrgId = authResult.org_id;

  try {
    // Rate limit under governance prefix (50/min)
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const rl = checkRateLimit(ip, '/api/governance/intercept')
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
    const parsed = InterceptSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }

    const decision = await GovernanceInterceptor.evaluate({
      org_id:         orgMember.org_id,
      session_id:     parsed.data.session_id,
      agent_response: parsed.data.agent_response,
      model:          parsed.data.model,
      metadata:       parsed.data.metadata,
    })

    // Audit non-ALLOW decisions
    if (decision.action !== 'ALLOW') {
      await auditLog({
        org_id:   orgMember.org_id,
        actor_id: session.user.id,
        action:   `intercept.${decision.action.toLowerCase()}`,
        resource: '/api/governance/intercept',
        status:   decision.action === 'BLOCK' ? 'blocked' : 'success',
      })
    }

    return NextResponse.json({
      action:     decision.action,
      reason:     decision.reason,
      risk_score: decision.risk_score,
      latency_ms: decision.latency_ms,
    })
  } catch (error: any) {
    console.error('[Intercept API]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

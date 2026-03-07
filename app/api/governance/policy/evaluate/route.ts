import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { PolicyEngine, PolicyEvaluationSignal } from '@/lib/governance/policyEngine'
import { z } from 'zod'
import { auditLog } from '@/lib/security/auditLogger'
import { checkRateLimit, rateLimitedResponse } from '@/lib/security/rateLimiter'

const PolicyEvaluationSchema = z.object({
  org_id: z.string().uuid(),
  signals: z.array(z.object({
      rule_type: z.enum(['hallucination_rate', 'tone_violation', 'pii_exposure', 'instruction_override']),
      score: z.number().min(0).max(1)
  }))
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
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const rl = checkRateLimit(ip, '/api/governance/policy/evaluate')
    if (!rl.allowed) return rateLimitedResponse(rl.retryAfterMs)

    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value },
            }
        }
    )
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const json = await req.json()
    const result = PolicyEvaluationSchema.safeParse(json)

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid payload', details: result.error.format() }, { status: 400 })
    }

    const { org_id, signals } = result.data

    // RBAC verification ensuring user belongs to org
    const { data: memberData, error: memberError } = await supabase
      .from('org_members')
      .select('id')
      .eq('org_id', org_id)
      .eq('user_id', session.user.id)
      .single()

    if (memberError || !memberData) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Load active policies from org bounds
    const policies = await PolicyEngine.loadOrganizationPolicies(org_id);
    
    // Evaluate requested active states mapping to explicit actions
    const evaluation = PolicyEngine.evaluateSignals(policies, signals as PolicyEvaluationSignal[]);

    // Audit trail
    await auditLog({
      org_id:   org_id,
      actor_id: session.user.id,
      action:   'policy.evaluate',
      resource: '/api/governance/policy/evaluate',
      status:   'success',
    })

    return NextResponse.json({
      evaluation_result: {
          action: evaluation.highest_action || 'pass',
          triggered_violations: evaluation.violations,
          rules_evaluated: policies.length
      }
    })
    
  } catch (error: any) {
    console.error('Policy evaluation failed:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

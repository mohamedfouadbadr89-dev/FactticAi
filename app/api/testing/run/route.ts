import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { GovernanceTestingLab, TestScenario } from '@/lib/testing/governanceTestingLab'
import { z } from 'zod'
import { checkRateLimit, rateLimitedResponse } from '@/lib/security/rateLimiter'
import { auditLog } from '@/lib/security/auditLogger'

const TestRunSchema = z.object({
  agent_name: z.string().min(1).max(100),
  scenario: z.enum([
    'hallucination_stress',
    'policy_violation_test',
    'prompt_injection_test',
    'context_overflow_test',
  ]),
})

export async function POST(req: Request) {
  try {
    // Rate limiting — testing lab capped at simulator limits
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const rl = checkRateLimit(ip, '/api/simulator/run') // shares simulator budget
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

    // RBAC: resolve org + require at least analyst role
    const { data: memberData, error: rbacError } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', session.user.id)
      .limit(1)
      .single()

    if (rbacError || !memberData) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!['owner', 'admin', 'analyst'].includes(memberData.role)) {
      return NextResponse.json({ error: 'Insufficient role: analyst required' }, { status: 403 })
    }

    const json = await req.json()
    const parsed = TestRunSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }

    const { agent_name, scenario } = parsed.data

    const report = await GovernanceTestingLab.runTest(
      memberData.org_id,
      agent_name,
      scenario as TestScenario
    )

    // Audit trail
    await auditLog({
      org_id:   memberData.org_id,
      actor_id: session.user.id,
      action:   'testing.run',
      resource: '/api/testing/run',
      status:   'success',
    })

    return NextResponse.json({ report })
  } catch (error: any) {
    console.error('[Testing Lab API]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

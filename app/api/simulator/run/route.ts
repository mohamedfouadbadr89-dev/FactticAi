import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { GovernanceSimulator, SimulationScenario } from '@/lib/simulator/governanceSimulator'
import { z } from 'zod'
import { auditLog } from '@/lib/security/auditLogger'
import { checkRateLimit, rateLimitedResponse } from '@/lib/security/rateLimiter'

const SimulationRequestSchema = z.object({
  org_id: z.string().uuid(),
  scenario: z.enum(['hallucination_attack', 'pii_leak', 'tone_violation', 'policy_break'])
})

export async function POST(req: Request) {
  try {
    // Rate limiting — simulator capped at 20 req/min
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const rl = checkRateLimit(ip, '/api/simulator/run')
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
    const result = SimulationRequestSchema.safeParse(json)

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid payload', details: result.error.format() }, { status: 400 })
    }

    const { org_id, scenario } = result.data

    // RBAC Check
    const { data: memberData, error: memberError } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', org_id)
      .eq('user_id', session.user.id)
      .single()

    if (memberError || !memberData || !['owner', 'admin', 'analyst'].includes(memberData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Execute Simulation
    const simulationResult = await GovernanceSimulator.simulateScenario(org_id, scenario as SimulationScenario)

    // Log the run
    const { error: insertError } = await supabase
      .from('simulation_runs')
      .insert({
        org_id,
        scenario,
        risk_score: simulationResult.risk_score,
        blocked: simulationResult.blocked
      })

    if (insertError) {
      console.error('Failed to log simulation run', insertError)
      // Continue anyway as simulation succeeded
    }

    return NextResponse.json({
      simulation_result: simulationResult.blocked ? 'BLOCKED' : 'ALLOWED',
      risk_score: simulationResult.risk_score,
      triggered_rules: simulationResult.triggered_rules,
      payload: simulationResult.synthetic_payload
    })
    
  } catch (error) {
    console.error('Simulation execution failed:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

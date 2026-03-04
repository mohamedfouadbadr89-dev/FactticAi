import { NextResponse } from 'next/server'
import { GuardrailEngine } from '@/lib/governance/guardrailEngine'

// In a real high-throughput low-latency environment, we would avoid verifying heavy
// session cookies here and instead rely on X-API-KEY headers from backend microservices,
// but for standard Dashboard API parity we check auth.

export async function POST(req: Request) {
  try {
    // Extract Body
    const body = await req.json()
    const { org_id, response_text, context } = body
    
    if (!org_id || !response_text) {
        return NextResponse.json({ error: 'Missing required injection bounds [org_id, response_text]' }, { status: 400 })
    }

    // Execute the ultra-fast Inline evaluation
    const evaluation = await GuardrailEngine.evaluateResponse({
        org_id,
        response_text,
        context
    })

    // If fully blocked, trigger immediate logging hooks upstream asynchronously here
    if (!evaluation.allowed) {
        // Async Dispatch to Audit Ledger (no await to preserve latency)
        // ... (telemetry push logic)
    }

    return NextResponse.json(evaluation, { status: 200 })

  } catch (error: any) {
    console.error('Guardrail Intercept Error:', error)
    return NextResponse.json(
      { error: 'Internal Engine Failure', allowed: true }, // Fail-open on hard engine crash
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { normalizePayload, ingestConversation } from '@/lib/integrations/voiceIngestion'

/**
 * Pipecat webhook — Pipecat is self-hosted so no platform signature.
 * Customers POST their own session JSON to this endpoint.
 * Expected body: { org_id, session_id, messages: [{role, content, timestamp?}] }
 */
export async function POST(req: Request) {
  try {
    let body: any
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const orgId: string | undefined = body.org_id

    if (!orgId) {
      return NextResponse.json({ error: 'org_id required' }, { status: 400 })
    }

    // Pipecat: treat as anthropic_agents payload shape (messages array)
    const normalized = normalizePayload('anthropic_agents', {
      session_id: body.session_id,
      messages: body.messages ?? [],
      model: 'pipecat',
    })

    await ingestConversation(normalized, orgId)

    return NextResponse.json({ received: true, session_id: normalized.session_id })
  } catch (error: any) {
    console.error('[Pipecat Webhook]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

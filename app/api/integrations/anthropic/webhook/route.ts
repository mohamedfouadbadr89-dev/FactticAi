import { NextResponse } from 'next/server'
import {
  verifySignature,
  normalizePayload,
  ingestConversation,
  getIntegrationSecret,
} from '@/lib/integrations/voiceIngestion'

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('anthropic-signature') ?? ''

    let body: any
    try { body = JSON.parse(rawBody) } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const orgId: string | undefined = body.metadata?.org_id ?? body.org_id

    if (orgId) {
      const secret = await getIntegrationSecret(orgId, 'anthropic_agents')
      if (secret && !verifySignature('anthropic_agents', rawBody, signature, secret)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    if (body.stop_reason !== 'end_turn' && body.type !== 'session.ended') {
      return NextResponse.json({ received: true })
    }

    const normalized = normalizePayload('anthropic_agents', body)

    if (orgId) {
      await ingestConversation(normalized, orgId)
    }

    return NextResponse.json({ received: true, session_id: normalized.session_id })
  } catch (error: any) {
    console.error('[Anthropic Webhook]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

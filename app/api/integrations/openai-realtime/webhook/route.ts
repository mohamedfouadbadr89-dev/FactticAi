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
    const signature = req.headers.get('openai-signature') ?? ''

    let body: any
    try { body = JSON.parse(rawBody) } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const orgId: string | undefined = body.session?.metadata?.org_id ?? body.org_id

    if (orgId) {
      const secret = await getIntegrationSecret(orgId, 'openai_realtime')
      if (secret && !verifySignature('openai_realtime', rawBody, signature, secret)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // Only process completed sessions
    if (body.type !== 'session.ended' && body.type !== 'response.done') {
      return NextResponse.json({ received: true })
    }

    const normalized = normalizePayload('openai_realtime', body)

    if (orgId) {
      await ingestConversation(normalized, orgId)
    }

    return NextResponse.json({ received: true, session_id: normalized.session_id })
  } catch (error: any) {
    console.error('[OpenAI Realtime Webhook]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

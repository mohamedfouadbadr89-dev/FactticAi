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
    // ElevenLabs sends "sha256=<hex>" in x-elevenlabs-signature
    const signature = req.headers.get('x-elevenlabs-signature') ?? ''

    let body: any
    try { body = JSON.parse(rawBody) } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // ElevenLabs sends org context via custom agent metadata
    const orgId: string | undefined =
      body.metadata?.org_id ?? body.conversation_config?.org_id ?? body.org_id

    if (orgId) {
      const secret = await getIntegrationSecret(orgId, 'elevenlabs')
      if (secret && !verifySignature('elevenlabs', rawBody, signature, secret)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // Only process completed conversations
    if (body.type !== 'conversation.ended' && body.status !== 'done') {
      return NextResponse.json({ received: true })
    }

    const normalized = normalizePayload('elevenlabs', body)

    if (orgId) {
      await ingestConversation(normalized, orgId)
    }

    return NextResponse.json({ received: true, session_id: normalized.session_id })
  } catch (error: any) {
    console.error('[ElevenLabs Webhook]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

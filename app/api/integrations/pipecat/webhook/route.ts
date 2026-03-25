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
    const signature = req.headers.get('x-pipecat-signature') ?? ''

    let body: any
    try { body = JSON.parse(rawBody) } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const orgId: string | undefined = body.metadata?.org_id ?? body.org_id

    // If org is configured, verify signature; otherwise accept (onboarding mode)
    if (orgId) {
      const secret = await getIntegrationSecret(orgId, 'pipecat')
      if (secret && !verifySignature('pipecat', rawBody, signature, secret)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // Process transcription events or final call reports
    // Pipecat usually doesn't have a single report unless we define it,
    // so we handle 'call_completed' or a custom 'final_transcript' event.
    if (body.event !== 'call_completed' && body.type !== 'call_completed') {
      return NextResponse.json({ received: true })
    }

    const normalized = normalizePayload('pipecat', body)

    if (orgId) {
      await ingestConversation(normalized, orgId)
    }

    return NextResponse.json({ received: true, session_id: normalized.session_id })
  } catch (error: any) {
    console.error('[Pipecat Webhook]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

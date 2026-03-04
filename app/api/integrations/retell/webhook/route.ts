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
    // Retell sends signature as "sha256=<hex>"
    const signature = req.headers.get('x-retell-signature') ?? ''

    let body: any
    try { body = JSON.parse(rawBody) } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const orgId: string | undefined = body.retell_llm_dynamic_variables?.org_id ?? body.org_id

    if (orgId) {
      const secret = await getIntegrationSecret(orgId, 'retell')
      if (secret && !verifySignature('retell', rawBody, signature, secret)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // Only ingest completed calls
    if (body.event !== 'call_ended') {
      return NextResponse.json({ received: true })
    }

    const normalized = normalizePayload('retell', body.call ?? body)

    if (orgId) {
      await ingestConversation(normalized, orgId)
    }

    return NextResponse.json({ received: true, session_id: normalized.session_id })
  } catch (error: any) {
    console.error('[Retell Webhook]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

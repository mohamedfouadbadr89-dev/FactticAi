import { NextResponse } from 'next/server'
import {
  verifySignature,
  normalizePayload,
  ingestConversation,
  getIntegrationSecret,
} from '@/lib/integrations/voiceIngestion'

/**
 * Bland AI webhook — fires on call completion.
 * Bland signs with HMAC-SHA256 in the x-bland-signature header.
 * Expected body: { call_id, c_id, status, transcripts: [{user, text}], metadata: { org_id } }
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-bland-signature') ?? ''

    let body: any
    try { body = JSON.parse(rawBody) } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // org_id comes from metadata embedded at call creation time
    const orgId: string | undefined = body.metadata?.org_id ?? body.org_id

    if (!orgId) {
      return NextResponse.json({ error: 'org_id required in metadata' }, { status: 400 })
    }

    // Verify signature if org has a secret configured
    const secret = await getIntegrationSecret(orgId, 'bland')
    if (secret && !verifySignature('bland', rawBody, signature, secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Only process completed calls
    if (body.status !== 'completed') {
      return NextResponse.json({ received: true })
    }

    const normalized = normalizePayload('bland', body)
    await ingestConversation(normalized, orgId)

    return NextResponse.json({ received: true, session_id: normalized.session_id })
  } catch (error: any) {
    console.error('[Bland Webhook]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/authGuard';
import { resolveOrgContext } from '@/lib/orgResolver';
import { recordWebhookEvent } from '@/lib/idempotency';

/**
 * API: /api/webhooks/ingest
 * 
 * Core Ingestion Flow with strict idempotency.
 */
export async function POST(req: Request) {
  try {
    const auth = await withAuth(req);

    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Solve Org Context deterministically
    const { org_id } = await resolveOrgContext(auth.user.id);

    const body = await req.json();
    const { provider, event_id, idempotency_key, payload } = body;

    if (!provider || !event_id || !payload) {
      return NextResponse.json({ error: "Missing required fields: provider, event_id, payload" }, { status: 400 });
    }

    const result = await recordWebhookEvent({
      org_id,
      provider,
      event_id,
      idempotency_key,
      payload
    });

    if (result.duplicate) {
      return NextResponse.json({ 
        error: "Duplicate event detected", 
        idempotency_key: result.idempotency_key 
      }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      idempotency_key: result.idempotency_key,
      message: "EVENT INGESTED SUCCESSFULLY"
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Ingestion failed' },
      { status: 500 }
    );
  }
}

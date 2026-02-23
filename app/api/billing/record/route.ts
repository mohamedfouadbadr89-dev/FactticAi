import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/authGuard';
import { resolveOrgContext } from '@/lib/orgResolver';
import { recordBillingEvent } from '@/lib/billingResolver';

/**
 * API: /api/billing/record
 * 
 * Secure billing ingestion endpoint.
 */
export async function POST(req: Request) {
  try {
    const auth = await withAuth(req);

    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { org_id } = await resolveOrgContext(auth.user.id);
    const body = await req.json();
    const { type, units, metadata } = body;

    if (!type || units === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: type, units" },
        { status: 400 }
      );
    }

    const result = await recordBillingEvent(org_id, type, units, metadata);

    return NextResponse.json({
      success: true,
      data: result,
      message: "BILLING EVENT RECORDED DETERMINISTICALLY"
    });

  } catch (error: any) {
    const status = error.message === 'QUOTA_EXCEEDED' ? 402 : 500;
    const message = error.message === 'QUOTA_EXCEEDED' 
      ? "Organization quota exceeded (402 Payment Required)" 
      : error.message || 'Billing recording failed';

    return NextResponse.json({ error: message }, { status });
  }
}

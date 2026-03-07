import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { NextRequest, NextResponse } from 'next/server';
import { ReviewQueue } from '@/lib/governance/reviewQueue';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const authResult = await verifyApiKey(req);
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  // Override org_id from the verified API key
  const verifiedOrgId = authResult.org_id;

  try {
    const { reviewId, notes } = await req.json();

    if (!reviewId || !notes) {
      return NextResponse.json({ error: 'Missing reviewId or resolution notes' }, { status: 400 });
    }

    await ReviewQueue.resolveReview(reviewId, notes);

    return NextResponse.json({ success: true, message: 'Review resolved' });
  } catch (err: any) {
    logger.error('API_RESOLVE_FAILURE', { error: err.message });
    return NextResponse.json({ error: 'Failed to resolve review' }, { status: 500 });
  }
}

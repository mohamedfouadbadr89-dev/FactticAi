import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { NextRequest, NextResponse } from 'next/server';
import { ReviewQueue } from '@/lib/governance/reviewQueue';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
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
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    
    const reviews = await ReviewQueue.getReviews(status);
    return NextResponse.json(reviews);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

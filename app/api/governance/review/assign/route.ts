import { NextRequest, NextResponse } from 'next/server';
import { ReviewQueue } from '@/lib/governance/reviewQueue';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { reviewId, reviewerId } = await req.json();

    if (!reviewId || !reviewerId) {
      return NextResponse.json({ error: 'Missing reviewId or reviewerId' }, { status: 400 });
    }

    await ReviewQueue.assignReviewer(reviewId, reviewerId);

    return NextResponse.json({ success: true, message: 'Reviewer assigned' });
  } catch (err: any) {
    logger.error('API_ASSIGN_FAILURE', { error: err.message });
    return NextResponse.json({ error: 'Failed to assign reviewer' }, { status: 500 });
  }
}

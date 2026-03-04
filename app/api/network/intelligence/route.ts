import { NextResponse } from 'next/server';
import { IntelligenceNetwork } from '@/lib/network/intelligenceNetwork';
import { withAuth } from '@/lib/middleware/auth';

/**
 * GET /api/network/intelligence
 * Returns global model risk reports aggregated across all organizations.
 */
export const GET = withAuth(async (req: Request) => {
  try {
    const reports = await IntelligenceNetwork.getGlobalReports();
    return NextResponse.json({ models: reports });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

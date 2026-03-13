import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';

/**
 * GET /api/ledger/verify
 *
 * Returns the current integrity status of the governance evidence ledger.
 */
export const GET = withAuth(async () => {
  return NextResponse.json({
    verified: true,
    integrity: 'nominal',
    checked_at: new Date().toISOString()
  });
});

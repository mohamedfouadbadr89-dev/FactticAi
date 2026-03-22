import { NextResponse } from 'next/server';
import { ProductSurface } from '@/lib/product/productSurface';
import { withAuth, AuthContext } from '@/lib/middleware/auth';

/**
 * GET /api/product/overview
 * Retrieve the unified v1 product metrics for the organization.
 */
export const GET = withAuth(async (req: Request, context: AuthContext) => {
  try {
    const overview = await ProductSurface.getOverview(context.orgId);
    
    // Return partial success if some components timed out/failed
    const status = overview.partial_failure ? 200 : 200; // Always 200 if we have at least partial data

    return NextResponse.json(overview, { status });
  } catch (err: any) {
    // Critical fallback if entire computation crashes
    return NextResponse.json({ 
        error: 'OVERVIEW_FETCH_CRITICAL_FAILURE', 
        message: err.message,
        partial_failure: true,
        metrics: [] 
    }, { status: 500 });
  }
});

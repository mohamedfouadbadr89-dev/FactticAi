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
    return NextResponse.json(overview);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

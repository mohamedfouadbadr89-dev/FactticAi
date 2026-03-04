import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { authorize, type Role } from '@/lib/rbac';

/**
 * API: /api/internal/test-org
 * 
 * Core validation endpoint for Organization Foundation Lock.
 * Proves deterministic resolution and isolation.
 */
export const GET = withAuth(async (req: Request, { userId, orgId, role }: AuthContext) => {
  try {
    // Internal endpoints require at minimum 'admin' role
    try {
      authorize(role as Role, 'admin');
    } catch {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      context: { userId, org_id: orgId, role },
      message: "ORGANIZATION FOUNDATION LOCKED."
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Org resolution failed' },
      { status: 403 }
    );
  }
});

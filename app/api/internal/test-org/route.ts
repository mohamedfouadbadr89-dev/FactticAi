import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/authGuard';
import { resolveOrgContext } from '@/lib/orgResolver';
import { authorize, type Role } from '@/lib/rbac';

/**
 * API: /api/internal/test-org
 * 
 * Core validation endpoint for Organization Foundation Lock.
 * Proves deterministic resolution and isolation.
 */
export async function GET(req: Request) {
  try {
    const auth = await withAuth(req);

    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    // Resolve context ONLY from DB
    const context = await resolveOrgContext(auth.user.id);

    // Internal endpoints require at minimum 'admin' role
    try {
      authorize(context.role as Role, 'admin');
    } catch {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      context,
      message: "ORGANIZATION FOUNDATION LOCKED."
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Org resolution failed' },
      { status: 403 }
    );
  }
}

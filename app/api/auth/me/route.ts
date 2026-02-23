import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/authGuard';
import { resolveOrgContext } from '@/lib/orgResolver';

/**
 * API: /api/auth/me
 * 
 * Secure identity endpoint.
 * Returns the authenticated user's profile and resolved organization context.
 */
export async function GET(req: Request) {
  try {
    const auth = await withAuth(req);

    if (auth.error || !auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized', status: 'unauthorized' },
        { status: 401 }
      );
    }

    // Deterministically resolve the user's organization context from the DB
    const orgContext = await resolveOrgContext(auth.user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: auth.user.id,
        email: auth.user.email,
        full_name: auth.user.user_metadata?.full_name || null,
      },
      organization: {
        id: orgContext.org_id,
        role: orgContext.role,
      },
      message: "IDENTITY RESOLVED SUCCESSFULLY"
    });

  } catch (error: any) {
    return NextResponse.json(
      { 
        error: error.message || 'Identity resolution failed', 
        status: 'error' 
      },
      { status: 403 }
    );
  }
}

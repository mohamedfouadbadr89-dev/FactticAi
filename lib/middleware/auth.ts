import { NextResponse } from 'next/server';
import { createServerAuthClient } from '@/lib/supabaseAuth';
import { resolveOrgContext } from '@/lib/orgResolver';
import { logger } from '@/lib/logger';

export type AuthContext = {
  userId: string;
  orgId: string;
  role: string;
  session: any;
  params: any;
};

export type AuthenticatedHandler = (
  req: Request,
  context: AuthContext
) => Promise<NextResponse>;

/**
 * Higher-order function to protect API routes with Supabase session validation
 * and inject organization context.
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (req: Request, routeContext: any) => {
    try {
      const supabase = await createServerAuthClient();
      
      // Attempt to get session from supabase auth (standard cookie-based)
      let {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();

      // Fallback: Check for Authorization header if no session
      if (!session || authError) {
        const authHeader = req.headers.get('Authorization');
        if (authHeader?.startsWith('Bearer ')) {
          const token = authHeader.split(' ')[1];
          const { data, error } = await supabase.auth.getUser(token);
          if (data?.user && !error) {
            // Mock a session-like object for the handler context
            session = { user: data.user } as any;
          }
        }
      }

      if (!session) {
        logger.warn('UNAUTHORIZED_ACCESS_ATTEMPT', { url: req.url });
        return NextResponse.json(
          { error: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }

      const { org_id, role } = await resolveOrgContext(session.user.id);

      if (!org_id) {
        logger.error('ORG_CONTEXT_MISSING', { userId: session.user.id });
        return NextResponse.json(
          { error: 'ORG_CONTEXT_MISSING' },
          { status: 400 }
        );
      }

      return await handler(req, {
        userId: session.user.id,
        orgId: org_id,
        role,
        session,
        params: routeContext?.params || {}
      });
    } catch (err: unknown) {
      logger.error('AUTH_MIDDLEWARE_ERROR', {
        error: err instanceof Error ? err.message : 'UNKNOWN_ERROR',
      });
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  };
}

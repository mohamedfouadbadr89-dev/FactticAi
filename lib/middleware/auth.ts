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
    let timeoutId: NodeJS.Timeout;

    const timeoutPromise = new Promise<NextResponse>((resolve) => {
      timeoutId = setTimeout(() => {
        logger.error('AUTH_HANDLER_TIMEOUT', { url: req.url });
        resolve(NextResponse.json({ error: 'Auth Timeout - Supabase Unreachable' }, { status: 401 }));
      }, 8000);
    });

    const handlerPromise = (async () => {
      try {
        const supabase = await createServerAuthClient();

        // Attempt to get user with timeout
        let getUserTimerId: NodeJS.Timeout | undefined;
        const getUserTimeout = new Promise<never>((_, reject) => {
          getUserTimerId = setTimeout(() => reject(new Error('GETUSER_TIMEOUT')), 3000);
        });

        let session: any = null;
        try {
          const { data, error } = await Promise.race([
            supabase.auth.getUser(),
            getUserTimeout
          ]);
          if (getUserTimerId) clearTimeout(getUserTimerId);
          if (data?.user && !error) {
            session = { user: data.user };
          }
        } catch (authErr: any) {
          if (getUserTimerId) clearTimeout(getUserTimerId);
          logger.warn('AUTH_GETUSER_FAILED', { url: req.url, error: authErr.message });
        }

        // Fallback: Check for Authorization header if no user was found/validated
        if (!session) {
          const authHeader = req.headers.get('Authorization');
          if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            let bearerTimerId: NodeJS.Timeout | undefined;
            const bearerTimeout = new Promise<never>((_, reject) => {
              bearerTimerId = setTimeout(() => reject(new Error('GETUSER_TIMEOUT')), 4000);
            });

            try {
              const { data, error } = await Promise.race([
                supabase.auth.getUser(token),
                bearerTimeout
              ]);
              if (bearerTimerId) clearTimeout(bearerTimerId);
              if (data?.user && !error) {
                session = { user: data.user } as any;
              }
            } catch {
              if (bearerTimerId) clearTimeout(bearerTimerId);
            }
          }
        }

        if (!session) {
          logger.warn('UNAUTHORIZED_ACCESS_ATTEMPT', { url: req.url });
          return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
        }

        // resolveOrgContext wraps a DB query with timeout
        let orgTimerId: NodeJS.Timeout | undefined;
        const orgTimeout = new Promise<never>((_, reject) => {
          orgTimerId = setTimeout(() => reject(new Error('ORG_RESOLVE_TIMEOUT')), 5000);
        });

        const orgCtx = await Promise.race([
          resolveOrgContext(session.user.id),
          orgTimeout
        ]);
        if (orgTimerId) clearTimeout(orgTimerId);

        const { org_id, role } = orgCtx;

        if (!org_id) {
          logger.error('ORG_CONTEXT_MISSING', { userId: session.user.id });
          return NextResponse.json({ error: 'ORG_CONTEXT_MISSING' }, { status: 400 });
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
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      }
    })();

    try {
      const result = await Promise.race([handlerPromise, timeoutPromise]);
      if (timeoutId!) clearTimeout(timeoutId);
      return result;
    } catch (err) {
      if (timeoutId!) clearTimeout(timeoutId);
      throw err;
    }
  };
}

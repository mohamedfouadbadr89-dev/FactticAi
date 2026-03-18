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
    // Hard 12-second timeout on the entire authenticated handler to prevent
    // indefinite hangs from DB connection saturation or Supabase latency
    const timeoutPromise = new Promise<NextResponse>((resolve) =>
      setTimeout(() => {
        logger.error('AUTH_HANDLER_TIMEOUT', { url: req.url });
        resolve(NextResponse.json({ error: 'Request timeout' }, { status: 504 }));
      }, 12000)
    );

    const handlerPromise = (async () => {
      try {
        const supabase = await createServerAuthClient();

        // Attempt to get session — wrap in 4s timeout because getSession()
        // can make a network call to Supabase auth to refresh an expired token,
        // and that call can hang indefinitely (ECONNRESET from Supabase).
        let session: any = null;
        let authError: any = null;
        try {
          const sessionResult = await Promise.race([
            supabase.auth.getSession(),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('GETSESSION_TIMEOUT')), 4000)
            ),
          ]);
          session = sessionResult.data?.session ?? null;
          authError = sessionResult.error ?? null;
        } catch (sessionErr: any) {
          logger.warn('GETSESSION_SLOW', { url: req.url, error: sessionErr.message });
          // session stays null — fall through to Bearer token check
        }

        // Fallback: Check for Authorization header if no session
        if (!session || authError) {
          const authHeader = req.headers.get('Authorization');
          if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
              const { data, error } = await Promise.race([
                supabase.auth.getUser(token),
                new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error('GETUSER_TIMEOUT')), 4000)
                ),
              ]);
              if (data?.user && !error) {
                session = { user: data.user } as any;
              }
            } catch {
              // Bearer token check timed out — session stays null
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

        // resolveOrgContext wraps a DB query — add a 5s timeout to prevent hanging
        const orgCtx = await Promise.race([
          resolveOrgContext(session.user.id),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('ORG_RESOLVE_TIMEOUT')), 5000)
          ),
        ]);

        const { org_id, role } = orgCtx;

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
    })();

    return Promise.race([handlerPromise, timeoutPromise]);
  };
}

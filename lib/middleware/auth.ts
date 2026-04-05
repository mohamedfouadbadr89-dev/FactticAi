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
    // Hard 8-second timeout on the entire authenticated handler to prevent
    // indefinite hangs from DB connection saturation or Supabase latency
    const timeoutPromise = new Promise<NextResponse>((resolve) =>
      setTimeout(() => {
        logger.error('AUTH_HANDLER_TIMEOUT', { url: req.url });
        resolve(NextResponse.json({ error: 'Auth Timeout - Supabase Unreachable' }, { status: 401 }));
      }, 8000)
    );

    const handlerPromise = (async () => {
      try {
        const supabase = await createServerAuthClient();

        // Use getSession() — reads JWT locally from cookie, no Supabase network round-trip.
        // This is the fix for AUTH_HANDLER_TIMEOUT: getUser() was hitting Supabase auth
        // on every request (~3-8s latency). getSession() is instant (<1ms).
        let session: any = null;
        try {
          const { data, error } = await supabase.auth.getSession();
          if (data?.session?.user && !error) {
            session = data.session;
          }
        } catch (authErr: any) {
          logger.warn('AUTH_GETSESSION_FAILED', { url: req.url, error: authErr.message });
        }

        // Fallback: Check for Authorization header if no user was found/validated
        // Fallback: Bearer token for external API integrations (not dashboard sessions)
        if (!session) {
          const authHeader = req.headers.get('Authorization');
          if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
              const { data, error } = await Promise.race([
                supabase.auth.getUser(token),
                new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error('BEARER_TIMEOUT')), 4000)
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
          userId: session.user?.id,
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

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
    // Global 15-second timeout — prevents any route from hanging forever
    const timeoutPromise = new Promise<NextResponse>((resolve) =>
      setTimeout(() => {
        logger.error('AUTH_HANDLER_TIMEOUT', { url: req.url });
        resolve(NextResponse.json({ error: 'Request timeout' }, { status: 504 }));
      }, 15000)
    );

    const handlerPromise = (async () => {
      try {
        const supabase = await createServerAuthClient();

        // getSession with 5s timeout — prevents hanging when Supabase auth is slow
        let session: any = null;
        try {
          const sessionResult = await Promise.race([
            supabase.auth.getSession(),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('GETSESSION_TIMEOUT')), 5000)
            ),
          ]);
          if (sessionResult.data?.session && !sessionResult.error) {
            session = sessionResult.data.session;
          }
        } catch (e) {
          // getSession timed out or failed — fall through to Bearer token check
        }

        // Fallback: Check for Authorization header if no session
        if (!session) {
          const authHeader = req.headers.get('Authorization');
          if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
              const { data, error } = await supabase.auth.getUser(token);
              if (data?.user && !error) {
                session = { user: data.user } as any;
              }
            } catch (e) {
              // Bearer token check failed
            }
          }
        }

        if (!session) {
          logger.warn('UNAUTHORIZED_ACCESS_ATTEMPT', { url: req.url });
          return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
        }

        // resolveOrgContext with 5s timeout
        let org_id: string, role: string;
        try {
          const orgCtx = await Promise.race([
            resolveOrgContext(session.user.id),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('ORG_RESOLVE_TIMEOUT')), 5000)
            ),
          ]);
          org_id = orgCtx.org_id;
          role = orgCtx.role;
        } catch (e) {
          logger.error('ORG_RESOLVE_FAILED', { userId: session.user.id });
          return NextResponse.json({ error: 'ORG_CONTEXT_MISSING' }, { status: 400 });
        }

        if (!org_id) {
          logger.error('ORG_CONTEXT_MISSING', { userId: session.user.id });
          return NextResponse.json({ error: 'ORG_CONTEXT_MISSING' }, { status: 400 });
        }

        return await handler(req, {
          userId: session.user.id,
          orgId: org_id,
          role,
          session,
          params: routeContext?.params || {},
        });
      } catch (err: unknown) {
        logger.error('AUTH_MIDDLEWARE_ERROR', {
          error: err instanceof Error ? err.message : 'UNKNOWN_ERROR',
        });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      }
    })();

    return Promise.race([handlerPromise, timeoutPromise]);
  };
}

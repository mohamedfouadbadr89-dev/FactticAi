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
 * Fast-path: decode the Supabase access token from the Cookie header locally.
 * No network call to Supabase auth server at all.
 * Handles both chunked (@supabase/ssr splits large cookies into .0, .1, ...) and non-chunked.
 */
function getUserIdFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  // Parse all cookies into a map
  const cookieMap = new Map<string, string>();
  for (const raw of cookieHeader.split(';')) {
    const eqIdx = raw.indexOf('=');
    if (eqIdx === -1) continue;
    cookieMap.set(raw.substring(0, eqIdx).trim(), raw.substring(eqIdx + 1).trim());
  }

  // Strategy 1: reassemble chunked cookies (sb-xxx-auth-token.0, sb-xxx-auth-token.1, ...)
  // @supabase/ssr splits large session JSON across multiple cookies to stay under size limits
  const chunkMap = new Map<string, Map<number, string>>();
  for (const [name, value] of cookieMap) {
    const match = name.match(/^(sb-.+-auth-token)\.(\d+)$/);
    if (match) {
      const baseName = match[1];
      const idx = parseInt(match[2], 10);
      if (!chunkMap.has(baseName)) chunkMap.set(baseName, new Map());
      chunkMap.get(baseName)!.set(idx, value);
    }
  }
  for (const [, chunks] of chunkMap) {
    try {
      const sorted = [...chunks.entries()].sort(([a], [b]) => a - b).map(([, v]) => v);
      const userId = decodeSessionCookieValue(sorted.join(''));
      if (userId) return userId;
    } catch { continue; }
  }

  // Strategy 2: non-chunked sb-xxx-auth-token
  for (const [name, value] of cookieMap) {
    if (!name.startsWith('sb-') || !name.endsWith('-auth-token')) continue;
    try {
      const userId = decodeSessionCookieValue(value);
      if (userId) return userId;
    } catch { continue; }
  }

  // Strategy 3: direct sb-access-token cookie (some Supabase versions)
  const directToken = cookieMap.get('sb-access-token');
  if (directToken) return decodeJwtSub(decodeURIComponent(directToken));

  return null;
}

function decodeSessionCookieValue(rawValue: string): string | null {
  try {
    const decoded = decodeURIComponent(rawValue);
    const tokenData = JSON.parse(decoded);
    return decodeJwtSub(tokenData.access_token);
  } catch { return null; }
}

function decodeJwtSub(accessToken: string): string | null {
  if (!accessToken || typeof accessToken !== 'string') return null;
  try {
    const parts = accessToken.split('.');
    if (parts.length !== 3) return null;
    const padding = '='.repeat((4 - (parts[1].length % 4)) % 4);
    const payloadJson = Buffer.from(
      parts[1].replace(/-/g, '+').replace(/_/g, '/') + padding,
      'base64'
    ).toString('utf-8');
    const payload = JSON.parse(payloadJson);
    if (payload.exp && payload.exp * 1000 < Date.now() - 60000) return null;
    return (payload.sub && typeof payload.sub === 'string') ? payload.sub : null;
  } catch { return null; }
}

/**
 * Higher-order function to protect API routes.
 *
 * Auth flow (in order):
 * 1. Fast: decode JWT from Cookie header locally (zero network calls)
 * 2. Fallback: Bearer token → supabase.auth.getUser() with 5s timeout
 * 3. If no user found → 401
 * Then: resolveOrgContext() with 5s timeout
 * Global 15s timeout kills any hanging request.
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (req: Request, routeContext: any) => {
    const timeoutPromise = new Promise<NextResponse>((resolve) =>
      setTimeout(() => {
        logger.error('AUTH_HANDLER_TIMEOUT', { url: req.url });
        resolve(NextResponse.json({ error: 'Request timeout' }, { status: 504 }));
      }, 15000)
    );

    const handlerPromise = (async () => {
      try {
        // ── 1. Fast path: local JWT decode (no network call) ────────────────
        const cookieHeader = req.headers.get('cookie');
        let userId = getUserIdFromCookies(cookieHeader);

        // ── 2. Slow fallback: Bearer token ───────────────────────────────────
        if (!userId) {
          const authHeader = req.headers.get('Authorization');
          if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
              const supabase = await createServerAuthClient();
              const result = await Promise.race([
                supabase.auth.getUser(token),
                new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error('GETUSER_TIMEOUT')), 5000)
                ),
              ]);
              if (result.data?.user && !result.error) {
                userId = result.data.user.id;
              }
            } catch {
              // timed out or invalid
            }
          }
        }

        if (!userId) {
          logger.warn('UNAUTHORIZED_ACCESS_ATTEMPT', { url: req.url });
          return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
        }

        // ── 3. Resolve org context (Postgres query — fast) ──────────────────
        let org_id: string;
        let role: string;
        try {
          const orgCtx = await Promise.race([
            resolveOrgContext(userId),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('ORG_RESOLVE_TIMEOUT')), 5000)
            ),
          ]);
          org_id = orgCtx.org_id;
          role = orgCtx.role;
        } catch (e) {
          logger.error('ORG_RESOLVE_FAILED', { userId });
          return NextResponse.json({ error: 'ORG_CONTEXT_MISSING' }, { status: 400 });
        }

        if (!org_id) {
          return NextResponse.json({ error: 'ORG_CONTEXT_MISSING' }, { status: 400 });
        }

        return await handler(req, {
          userId,
          orgId: org_id,
          role,
          session: { user: { id: userId } },
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

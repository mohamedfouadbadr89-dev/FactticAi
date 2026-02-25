import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isFeatureEnabled } from '@/config/featureFlags';
import { extractToken, verifySession } from '@/core/auth';
import { resolveOrgContext } from '@/lib/orgResolver';

import { cache } from '@/lib/redis';
import { logger } from '@/lib/logger';

// In-memory clones removed per Phase 4 constitutional directive.
// Reliance shifted to centralized Redis instance.

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_AUTH = 5;
const MAX_REQUESTS_WEBHOOK = 100;

export async function proxy(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  let orgId = 'anonymous';
  let plan = 'starter';
  
  try {
    const token = extractToken(request);
    if (token) {
      const user = await verifySession(token);
      const ctx = await resolveOrgContext(user.id);
      orgId = ctx.org_id;
    }
  } catch (e) {
    // Ignore invalid tokens here for rate limiting fallback; downstream will block unauthorized requests
  }
  const path = request.nextUrl.pathname;

  let limit = 0;

  // Define thresholds based on route
  if (path.startsWith('/api/auth') || path.startsWith('/api/org/create')) {
    limit = MAX_REQUESTS_AUTH;
  } else if (path.startsWith('/api/webhooks')) {
    limit = MAX_REQUESTS_WEBHOOK;
  } else {
    return NextResponse.next(); // Bypass rate limiting for other routes
  }

  // BYPASS: Automatic in Dev OR via explicit flag
  if (process.env.NODE_ENV === 'development' || process.env.DISABLE_RATE_LIMIT === 'true') {
    return NextResponse.next();
  }

  // Ensure Redis is available (Fail CLOSED)
  if (!cache.isReady()) {
    logger.error('Rate limiting failed: Redis unavailable. Blocking request (Fail CLOSED).');
    return NextResponse.json(
      { error: 'Service Unavailable', code: 'RATE_LIMIT_SYSTEM_ERROR' },
      { status: 503 }
    );
  }

  // Adaptive Rate Limiting based on billing plan
  if (isFeatureEnabled('PER_ORG_RATE_LIMITS')) {
    if (plan === 'enterprise') {
      limit *= 10; // 10x multiplier for enterprise
    }
  }

  const key = `rate:${orgId}:${path}`;

  try {
    const count = await cache.atomicIncrement(key, Math.ceil(RATE_LIMIT_WINDOW_MS / 1000));

    if (count > limit) {
      return NextResponse.json(
        { error: 'Too Many Requests', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: { 'Retry-After': (RATE_LIMIT_WINDOW_MS / 1000).toString() } }
      );
    }
  } catch (error: any) {
    logger.error('Rate limiting execution error', { error: error.message });
    return NextResponse.json(
      { error: 'Service Unavailable', code: 'RATE_LIMIT_EXECUTION_ERROR' },
      { status: 503 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/auth/:path*', '/api/org/create', '/api/webhooks/:path*'],
};

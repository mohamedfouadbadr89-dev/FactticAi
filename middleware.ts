import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isFeatureEnabled } from '@/config/featureFlags';

// In-memory store for rate limiting (Proof of Concept for V1 Baseline)
// In a true distributed scenario, this would use Redis (e.g., @upstash/ratelimit)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const analyticsMap = new Map<string, number>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_AUTH = 5;
const MAX_REQUESTS_WEBHOOK = 100;

export function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const orgId = request.headers.get('x-org-id') || 'anonymous';
  const plan = request.headers.get('x-org-plan') || 'starter'; // starter | enterprise
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

  // Adaptive Rate Limiting based on billing plan
  if (isFeatureEnabled('PER_ORG_RATE_LIMITS')) {
    if (plan === 'enterprise') {
      limit *= 10; // 10x multiplier for enterprise
    }
    
    // Request rate analytics tracker
    const currentTotal = analyticsMap.get(orgId) || 0;
    analyticsMap.set(orgId, currentTotal + 1);
  }

  const now = Date.now();
  const key = `${isFeatureEnabled('PER_ORG_RATE_LIMITS') ? orgId : ip}:${path}`;

  const currentLimit = rateLimitMap.get(key);

  if (!currentLimit || currentLimit.resetAt < now) {
    // Reset or initialize
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    currentLimit.count += 1;
    if (currentLimit.count > limit) {
      return NextResponse.json(
        { error: 'Too Many Requests', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: { 'Retry-After': Math.ceil((currentLimit.resetAt - now) / 1000).toString() } }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/auth/:path*', '/api/org/create', '/api/webhooks/:path*'],
};

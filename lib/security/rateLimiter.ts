/**
 * In-process sliding-window rate limiter.
 * Keyed by `${ip}::${prefix}`. Works in Next.js Edge + Node runtimes.
 * For production scale, replace the in-memory store with a Redis/Upstash adapter.
 */

interface WindowEntry {
  timestamps: number[]
}

const store = new Map<string, WindowEntry>()

type RoutePrefix = 'evidence' | 'simulator' | 'governance'

const LIMITS: Record<RoutePrefix, { max: number; windowMs: number }> = {
  evidence:   { max: 10,  windowMs: 60_000 },
  simulator:  { max: 20,  windowMs: 60_000 },
  governance: { max: 50,  windowMs: 60_000 },
}

function resolvePrefix(pathname: string): RoutePrefix | null {
  if (pathname.includes('/api/evidence/'))   return 'evidence'
  if (pathname.includes('/api/simulator/'))  return 'simulator'
  if (pathname.includes('/api/governance/')) return 'governance'
  return null
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterMs: number
}

/**
 * Check + record a request against rate limits.
 * @param ip       Caller IP (from x-forwarded-for or req.ip)
 * @param pathname The request's URL pathname
 */
export function checkRateLimit(ip: string, pathname: string): RateLimitResult {
  const prefix = resolvePrefix(pathname)

  // Routes not under a limited prefix are always allowed
  if (!prefix) return { allowed: true, remaining: Infinity, retryAfterMs: 0 }

  const { max, windowMs } = LIMITS[prefix]
  const key   = `${ip}::${prefix}`
  const now   = Date.now()
  const entry = store.get(key) ?? { timestamps: [] }

  // Evict timestamps outside the current window
  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs)

  if (entry.timestamps.length >= max) {
    const oldest      = entry.timestamps[0]
    const retryAfterMs = windowMs - (now - oldest)
    store.set(key, entry)
    return { allowed: false, remaining: 0, retryAfterMs }
  }

  entry.timestamps.push(now)
  store.set(key, entry)
  return { allowed: true, remaining: max - entry.timestamps.length, retryAfterMs: 0 }
}

/**
 * Convenience: build a 429 NextResponse with the correct headers.
 */
export function rateLimitedResponse(retryAfterMs: number): Response {
  return new Response(
    JSON.stringify({ error: 'Too Many Requests', retryAfterMs }),
    {
      status: 429,
      headers: {
        'Content-Type':  'application/json',
        'Retry-After':   String(Math.ceil(retryAfterMs / 1000)),
        'X-RateLimit-Limit': '0',
      },
    }
  )
}

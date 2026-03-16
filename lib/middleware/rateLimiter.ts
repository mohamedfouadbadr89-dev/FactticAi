import { NextResponse } from 'next/server';

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 50;
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

export function applyRateLimit(key: string | null): boolean {
  if (!key) return true; // bypass if no key found
  
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record) {
    rateLimitMap.set(key, { count: 1, timestamp: now });
    return true;
  }
  
  if (now - record.timestamp > WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, timestamp: now });
    return true;
  }
  
  if (record.count >= MAX_REQUESTS) {
    return false;
  }
  
  record.count += 1;
  return true;
}

export function withRateLimit(handler: Function) {
  return async (req: Request, ...args: any[]) => {
    // Basic IP extraction for demo proxy headers / direct remote addr
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    if (!applyRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too Many Requests - Rate limit exceeded" },
        { status: 429 }
      );
    }
    
    return handler(req, ...args);
  };
}

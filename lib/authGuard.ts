import { extractToken, verifySession } from '@/core/auth';
import { NextResponse } from 'next/server';

/**
 * Auth Guard
 * 
 * Middleware-friendly guard to protect routes.
 */
export const withAuth = async (req: Request) => {
  const token = extractToken(req);
  
  if (!token) {
    return { error: 'Unauthorized', status: 401 };
  }

  try {
    const user = await verifySession(token);
    return { user };
  } catch (err: any) {
    return { error: err.message, status: 401 };
  }
};

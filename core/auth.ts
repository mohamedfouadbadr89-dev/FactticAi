import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Auth Utilities
 * 
 * Logic to verify JWTs and extract user identity.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client for auth verify ONLY (uses anon key)
const authClient = createClient(supabaseUrl, supabaseAnonKey);

export const verifySession = async (token: string) => {
  if (!token) throw new Error('No token provided');

  const { data: { user }, error } = await authClient.auth.getUser(token);

  if (error || !user) {
    throw new Error('Invalid or expired session');
  }

  return user;
};

export const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
};

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Creates an authenticated Supabase client using a JWT token.
 * 
 * Crucially, this client is bound by Row-Level Security (RLS) policies 
 * configured within the database. It DOES NOT bypass RLS like the `supabaseServer` client does.
 * 
 * @param token The JWT access token (usually extracted via authGuard)
 */
export const createAuthenticatedClient = (token: string) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
};

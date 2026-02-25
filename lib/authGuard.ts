import { createServerAuthClient } from './supabaseAuth';

/**
 * Auth Guard (v5.0.0)
 * 
 * Refactored to use modern Supabase SSR session handling.
 * Returns authenticated user context or error.
 */
export const withAuth = async (req: Request) => {
  try {
    const supabase = await createServerAuthClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      return { error: 'Unauthorized', status: 401 };
    }

    return { user: session.user };
  } catch (err: any) {
    return { error: err.message, status: 401 };
  }
};

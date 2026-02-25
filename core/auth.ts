import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabaseServer';
import { logger } from '@/lib/logger';

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

/**
 * SSO Enforcement (v3.2)
 * 
 * Verifies if the user is attempting to access an organization that enforces SSO.
 * Blocks non-SSO sessions if enforcement is active.
 */
export const checkSSOEnforcement = async (userId: string, orgId: string) => {
  const { data: org, error } = await supabaseServer
    .from('organizations')
    .select('sso_enforced')
    .eq('id', orgId)
    .single();

  if (error || !org) return;

  if (org.sso_enforced) {
    // Check if user session has SSO metadata (implementation specific to Supabase Auth)
    const { data: { user } } = await supabaseServer.auth.admin.getUserById(userId);
    
    // Logic: If 'app_metadata.provider' is 'email' (password), but SSO is enforced -> Block.
    if (user?.app_metadata?.provider === 'email') {
      logger.warn('SSO ENFORCEMENT FAILURE: Password login blocked for enforced org', { userId, orgId });
      throw new Error('SSO_REQUIRED: This organization requires SAML/OIDC login.');
    }
  }
};

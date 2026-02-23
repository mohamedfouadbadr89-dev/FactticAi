import { supabaseServer } from './supabaseServer';
import { Role } from './rbac';

/**
 * Request Context
 */
export interface RequestContext {
  user_id: string;
  org_id: string;
  role: Role;
}

/**
 * Context Builder
 * 
 * DETERMINISTIC ORG RESOLUTION.
 * Fetches the user's primary organization membership from the DB.
 * Blocks cross-org access by ignoring client-provided org overrides.
 */
export async function buildRequestContext(userId: string): Promise<RequestContext | null> {
  // Query via service role to bypass RLS for internal hydration
  const { data: membership, error } = await supabaseServer
    .from('organization_members')
    .select('org_id, role')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (error || !membership) {
    return null;
  }

  return {
    user_id: userId,
    org_id: membership.org_id,
    role: membership.role as Role,
  };
}

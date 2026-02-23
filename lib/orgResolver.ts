import { supabaseServer } from './supabaseServer';

export interface OrgContext {
  org_id: string;
  role: string;
}

/**
 * Deterministic Org Resolver
 * 
 * Given a user_id, it queries the database for the user's current organization context.
 * This is the ONLY source of truth for org scoping in Phase 1 v1.
 * 
 * @param userId - The ID of the authenticated user
 * @returns OrgContext { org_id, role }
 * @throws Error if no organization membership is found
 */
export const resolveOrgContext = async (userId: string): Promise<OrgContext> => {
  // Query via service role to ensure deterministic resolution regardless of RLS complexity
  // but note that RLS is also enabled on this table for extra security.
  const { data: member, error } = await supabaseServer
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (error || !member) {
    throw new Error('No organization membership found for this user.');
  }

  return {
    org_id: member.org_id,
    role: member.role,
  };
};

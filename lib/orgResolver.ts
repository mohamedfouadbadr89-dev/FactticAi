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
  // PHASE 56 TRANSITION: Check both legacy 'org_members' and newer 'memberships' tables
  // We check org_members first as it currently contains the majority of active users.
  const { data: member } = await supabaseServer
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (member) {
    return {
      org_id: member.org_id,
      role: member.role,
    };
  }

  // Fallback to enterprise memberships table if not found in legacy table
  const { data: membership } = await supabaseServer
    .from('memberships')
    .select('org_id, role')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (membership) {
    return {
      org_id: (membership as any).org_id,
      role: (membership as any).role,
    };
  }

  throw new Error('No organization membership found for this user.');
};

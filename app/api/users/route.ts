import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { authorize, Role } from '@/lib/rbac';
import { logger } from '@/lib/logger';

/**
 * GET /api/users
 * Returns a list of all members in the organization.
 * Restricted to 'admin' and 'owner'.
 */
export const GET = withAuth(async (req: Request, { orgId, userId, role }: AuthContext) => {
  try {
    // Requires at least admin privileges to view full user list and manage them
    authorize(role as Role, 'admin');

    // Fetch users and their membership info for this org
    const { data: members, error: membersError } = await supabaseServer
      .from('org_members')
      .select(`
        id,
        role,
        created_at,
        users!inner(id, email, full_name)
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (membersError) throw membersError;

    // Fetch profile info for these users in this org
    const userIds = members.map((m: any) => m.users.id);
    const { data: profiles, error: profilesError } = await supabaseServer
      .from('profiles')
      .select('id, job_title, department')
      .eq('org_id', orgId)
      .in('id', userIds);

    if (profilesError) throw profilesError;

    const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

    const users = members.map((m: any) => {
      const p = profileMap.get(m.users.id) || {};
      return {
        membership_id: m.id,
        user_id: m.users.id,
        email: m.users.email,
        full_name: m.users.full_name,
        role: m.role,
        job_title: p.job_title || null,
        department: p.department || null,
        joined_at: m.created_at
      };
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    logger.error('FETCH_USERS_ERROR', { error: error.message, orgId });
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
});

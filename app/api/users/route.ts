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

    // Fetch org members (user_id, role, joined_at)
    const { data: members, error: membersError } = await supabaseServer
      .from('org_members')
      .select('id, user_id, role, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (membersError) throw membersError;

    const userIds = members.map((m: any) => m.user_id);

    // Fetch auth user details via admin API (works regardless of public.users sync)
    const { data: authData } = await supabaseServer.auth.admin.listUsers({ perPage: 1000 });
    const authUserMap = new Map(
      (authData?.users || [])
        .filter((u: any) => userIds.includes(u.id))
        .map((u: any) => [u.id, u])
    );

    // Fetch profile info (graceful fallback if table missing)
    const { data: profiles } = await supabaseServer
      .from('profiles')
      .select('id, job_title, department')
      .eq('org_id', orgId)
      .in('id', userIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    const users = members.map((m: any) => {
      const authUser = authUserMap.get(m.user_id) || {};
      const p = profileMap.get(m.user_id) || {};
      return {
        membership_id: m.id,
        user_id: m.user_id,
        email: (authUser as any).email || '',
        full_name: (authUser as any).user_metadata?.full_name || (authUser as any).user_metadata?.name || '',
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

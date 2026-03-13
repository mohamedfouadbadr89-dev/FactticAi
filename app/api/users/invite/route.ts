import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { authorize, Role } from '@/lib/rbac';
import { logger } from '@/lib/logger';

/**
 * POST /api/users/invite
 * Invites a new user to the organization.
 * If the user already exists on FactticAI, it adds them to the org.
 * Otherwise, it triggers a Supabase Auth invite.
 */
export const POST = withAuth(async (req: Request, { orgId, userId: currentUserId, role }: AuthContext) => {
  try {
    authorize(role as Role, 'admin');

    const { email, role: newRole } = await req.json();

    if (!email || !email.includes('@')) {
       return NextResponse.json({ error: 'INVALID_EMAIL' }, { status: 400 });
    }

    if (!['admin', 'analyst', 'viewer'].includes(newRole)) {
      return NextResponse.json({ error: 'INVALID_ROLE' }, { status: 400 });
    }

    let targetUserId: string | null = null;
    let isNewUser = false;

    // 1. Check if user already exists in public.users
    const { data: existingUser } = await supabaseServer
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      targetUserId = existingUser.id;
    } else {
      // 2. Trigger Supabase Admin Invite for new users
      const { data: inviteData, error: inviteError } = await supabaseServer.auth.admin.inviteUserByEmail(email);
      
      if (inviteError) {
        // Handle edge case where auth user exists but public.users record is missing
        if (inviteError.message.includes('already been registered')) {
          // Use admin API to find the user by email and sync them
          const { data: listData } = await supabaseServer.auth.admin.listUsers();
          const authUser = listData?.users?.find(u => u.email === email);
          if (authUser) {
            targetUserId = authUser.id;
            // Sync to public.users
            await supabaseServer.from('users').upsert({
              id: authUser.id,
              email,
              full_name: authUser.user_metadata?.full_name ?? email.split('@')[0],
            });
          } else {
            return NextResponse.json({ error: 'USER_EXISTS_IN_AUTH_BUT_NOT_SYNCED' }, { status: 409 });
          }
        } else {
           throw inviteError;
        }
      } else if (inviteData?.user) {
        targetUserId = inviteData.user.id;
        isNewUser = true;
        
        // Ensure mapped to public.users
        await supabaseServer.from('users').upsert({
           id: targetUserId,
           email: email,
           full_name: email.split('@')[0]
        });
      }
    }

    if (!targetUserId) {
       return NextResponse.json({ error: 'INVITE_FAILED' }, { status: 500 });
    }

    // 3. Check existing membership
    const { data: existingMember } = await supabaseServer
       .from('org_members')
       .select('id')
       .eq('org_id', orgId)
       .eq('user_id', targetUserId)
       .single();
       
    if (existingMember) {
       return NextResponse.json({ error: 'USER_ALREADY_IN_ORG' }, { status: 400 });
    }

    // 4. Map to Organization
    const { error: memberError } = await supabaseServer
      .from('org_members')
      .insert({
        user_id: targetUserId,
        org_id: orgId,
        role: newRole
      });

    if (memberError) throw memberError;

    // 5. Initialize base profile if missing
    if (isNewUser) {
       await supabaseServer.from('profiles').insert({
          id: targetUserId,
          org_id: orgId,
          job_title: 'Analyst'
       });
    }

    logger.info('USER_INVITED_TO_ORG', { adminId: currentUserId, email, newRole, orgId });

    return NextResponse.json({ success: true, userId: targetUserId, isNewUser });
  } catch (error: any) {
    logger.error('INVITE_USER_ERROR', { error: error.message });
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
});

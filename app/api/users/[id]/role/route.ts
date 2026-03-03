import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { authorize, Role } from '@/lib/rbac';
import { logger } from '@/lib/logger';

/**
 * PATCH /api/users/[id]/role
 * Updates a user's role within the organization.
 */
export const PATCH = withAuth(async (req: Request, { orgId, userId: currentUserId, role }: AuthContext) => {
  try {
    authorize(role as Role, 'admin');

    // The user to update
    const url = new URL(req.url);
    const targetUserId = url.pathname.split('/')[3];

    if (!targetUserId) {
      return NextResponse.json({ error: 'INVALID_USER_ID' }, { status: 400 });
    }

    const { newRole } = await req.json();

    if (!['admin', 'analyst', 'viewer'].includes(newRole)) {
      return NextResponse.json({ error: 'INVALID_ROLE' }, { status: 400 });
    }

    // Protection: Prevent demoting owners
    const { data: currentTarget, error: fetchError } = await supabaseServer
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', targetUserId)
      .single();

    if (fetchError || !currentTarget) {
      return NextResponse.json({ error: 'USER_NOT_FOUND_IN_ORG' }, { status: 404 });
    }

    if (currentTarget.role === 'owner' && newRole !== 'owner') {
      return NextResponse.json({ error: 'CANNOT_DEMOTE_OWNER' }, { status: 403 });
    }

    // Protection: Admin cannot promote someone to owner or admin if they are not owner themselves?
    // Let's assume admins can promote others to admin, but no one can become owner via this route.
    if (newRole === 'owner') {
        return NextResponse.json({ error: 'CANNOT_ASSIGN_OWNER_ROLE' }, { status: 403 });
    }

    // Perform Update
    const { error: updateError } = await supabaseServer
      .from('org_members')
      .update({ role: newRole })
      .eq('org_id', orgId)
      .eq('user_id', targetUserId);

    if (updateError) throw updateError;

    logger.info('USER_ROLE_UPDATED', { adminId: currentUserId, targetUserId, newRole, orgId });

    return NextResponse.json({ success: true, newRole });
  } catch (error: any) {
    logger.error('UPDATE_USER_ROLE_ERROR', { error: error.message, orgId: req.url });
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
});

/**
 * DELETE /api/users/[id]
 * Removes a user from the organization.
 */
export const DELETE = withAuth(async (req: Request, { orgId, userId: currentUserId, role }: AuthContext) => {
  try {
    authorize(role as Role, 'admin');

    const url = new URL(req.url);
    const targetUserId = url.pathname.split('/')[3];

    if (!targetUserId) {
       return NextResponse.json({ error: 'INVALID_USER_ID' }, { status: 400 });
    }

    // Protection: Prevent removing the owner or themselves
    if (targetUserId === currentUserId) {
        return NextResponse.json({ error: 'CANNOT_REMOVE_SELF' }, { status: 400 });
    }

    const { data: currentTarget, error: fetchError } = await supabaseServer
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', targetUserId)
      .single();

    if (fetchError || !currentTarget) {
      return NextResponse.json({ error: 'USER_NOT_FOUND_IN_ORG' }, { status: 404 });
    }

    if (currentTarget.role === 'owner') {
      return NextResponse.json({ error: 'CANNOT_REMOVE_OWNER' }, { status: 403 });
    }

    const { error: deleteError } = await supabaseServer
      .from('org_members')
      .delete()
      .eq('org_id', orgId)
      .eq('user_id', targetUserId);

    if (deleteError) throw deleteError;

    logger.info('USER_REMOVED_FROM_ORG', { adminId: currentUserId, targetUserId, orgId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('REMOVE_USER_ERROR', { error: error.message });
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
});

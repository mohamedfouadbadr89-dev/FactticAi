import { NextResponse } from 'next/server';
import { createServerAuthClient } from '@/lib/supabaseAuth';
import { supabaseServer } from '@/lib/supabaseServer';
import { logger } from '@/lib/logger';

/**
 * POST /api/setup/sync-user
 * Syncs an authenticated user who exists in Supabase Auth but has no
 * org_members entry (USER_EXISTS_IN_AUTH_BUT_NOT_SYNCED).
 *
 * This route intentionally does NOT use withAuth() because that middleware
 * requires org membership to function — this is the bootstrap route that
 * creates that membership.
 */
export async function POST(req: Request) {
  try {
    const supabaseAuth = await createServerAuthClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }

    const userId = user.id;
    const email = user.email ?? '';

    logger.info('SYNC_USER_INITIATED', { userId, email });

    // 1. Upsert into public.users
    await supabaseServer.from('users').upsert({
      id: userId,
      email,
      full_name: user.user_metadata?.full_name ?? email.split('@')[0],
    });

    // 2. Check if already in org_members (idempotent)
    const { data: existingMember } = await supabaseServer
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (existingMember) {
      return NextResponse.json({ success: true, orgId: existingMember.org_id, synced: false });
    }

    // 3. Create a new organization for this user
    const orgName = user.user_metadata?.org_name
      ?? `${email.split('@')[0]}'s Organization`;
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const { data: org, error: orgError } = await supabaseServer
      .from('organizations')
      .insert({ name: orgName, slug })
      .select('id')
      .single();

    if (orgError || !org) {
      logger.error('SYNC_USER_ORG_CREATE_FAILED', { error: orgError?.message });
      return NextResponse.json({ error: 'ORG_CREATE_FAILED' }, { status: 500 });
    }

    // 4. Add user to org_members as owner
    const { error: memberError } = await supabaseServer
      .from('org_members')
      .insert({ user_id: userId, org_id: org.id, role: 'owner' });

    if (memberError) {
      logger.error('SYNC_USER_MEMBER_INSERT_FAILED', { error: memberError.message });
      return NextResponse.json({ error: 'MEMBER_INSERT_FAILED' }, { status: 500 });
    }

    // 5. Initialize profile
    await supabaseServer.from('profiles').upsert({
      id: userId,
      org_id: org.id,
      job_title: 'Governance Lead',
    });

    logger.info('SYNC_USER_COMPLETE', { userId, orgId: org.id });

    return NextResponse.json({ success: true, orgId: org.id, synced: true });
  } catch (err: any) {
    logger.error('SYNC_USER_FAILURE', { error: err.message });
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

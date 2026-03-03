import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { logger } from '@/lib/logger';

/**
 * Specialized endpoint for secure organization and profile induction.
 * Handles the server-side logic of mapping a new auth user to a fresh
 * or existing organization context.
 */
export async function POST(req: Request) {
  try {
    const { userId, orgName, fullName, email } = await req.json();

    if (!userId || !orgName || !fullName) {
      return NextResponse.json({ error: 'Missing identity segments' }, { status: 400 });
    }

    logger.info('INDUCTING_NEW_GOVERNANCE_IDENTITY', { userId, email, orgName });

    // 1. Create the Organization
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const { data: org, error: orgError } = await supabaseServer
      .from('organizations')
      .insert({ name: orgName, slug })
      .select('id')
      .single();

    if (orgError) {
      logger.error('ORG_CREATION_FAILED', { error: orgError.message });
      throw new Error('Institutional induction failed: Organization namespace conflict.');
    }

    // 2. Map User to public.users (Profile core)
    const { error: userError } = await supabaseServer
      .from('users')
      .insert({ 
        id: userId, 
        email, 
        full_name: fullName 
      });

    if (userError) {
      logger.error('USER_CORE_MAPPING_FAILED', { error: userError.message });
      // Proceeding as user might already exist in public.users if signup retried
    }

    // 3. Create Org Membership (Owner role for creator)
    const { error: memberError } = await supabaseServer
      .from('org_members')
      .insert({
        user_id: userId,
        org_id: org.id,
        role: 'owner'
      });

    if (memberError) {
      logger.error('ORG_MEMBERSHIP_MAPPING_FAILED', { error: memberError.message });
      throw new Error('Access provisioning failed: Permission mapping error.');
    }

    // 4. Initialize Profile
    const { error: profileError } = await supabaseServer
      .from('profiles')
      .insert({
        id: userId,
        org_id: org.id,
        job_title: 'Governance Lead'
      });

    if (profileError) {
       logger.error('PROFILE_INITIALIZATION_FAILED', { error: profileError.message });
    }

    return NextResponse.json({ success: true, orgId: org.id });
  } catch (err: any) {
    logger.error('SIGNUP_PIPELINE_FAILURE', { error: err.message });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

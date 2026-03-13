import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { GdprEraseEngine } from '@/lib/governance/gdprEraseEngine';
import { logger } from '@/lib/logger';

/**
 * GDPR Session Erasure API
 * 
 * CORE PRINCIPLE: Right-to-Erasure. Purge all data linked to a specific session ID.
 */
export async function POST(req: NextRequest) {
  const authResult = await verifyApiKey(req);
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  // Override org_id from the verified API key
  const verifiedOrgId = authResult.org_id;

  try {
    const { session_id } = await req.json();

    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    // 2. Fetch session to get org_id
    const { data: session, error: sessionError } = await supabaseServer
      .from('sessions')
      .select('org_id')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found or inaccessible.' }, { status: 404 });
    }

    const orgId = session.org_id;

    // 3. RBAC: Verify user is admin/owner of the organization
    const { data: orgMember, error: rbacError } = await supabaseServer
      .from('org_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .single();

    if (rbacError || !orgMember || !['admin', 'owner'].includes(orgMember.role)) {
      return NextResponse.json({ error: 'FORBIDDEN: Administrative privileges required.' }, { status: 403 });
    }

    // 4. Trigger Erasure
    const result = await GdprEraseEngine.eraseSession(orgId, session_id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Session erasure initiated and completed successfully.',
      session_id 
    }, { status: 200 });

  } catch (error: any) {
    logger.error('GDPR_API_CRITICAL_FAILURE', { error: error.message });
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { GdprEraseEngine } from '@/lib/governance/gdprEraseEngine';
import { logger } from '@/lib/logger';

/**
 * GDPR Session Erasure API
 * 
 * CORE PRINCIPLE: Right-to-Erasure. Purge all data linked to a specific session ID.
 */
export const POST = withAuth(async (req: Request, { orgId, userId, role }: AuthContext) => {
  try {
    const { session_id } = await req.json();

    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    // 1. RBAC: Verify user is admin/owner of the organization
    if (!['admin', 'owner'].includes(role)) {
      return NextResponse.json({ error: 'FORBIDDEN: Administrative privileges required.' }, { status: 403 });
    }

    // 2. Fetch session to verify it belongs to the user's organization
    const { data: session, error: sessionError } = await supabaseServer
      .from('sessions')
      .select('org_id')
      .eq('id', session_id)
      .eq('org_id', orgId)
      .maybeSingle();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found or inaccessible.' }, { status: 404 });
    }

    // 3. Trigger Erasure
    const result = await GdprEraseEngine.eraseSession(orgId, session_id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // 4. Log the audit event for GDPR compliance
    await supabaseServer.from('gdpr_erasure_requests').insert({
      org_id: orgId,
      data_subject_id: 'internal-user-' + userId,
      request_type: 'erasure',
      status: 'completed',
      completed_at: new Date().toISOString(),
      metadata: { session_id, initiated_by: userId }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Session erasure initiated and completed successfully.',
      session_id 
    }, { status: 200 });

  } catch (error: any) {
    logger.error('GDPR_API_CRITICAL_FAILURE', { error: error.message });
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
});

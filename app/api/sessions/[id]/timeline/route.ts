import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { createServerAuthClient } from '@/lib/supabaseAuth';
import { buildTimeline } from '@/lib/replay/timelineBuilder';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session ID.' }, { status: 400 });
    }

    // Verify the user session using the cookie-aware auth client
    const authClient = await createServerAuthClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RBAC: Resolve the org that owns this session
    // First try the sessions table (source of truth for the incidents page)
    let orgId: string | null = null;

    const { data: sessionRow } = await supabaseServer
      .from('sessions')
      .select('org_id')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionRow?.org_id) {
      orgId = sessionRow.org_id;
    } else {
      // Fall back to governance events ledger
      const { data: eventRow } = await supabaseServer
        .from('facttic_governance_events')
        .select('org_id')
        .eq('session_id', sessionId)
        .limit(1)
        .maybeSingle();
      orgId = eventRow?.org_id ?? null;
    }

    if (!orgId) {
      return NextResponse.json({ error: 'Session not found or forbidden.' }, { status: 404 });
    }

    const { data: orgMember, error: rbacError } = await supabaseServer
      .from('org_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .single();

    if (rbacError || !orgMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Execute Builder Sequence
    const result = await buildTimeline(sessionId);

    if (!result) {
      return NextResponse.json({ error: 'timeline_failed' }, { status: 500 });
    }

    const { timeline, riskPeaks, policyTriggers } = result;

    return NextResponse.json({ timeline, riskPeaks, policyTriggers }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: 'timeline_failed' }, { status: 500 });
  }
}

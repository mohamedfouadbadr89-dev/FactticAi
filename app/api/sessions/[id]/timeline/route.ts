import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { TimelineBuilder } from '@/lib/replay/timelineBuilder';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session ID.' }, { status: 400 });
    }

    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RBAC: Verify user owns the org associated with this session
    const { data: sessionData, error: sessionError } = await supabaseServer
      .from('sessions')
      .select('org_id')
      .eq('id', sessionId)
      .single();
      
    if (sessionError || !sessionData) {
      return NextResponse.json({ error: 'Session not found or forbidden.' }, { status: 404 });
    }

    const { data: orgMember, error: rbacError } = await supabaseServer
      .from('org_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('org_id', sessionData.org_id)
      .single();

    if (rbacError || !orgMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Execute Builder Sequence 
    const timeline = await TimelineBuilder.reconstructSession(sessionId, sessionData.org_id);

    return NextResponse.json({ timeline }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

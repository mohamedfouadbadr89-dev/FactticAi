import { NextRequest, NextResponse } from 'next/server';
import { createServerAuthClient } from '@/lib/supabaseAuth';
import { resolveOrgContext } from '@/lib/orgResolver';
import { logger } from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Awaiting params for Next.js 15+
) {
  try {
    const { id } = await params;
    const supabase = await createServerAuthClient();

    // 1. Auth check
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Resolve Org Context
    const ctx = await resolveOrgContext(session.user.id);
    const orgId = ctx.org_id;

    // 3. Fetch Session + Turns (RLS enforced)
    // We fetch turns ordered by turn_index to ensure timeline consistency
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        turns:session_turns(*)
      `)
      .eq('id', id)
      .eq('org_id', orgId) // Extra safety check even with RLS
      .order('turn_index', { foreignTable: 'session_turns', ascending: true })
      .single();

    if (sessionError || !sessionData) {
      logger.error('SESSION_FETCH_FAILED', { id, orgId, error: sessionError?.message });
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: sessionData 
    });

  } catch (error: any) {
    logger.error('SESSION_API_CRITICAL_FAILURE', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';

/**
 * GET /api/agents/sessions
 * Retrieve all managed agent sessions for the current organization.
 */
export const GET = withAuth(async (req: Request, context: AuthContext) => {
  try {
    const { data: sessions, error } = await (req as any).supabase
      ? await (req as any).supabase.from('agent_sessions').select('*').eq('org_id', context.orgId).order('started_at', { ascending: false })
      : await (await import('@/lib/supabaseServer')).supabaseServer.from('agent_sessions').select('*').eq('org_id', context.orgId).order('started_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(sessions);
    
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

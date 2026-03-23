import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * API: /api/agents
 */
export const GET = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const TIMEOUT_MS = 3000;
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_MS));

    const [result] = await Promise.allSettled([
      Promise.race([
        supabaseServer
          .from('agents')
          .select('id, org_id, name, type, version, is_active, created_at')
          .eq('org_id', orgId)
          .order('created_at', { ascending: false }),
        timeout
      ])
    ]);

    const agentsData = result.status === 'fulfilled' ? (result.value as any).data : [];
    const hasError = result.status === 'rejected' || (result.status === 'fulfilled' && (result.value as any).error);

    return NextResponse.json({ 
        agents: agentsData || [],
        partial_failure: hasError ? true : false
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: error.message, agents: [] },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const body = await req.json();
    const { name, type, version, prompt_snapshot, config_snapshot, is_active } = body;

    if (!name || !type || !version || !prompt_snapshot || !config_snapshot) {
      return NextResponse.json(
        { error: "Missing required fields: name, type, version, prompt_snapshot, config_snapshot" },
        { status: 400 }
      );
    }

    const { data: agentId, error } = await supabaseServer.rpc('create_agent', {
      p_org_id: orgId,
      p_name: name,
      p_type: type,
      p_version: version,
      p_prompt_snapshot: prompt_snapshot,
      p_config_snapshot: config_snapshot,
      p_is_active: is_active ?? true
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      agent_id: agentId,
      message: "AGENT CREATED SUCCESSFULLY VIA RPC"
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Agent creation failed' },
      { status: 500 }
    );
  }
});

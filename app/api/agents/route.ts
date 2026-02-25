import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/authGuard';
import { resolveOrgContext } from '@/lib/orgResolver';
import { supabaseServer } from '@/lib/supabaseServer';
import { createAuthenticatedClient } from '@/lib/supabaseClient';
import { extractToken } from '@/core/auth';

/**
 * API: /api/agents
 */
export async function GET(req: Request) {
  try {
    const auth = await withAuth(req);

    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    // Extract raw JWT to build user-scoped client bound by RLS
    const token = extractToken(req);
    const supabaseUserClient = createAuthenticatedClient(token!);
    
    // RLS Drift Control: We do NOT append .eq('org_id') here.
    // The Postgres RLS policy automatically filters based on auth.uid()
    const { data: agents, error } = await supabaseUserClient
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ agents });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await withAuth(req);

    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    const { org_id } = await resolveOrgContext(auth.user.id);
    const body = await req.json();
    const { name, type, version, prompt_snapshot, config_snapshot, is_active } = body;

    // Validate required fields
    if (!name || !type || !version || !prompt_snapshot || !config_snapshot) {
      return NextResponse.json(
        { error: "Missing required fields: name, type, version, prompt_snapshot, config_snapshot" },
        { status: 400 }
      );
    }

    // Call RPC as per brief: POST /api/agents → call RPC only.
    const { data: agentId, error } = await supabaseServer.rpc('create_agent', {
      p_org_id: org_id,
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
}

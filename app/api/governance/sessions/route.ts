import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { resolveOrgContext } from '@/lib/orgResolver';

/**
 * GET /api/governance/sessions
 *
 * Returns distinct sessions from the evidence ledger.
 */
export async function GET(req: Request) {
  try {
    let orgId: string | null = null;
    try {
      const orgContext = await resolveOrgContext('user-1234');
      orgId = orgContext.org_id;
    } catch {
      const { data: fallback } = await supabaseServer
        .from('org_members')
        .select('org_id')
        .limit(1)
        .single();
      orgId = fallback?.org_id || null;
    }

    if (!orgId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 403 });
    }

    // Query the persisted sessions table directly
    const { data, error } = await supabaseServer
      .from('sessions')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ sessions: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

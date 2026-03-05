import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { logger } from '@/lib/logger';

/**
 * Governance Event Ledger API
 * 
 * Fetches tamper-proof audit trail for an organization.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('org_id');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!orgId) {
      return NextResponse.json({ error: 'Missing org_id context' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('governance_event_ledger')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('LEDGER_API_FETCH_FAILED', { error: error.message, orgId });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ events: data }, { status: 200 });

  } catch (err: any) {
    logger.error('LEDGER_API_FAILURE', { error: err.message });
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}

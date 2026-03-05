import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { logger } from '@/lib/logger';

/**
 * Compliance Signals API
 * 
 * Fetches recent PII detection events and compliance risk assessments.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('org_id');
    const dateStart = searchParams.get('date_start');
    const dateEnd = searchParams.get('date_end');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!orgId) {
      return NextResponse.json({ error: 'Missing org_id context' }, { status: 400 });
    }

    let query = supabaseServer
      .from('compliance_signals')
      .select('*')
      .eq('org_id', orgId);

    if (dateStart) query = query.gte('created_at', dateStart);
    if (dateEnd) query = query.lte('created_at', dateEnd);

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('COMPLIANCE_API_FETCH_FAILED', { error: error.message, orgId });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ signals: data }, { status: 200 });

  } catch (err: any) {
    logger.error('COMPLIANCE_API_FAILURE', { error: err.message });
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * Aggregated Usage API
 * 
 * CORE PRINCIPLE: Unit-Based Consumption Transparency.
 * Fetches interactions, tokens, risk evaluations, and alerts.
 */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const org_id = searchParams.get('org_id');

    if (!org_id) {
      return NextResponse.json({ error: 'Missing org_id' }, { status: 400 });
    }

    // 1. Interactions (chat_session billing events)
    const { count: interactionsCount, error: interactionError } = await supabaseServer
      .from('billing_events')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org_id)
      .eq('type', 'chat_session');

    // 2. Tokens (sum of token_usage from cost_metrics)
    const { data: costData, error: costError } = await supabaseServer
      .from('cost_metrics')
      .select('token_usage')
      .eq('org_id', org_id);

    const totalTokens = (costData || []).reduce((sum, curr) => sum + Number(curr.token_usage), 0);

    // 3. Risk Evaluations (count governance_event_ledger)
    const { count: evalCount, error: evalError } = await supabaseServer
      .from('governance_event_ledger')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org_id);

    // 4. Alerts (count alert_triggered in ledger)
    const { count: alertCount, error: alertError } = await supabaseServer
      .from('governance_event_ledger')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org_id)
      .eq('alert_triggered', true);

    if (interactionError || costError || evalError || alertError) {
      throw (interactionError || costError || evalError || alertError);
    }

    return NextResponse.json({
      interactions: interactionsCount || 0,
      tokens: totalTokens,
      evaluations: evalCount || 0,
      alerts: alertCount || 0,
      period: "Current Billing Cycle"
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

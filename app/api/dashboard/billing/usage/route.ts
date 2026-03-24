import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * Aggregated Usage API
 * 
 * CORE PRINCIPLE: Unit-Based Consumption Transparency.
 * Fetches interactions, tokens, risk evaluations, and alerts.
 */

export const GET = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    // 1. Interactions (chat_session billing events)
    const { count: interactionsCount, error: interactionError } = await supabaseServer
      .from('billing_events')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('type', 'chat_session');

    // 2. Tokens (sum of token_usage from cost_metrics)
    const { data: costData, error: costError } = await supabaseServer
      .from('cost_metrics')
      .select('token_usage')
      .eq('org_id', orgId);

    const totalTokens = (costData || []).reduce((sum, curr) => sum + Number(curr.token_usage), 0);

    // 3. Risk Evaluations (count facttic_governance_events)
    const { count: evalCount, error: evalError } = await supabaseServer
      .from('facttic_governance_events')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    // 4. Alerts (count alert_triggered in facttic_governance_events)
    const { count: alertCount, error: alertError } = await supabaseServer
      .from('facttic_governance_events')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
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
});


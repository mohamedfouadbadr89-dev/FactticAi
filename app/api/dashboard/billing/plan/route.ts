import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { getAllTiers } from '@/config/pricing';

/**
 * Plan Management API
 * Returns the current plan + tier metadata for the authenticated org.
 */
export const GET = withAuth(async (_req: Request, { orgId }: AuthContext) => {
  try {
    const { data: summary, error } = await supabaseServer
      .from('billing_summaries')
      .select('eu_limit, total_eu_consumed, last_reset_at')
      .eq('org_id', orgId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    const limit    = summary?.eu_limit          || 200_000;  // Default to Scale tier for demo
    const consumed = summary?.total_eu_consumed  || 0;

    // Infer tier from EU limit thresholds
    let tier: 'starter' | 'growth' | 'scale' = 'starter';
    if (limit >= 200_000) tier = 'scale';
    else if (limit >= 50_000) tier = 'growth';

    // Human-readable tier names for display
    const DISPLAY_NAME: Record<typeof tier, string> = {
      starter: 'Starter',
      growth:  'Growth',
      scale:   'Scale',
    };

    const nextBillingDate = summary?.last_reset_at
      ? new Date(
          new Date(summary.last_reset_at).setMonth(
            new Date(summary.last_reset_at).getMonth() + 1
          )
        ).toISOString()
      : new Date().toISOString();

    return NextResponse.json({
      plan: {
        tier,
        name:             DISPLAY_NAME[tier],
        limit,
        consumed,
        usage_percentage: limit > 0 ? Math.round((consumed / limit) * 100) : 0,
        currency:         'USD',
        next_billing_date: nextBillingDate,
      },
      tiers: getAllTiers().map(t => ({
        id:    t.id,
        name:  `${t.planName} (${(t.interactions / 1000)}k)`,
        limit: t.interactions,
        price: t.price,
      })),
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

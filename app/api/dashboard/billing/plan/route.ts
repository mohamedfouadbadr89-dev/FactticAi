import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { pricingConfig, getAllTiers } from '@/config/pricing';

/**
 * Plan Management API
 * 
 * CORE PRINCIPLE: Predictive Tiering.
 * Fetches current plan details and usage thresholds.
 */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const org_id = searchParams.get('org_id');

    if (!org_id) {
      return NextResponse.json({ error: 'Missing org_id' }, { status: 400 });
    }

    const { data: summary, error } = await supabaseServer
      .from('billing_summaries')
      .select('*')
      .eq('org_id', org_id)
      .single();

    if (error && error.code !== 'PGRST116') { // Ignore "no rows returned" for fallback
       throw error;
    }

    // Default to Starter if no record
    const limit = summary?.eu_limit || 10000;
    const consumed = summary?.total_eu_consumed || 0;

    let tierName = "Starter";
    if (limit >= 200000) tierName = "Scale";
    else if (limit >= 50000) tierName = "Growth";

    return NextResponse.json({
      plan: {
        name: tierName,
        limit: limit,
        consumed: consumed,
        usage_percentage: limit > 0 ? (consumed / limit) * 100 : 0,
        currency: "USD",
        next_billing_date: summary?.last_reset_at ? new Date(new Date(summary.last_reset_at).setMonth(new Date(summary.last_reset_at).getMonth() + 1)).toISOString() : new Date().toISOString()
      },
      tiers: getAllTiers().map(t => ({
        id: t.id,
        name: `${t.planName} (${(t.interactions / 1000)}k)`,
        limit: t.interactions,
        price: t.price
      }))
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

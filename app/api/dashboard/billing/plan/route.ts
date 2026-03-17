import { NextResponse } from 'next/server'
import { withAuth, AuthContext } from '@/lib/middleware/auth'
import { supabaseServer } from '@/lib/supabaseServer'
import { getAllTiers } from '@/config/pricing'

/**
 * GET /api/dashboard/billing/plan
 *
 * Returns the current org's subscription plan and usage data.
 * org_id is resolved from the session — no query param required.
 */
export const GET = withAuth(async (_req: Request, { orgId }: AuthContext) => {
  try {
    // ── 1. Subscription record ─────────────────────────────────────────────────
    const { data: sub } = await supabaseServer
      .from('subscriptions')
      .select('plan_id, status, billing_cycle, current_period_start, current_period_end, trial_ends_at')
      .eq('org_id', orgId)
      .maybeSingle()

    // ── 2. Plan details from plans table ──────────────────────────────────────
    const planId = sub?.plan_id ?? 'starter'

    const { data: plan } = await supabaseServer
      .from('plans')
      .select('id, name, monthly_price_cents, interaction_limit, features')
      .eq('id', planId)
      .maybeSingle()

    // ── 3. Usage from billing_summaries (EU model) ─────────────────────────────
    const { data: summary } = await supabaseServer
      .from('billing_summaries')
      .select('total_eu_consumed, eu_limit, last_reset_at')
      .eq('org_id', orgId)
      .maybeSingle()

    const limit    = summary?.eu_limit ?? plan?.interaction_limit ?? 10000
    const consumed = summary?.total_eu_consumed ?? 0

    // Tier name: prefer plans table, fall back to EU limit heuristic
    let tierName = plan?.name ?? 'Starter'
    if (!plan) {
      if (limit >= 200000) tierName = 'Scale'
      else if (limit >= 50000) tierName = 'Growth'
      else tierName = 'Starter'
    }

    const next_billing_date = sub?.current_period_end
      ?? (summary?.last_reset_at
        ? new Date(new Date(summary.last_reset_at).setMonth(new Date(summary.last_reset_at).getMonth() + 1)).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      )

    return NextResponse.json({
      plan: {
        id:                  planId,
        name:                tierName,
        status:              sub?.status ?? 'trialing',
        billing_cycle:       sub?.billing_cycle ?? 'monthly',
        monthly_price_cents: plan?.monthly_price_cents ?? 3900,
        limit,
        consumed,
        usage_percentage:    limit > 0 ? Math.round((consumed / limit) * 1000) / 10 : 0,
        next_billing_date,
        features:            plan?.features ?? [],
      },
      tiers: getAllTiers().map(t => ({
        id:    t.id,
        name:  `${t.planName} (${t.interactions / 1000}k)`,
        limit: t.interactions,
        price: t.price,
      }))
    })
  } catch (err: any) {
    console.error('[Billing Plan]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})

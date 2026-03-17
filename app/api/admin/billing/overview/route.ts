import { NextResponse } from 'next/server'
import { withAuth, AuthContext } from '@/lib/middleware/auth'
import { supabaseServer } from '@/lib/supabaseServer'
import { authorize, Role } from '@/lib/rbac'

/**
 * GET /api/admin/billing/overview
 *
 * Super-admin endpoint — returns platform-wide billing intelligence:
 * total subscribers, MRR, churn, plan distribution, recent events.
 *
 * Requires: role = 'owner' or 'admin' (enforced by RBAC).
 * Note: No payment provider connected yet — all data from subscriptions table.
 */
export const GET = withAuth(async (_req: Request, { role }: AuthContext) => {
  try {
    authorize(role as Role, 'admin')

    const now       = new Date()
    const thirtyAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // ── Run all queries in parallel ──────────────────────────────────────────

    const [
      subscribersRes,
      planDistRes,
      churnRes,
      newThisMonthRes,
      recentEventsRes,
      revenueRes,
    ] = await Promise.allSettled([

      // All subscriptions with plan info
      supabaseServer
        .from('admin_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false }),

      // Plan distribution counts
      supabaseServer
        .from('subscriptions')
        .select('plan_id, status')
        .in('status', ['active', 'trialing']),

      // Churned in last 30 days
      supabaseServer
        .from('subscriptions')
        .select('id, org_id, plan_id, cancelled_at')
        .eq('status', 'cancelled')
        .gte('cancelled_at', thirtyAgo),

      // New subscriptions this calendar month
      supabaseServer
        .from('subscriptions')
        .select('id')
        .gte('created_at', startOfMonth),

      // Recent subscription events (last 20)
      supabaseServer
        .from('subscription_events')
        .select('id, org_id, event_type, from_plan_id, to_plan_id, from_status, to_status, amount_cents, created_at')
        .order('created_at', { ascending: false })
        .limit(20),

      // MRR from admin view
      supabaseServer
        .from('admin_subscribers')
        .select('mrr_cents')
        .in('status', ['active', 'trialing']),
    ])

    // ── Unwrap results ───────────────────────────────────────────────────────

    const subscribers = subscribersRes.status === 'fulfilled'
      ? (subscribersRes.value.data ?? [])
      : []

    const activeSubscriptions = planDistRes.status === 'fulfilled'
      ? (planDistRes.value.data ?? [])
      : []

    const churned = churnRes.status === 'fulfilled'
      ? (churnRes.value.data ?? [])
      : []

    const newThisMonth = newThisMonthRes.status === 'fulfilled'
      ? (newThisMonthRes.value.data ?? []).length
      : 0

    const recentEvents = recentEventsRes.status === 'fulfilled'
      ? (recentEventsRes.value.data ?? [])
      : []

    const mrrRows = revenueRes.status === 'fulfilled'
      ? (revenueRes.value.data ?? [])
      : []

    // ── Compute KPIs ─────────────────────────────────────────────────────────

    const totalActive   = activeSubscriptions.length
    const totalChurn    = churned.length

    const mrrCents      = mrrRows.reduce((sum: number, r: any) => sum + (r.mrr_cents ?? 0), 0)
    const mrrDollars    = Math.round(mrrCents / 100)
    const arrDollars    = mrrDollars * 12

    // Churn rate = churned last 30d / (active + churned last 30d)
    const churnRate     = totalActive + totalChurn > 0
      ? Math.round((totalChurn / (totalActive + totalChurn)) * 10000) / 100
      : 0

    // Plan distribution
    const planCounts: Record<string, number> = {}
    for (const s of activeSubscriptions) {
      planCounts[s.plan_id] = (planCounts[s.plan_id] ?? 0) + 1
    }

    // Status breakdown (all subscriptions)
    const statusCounts: Record<string, number> = {}
    for (const s of subscribers) {
      statusCounts[s.status] = (statusCounts[s.status] ?? 0) + 1
    }

    return NextResponse.json({
      computed_at: now.toISOString(),
      kpis: {
        total_subscribers:   totalActive,
        mrr_dollars:         mrrDollars,
        arr_dollars:         arrDollars,
        churn_rate_30d:      churnRate,
        new_this_month:      newThisMonth,
        churned_last_30d:    totalChurn,
        total_all_time:      subscribers.length,
      },
      plan_distribution:   planCounts,
      status_breakdown:    statusCounts,
      subscribers,
      recent_events:       recentEvents,
    })

  } catch (err: any) {
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    console.error('[Admin Billing Overview]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})

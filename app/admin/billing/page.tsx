'use client'

import React, { useState, useEffect } from 'react'
import {
  DollarSign, Users, TrendingDown, TrendingUp,
  RefreshCw, ChevronDown, ChevronUp, CreditCard,
  AlertCircle, CheckCircle, Clock, XCircle, PauseCircle,
  BarChart3, Calendar, ArrowUpRight,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface KPIs {
  total_subscribers:  number
  mrr_dollars:        number
  arr_dollars:        number
  churn_rate_30d:     number
  new_this_month:     number
  churned_last_30d:   number
  total_all_time:     number
}

interface Subscriber {
  subscription_id:       string
  org_id:                string
  plan_id:               string
  plan_name:             string
  monthly_price_cents:   number
  billing_cycle:         string
  status:                string
  subscribed_at:         string
  current_period_end:    string
  cancelled_at:          string | null
  stripe_subscription_id: string | null
  mrr_cents:             number
}

interface RecentEvent {
  id:            string
  event_type:    string
  from_plan_id:  string | null
  to_plan_id:    string | null
  amount_cents:  number | null
  created_at:    string
}

interface Overview {
  computed_at:        string
  kpis:               KPIs
  plan_distribution:  Record<string, number>
  status_breakdown:   Record<string, number>
  subscribers:        Subscriber[]
  recent_events:      RecentEvent[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active:   { label: 'Active',    color: '#10b981', icon: <CheckCircle className="w-3 h-3" /> },
  trialing: { label: 'Trial',     color: '#f59e0b', icon: <Clock       className="w-3 h-3" /> },
  past_due: { label: 'Past Due',  color: '#ef4444', icon: <AlertCircle className="w-3 h-3" /> },
  cancelled:{ label: 'Cancelled', color: '#6b7280', icon: <XCircle     className="w-3 h-3" /> },
  paused:   { label: 'Paused',    color: '#8b5cf6', icon: <PauseCircle className="w-3 h-3" /> },
}

const PLAN_COLOR: Record<string, string> = {
  starter: '#3b82f6',
  growth:  '#8b5cf6',
  scale:   '#10b981',
}

const fmt = {
  usd:  (n: number) => `$${n.toLocaleString()}`,
  pct:  (n: number) => `${n.toFixed(1)}%`,
  date: (s: string) => s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function AdminBillingPage() {
  const [data, setData]       = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState<string>('all')
  const [sort, setSort]       = useState<{ key: keyof Subscriber; dir: 1 | -1 }>({
    key: 'subscribed_at', dir: -1
  })

  const load = () => {
    setLoading(true)
    setError(null)
    fetch('/api/admin/billing/overview')
      .then(r => r.json())
      .then(json => {
        if (json.error) throw new Error(json.error)
        setData(json)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // ── Filtered / sorted table rows ────────────────────────────────────────────

  const rows = (data?.subscribers ?? [])
    .filter(s => {
      const matchFilter = filter === 'all' || s.status === filter
      const matchSearch = !search || s.org_id.includes(search) || s.plan_name.toLowerCase().includes(search.toLowerCase())
      return matchFilter && matchSearch
    })
    .sort((a, b) => {
      const av = a[sort.key] ?? ''
      const bv = b[sort.key] ?? ''
      return av < bv ? -sort.dir : av > bv ? sort.dir : 0
    })

  const toggleSort = (key: keyof Subscriber) =>
    setSort(prev => prev.key === key ? { key, dir: (prev.dir * -1) as 1 | -1 } : { key, dir: -1 })

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
      <RefreshCw className="w-8 h-8 animate-spin text-[var(--accent)]" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col items-center justify-center gap-4 text-[var(--text-secondary)]">
      <AlertCircle className="w-10 h-10 text-red-500" />
      <p className="text-sm font-bold">{error}</p>
      <button onClick={load} className="px-4 py-2 text-xs font-black uppercase tracking-widest border border-[var(--border-primary)] rounded-lg hover:border-[var(--accent)]">
        Retry
      </button>
    </div>
  )

  const kpis = data!.kpis
  const dist = data!.plan_distribution

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] p-8 space-y-10">

      {/* ── Header ── */}
      <header className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-[var(--accent)] mb-2">
            <CreditCard className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Platform Admin</span>
          </div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">Billing Intelligence</h1>
          <p className="text-[11px] font-mono text-[var(--text-secondary)] mt-1">
            Last computed: {fmt.date(data!.computed_at)}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 border border-[var(--border-primary)] rounded-xl text-xs font-black uppercase tracking-widest hover:border-[var(--accent)] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </header>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Active Subscribers',
            value: kpis.total_subscribers.toString(),
            sub:   `${kpis.new_this_month} new this month`,
            icon:  <Users className="w-5 h-5" />,
            color: '#10b981',
            trend: <TrendingUp className="w-3 h-3" />,
          },
          {
            label: 'MRR',
            value: fmt.usd(kpis.mrr_dollars),
            sub:   `ARR ${fmt.usd(kpis.arr_dollars)}`,
            icon:  <DollarSign className="w-5 h-5" />,
            color: '#3b82f6',
            trend: <ArrowUpRight className="w-3 h-3" />,
          },
          {
            label: 'Churn Rate (30d)',
            value: fmt.pct(kpis.churn_rate_30d),
            sub:   `${kpis.churned_last_30d} cancelled`,
            icon:  <TrendingDown className="w-5 h-5" />,
            color: kpis.churn_rate_30d > 5 ? '#ef4444' : '#f59e0b',
            trend: null,
          },
          {
            label: 'All Time',
            value: kpis.total_all_time.toString(),
            sub:   'Total orgs ever',
            icon:  <BarChart3 className="w-5 h-5" />,
            color: '#8b5cf6',
            trend: null,
          },
        ].map(card => (
          <div
            key={card.label}
            className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span style={{ color: card.color }}>{card.icon}</span>
              {card.trend && <span style={{ color: card.color }} className="flex items-center gap-1 text-[9px] font-black uppercase">{card.trend}</span>}
            </div>
            <div>
              <p className="text-2xl font-black tracking-tighter" style={{ color: card.color }}>{card.value}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] mt-0.5">{card.label}</p>
              <p className="text-[9px] font-mono text-[var(--text-secondary)] opacity-60 mt-1">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Plan Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {['starter', 'growth', 'scale'].map(planId => {
          const count = dist[planId] ?? 0
          const total = kpis.total_subscribers || 1
          const pct   = Math.round((count / total) * 100)
          return (
            <div
              key={planId}
              className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: PLAN_COLOR[planId] }}>
                  {planId.charAt(0).toUpperCase() + planId.slice(1)}
                </span>
                <span className="text-xs font-black text-[var(--text-primary)]">{count} orgs</span>
              </div>
              <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: PLAN_COLOR[planId] }}
                />
              </div>
              <p className="text-[9px] font-mono text-[var(--text-secondary)]">{pct}% of active subscribers</p>
            </div>
          )
        })}
      </div>

      {/* ── Subscribers Table ── */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">

        {/* Table header */}
        <div className="px-6 py-4 border-b border-[var(--border-primary)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h2 className="text-xs font-black uppercase tracking-widest">All Subscribers</h2>
          <div className="flex items-center gap-3">
            {/* Status filter */}
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-1.5 text-[10px] font-mono text-[var(--text-secondary)] focus:outline-none"
            >
              <option value="all">All Status</option>
              {Object.keys(STATUS_META).map(s => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </select>
            {/* Search */}
            <input
              type="text"
              placeholder="Search org / plan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-1.5 text-[10px] font-mono text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] w-48"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b border-[var(--border-primary)]">
                {([
                  ['org_id',            'Org ID'],
                  ['plan_name',         'Plan'],
                  ['billing_cycle',     'Cycle'],
                  ['status',            'Status'],
                  ['mrr_cents',         'MRR'],
                  ['subscribed_at',     'Since'],
                  ['current_period_end','Renews'],
                ] as [keyof Subscriber, string][]).map(([key, label]) => (
                  <th
                    key={key}
                    onClick={() => toggleSort(key)}
                    className="text-left px-6 py-3 text-[9px] uppercase tracking-widest text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] select-none"
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      {sort.key === key && (sort.dir === 1
                        ? <ChevronUp className="w-3 h-3" />
                        : <ChevronDown className="w-3 h-3" />
                      )}
                    </span>
                  </th>
                ))}
                <th className="px-6 py-3 text-[9px] uppercase tracking-widest text-[var(--text-secondary)]">Provider</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[var(--text-secondary)] opacity-50">
                    No subscribers found
                  </td>
                </tr>
              )}
              {rows.map(s => {
                const sm = STATUS_META[s.status] ?? STATUS_META['active']
                return (
                  <tr
                    key={s.subscription_id}
                    className="border-b border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <td className="px-6 py-4 text-[var(--text-secondary)] font-mono">
                      {s.org_id.slice(0, 8)}…
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="font-black uppercase text-[9px] tracking-widest px-2 py-0.5 rounded-full"
                        style={{ color: PLAN_COLOR[s.plan_id], background: `${PLAN_COLOR[s.plan_id]}18` }}
                      >
                        {s.plan_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)] capitalize">{s.billing_cycle}</td>
                    <td className="px-6 py-4">
                      <span
                        className="flex items-center gap-1 font-black uppercase text-[9px] tracking-widest w-fit px-2 py-0.5 rounded-full"
                        style={{ color: sm.color, background: `${sm.color}18` }}
                      >
                        {sm.icon} {sm.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-[var(--text-primary)]">
                      {s.mrr_cents > 0 ? `$${Math.round(s.mrr_cents / 100)}/mo` : <span className="opacity-30">—</span>}
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {fmt.date(s.subscribed_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">{fmt.date(s.current_period_end)}</td>
                    <td className="px-6 py-4">
                      {s.stripe_subscription_id
                        ? <span className="text-[#10b981] font-black text-[9px]">Stripe ✓</span>
                        : <span className="opacity-30 text-[9px]">Manual</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-[var(--border-primary)] flex items-center justify-between">
          <p className="text-[9px] font-mono text-[var(--text-secondary)]">
            Showing {rows.length} of {data!.subscribers.length} records
          </p>
          <p className="text-[9px] font-mono text-[var(--text-secondary)] opacity-50">
            Payment provider not connected — ready for Stripe/Paddle
          </p>
        </div>
      </div>

      {/* ── Recent Events ── */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-primary)]">
          <h2 className="text-xs font-black uppercase tracking-widest">Recent Subscription Events</h2>
        </div>
        <div className="divide-y divide-[var(--border-primary)]">
          {data!.recent_events.length === 0 && (
            <div className="px-6 py-8 text-center text-[var(--text-secondary)] text-[10px] opacity-50">
              No events recorded yet
            </div>
          )}
          {data!.recent_events.map(ev => (
            <div key={ev.id} className="px-6 py-3 flex items-center justify-between hover:bg-[var(--bg-secondary)] transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">
                  {ev.event_type.replace(/_/g, ' ')}
                </span>
                {ev.from_plan_id && ev.to_plan_id && (
                  <span className="text-[9px] font-mono text-[var(--text-secondary)]">
                    {ev.from_plan_id} → {ev.to_plan_id}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                {ev.amount_cents && (
                  <span className="text-[10px] font-black text-[var(--accent)]">${Math.round(ev.amount_cents / 100)}</span>
                )}
                <span className="text-[9px] font-mono text-[var(--text-secondary)]">{fmt.date(ev.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

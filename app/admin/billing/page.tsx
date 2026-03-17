'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  DollarSign, Users, TrendingDown, TrendingUp, RefreshCw,
  ChevronDown, ChevronUp, CreditCard, AlertCircle, CheckCircle,
  Clock, XCircle, PauseCircle, BarChart3, Calendar, ArrowUpRight,
  Download, Search, Filter, Sun, Moon, Activity, Zap,
  ChevronLeft, ChevronRight,
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
  subscription_id:        string
  org_id:                 string
  plan_id:                string
  plan_name:              string
  monthly_price_cents:    number
  billing_cycle:          string
  status:                 string
  subscribed_at:          string
  current_period_end:     string
  cancelled_at:           string | null
  stripe_subscription_id: string | null
  mrr_cents:              number
}

interface RecentEvent {
  id:           string
  event_type:   string
  from_plan_id: string | null
  to_plan_id:   string | null
  amount_cents: number | null
  created_at:   string
}

interface Overview {
  computed_at:       string
  kpis:              KPIs
  plan_distribution: Record<string, number>
  status_breakdown:  Record<string, number>
  subscribers:       Subscriber[]
  recent_events:     RecentEvent[]
}

type SortKey = keyof Subscriber
type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all'

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  active:    { label: 'Active',    color: '#10b981', bg: '#10b98118', icon: <CheckCircle className="w-3 h-3" /> },
  trialing:  { label: 'Trial',     color: '#f59e0b', bg: '#f59e0b18', icon: <Clock       className="w-3 h-3" /> },
  past_due:  { label: 'Past Due',  color: '#ef4444', bg: '#ef444418', icon: <AlertCircle className="w-3 h-3" /> },
  cancelled: { label: 'Cancelled', color: '#6b7280', bg: '#6b728018', icon: <XCircle     className="w-3 h-3" /> },
  paused:    { label: 'Paused',    color: '#8b5cf6', bg: '#8b5cf618', icon: <PauseCircle className="w-3 h-3" /> },
}

const PLAN_META: Record<string, { color: string; bg: string; label: string; price: string }> = {
  starter: { color: '#3b82f6', bg: '#3b82f618', label: 'Starter', price: '$39' },
  growth:  { color: '#8b5cf6', bg: '#8b5cf618', label: 'Growth',  price: '$129' },
  scale:   { color: '#10b981', bg: '#10b98118', label: 'Scale',   price: '$349' },
}

const TIME_RANGES: { key: TimeRange; label: string; days: number }[] = [
  { key: '7d',  label: '7D',   days: 7   },
  { key: '30d', label: '30D',  days: 30  },
  { key: '90d', label: '90D',  days: 90  },
  { key: '1y',  label: '1Y',   days: 365 },
  { key: 'all', label: 'All',  days: 0   },
]

const PAGE_SIZE = 10

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmt = {
  usd:  (n: number) => `$${n.toLocaleString()}`,
  pct:  (n: number) => `${n.toFixed(1)}%`,
  date: (s: string | null) =>
    s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
  dateShort: (s: string | null) =>
    s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—',
}

function exportCSV(rows: Subscriber[]) {
  const headers = ['Org ID','Plan','Cycle','Status','MRR','Subscribed','Renews','Provider']
  const lines = rows.map(s => [
    s.org_id,
    s.plan_name,
    s.billing_cycle,
    s.status,
    s.mrr_cents > 0 ? `$${Math.round(s.mrr_cents / 100)}` : '0',
    fmt.date(s.subscribed_at),
    fmt.date(s.current_period_end),
    s.stripe_subscription_id ? 'Stripe' : 'Manual',
  ].join(','))
  const csv = [headers.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `facttic-subscribers-${new Date().toISOString().slice(0,10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

// ── Sparkline bar ─────────────────────────────────────────────────────────────

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${color}20` }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[9px] font-mono w-6 text-right" style={{ color }}>{pct}%</span>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function KPICard({
  label, value, sub, icon, color, trend, trendLabel,
}: {
  label: string; value: string; sub: string
  icon: React.ReactNode; color: string
  trend?: 'up' | 'down' | null; trendLabel?: string
}) {
  return (
    <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl p-5 flex flex-col gap-4 group hover:border-[color:var(--border-subtle)] transition-all">
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, color }}>
          {icon}
        </div>
        {trend && (
          <div
            className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ color: trend === 'up' ? '#10b981' : '#ef4444', background: trend === 'up' ? '#10b98115' : '#ef444415' }}
          >
            {trend === 'up' ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
            {trendLabel}
          </div>
        )}
      </div>
      <div>
        <p className="text-[22px] font-black tracking-tighter leading-none" style={{ color }}>{value}</p>
        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] mt-1">{label}</p>
        <p className="text-[9px] font-mono text-[var(--text-secondary)] opacity-50 mt-0.5">{sub}</p>
      </div>
    </div>
  )
}

// ── Theme toggle ──────────────────────────────────────────────────────────────

function ThemeToggle() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const root = document.documentElement
    const isDark = root.classList.contains('theme-dark') || !root.classList.contains('theme-light')
    setDark(isDark)
  }, [])

  const toggle = () => {
    const root = document.documentElement
    if (dark) {
      root.classList.remove('theme-dark')
      root.classList.add('theme-light')
    } else {
      root.classList.remove('theme-light')
      root.classList.add('theme-dark')
    }
    setDark(!dark)
  }

  return (
    <button
      onClick={toggle}
      className="w-8 h-8 rounded-lg border border-[var(--border-primary)] flex items-center justify-center hover:border-[var(--accent)] transition-colors text-[var(--text-secondary)] hover:text-[var(--accent)]"
      title="Toggle theme"
    >
      {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
    </button>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AdminBillingPage() {
  const [data,      setData]      = useState<Overview | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [search,    setSearch]    = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [planFilter,   setPlanFilter]   = useState<string>('all')
  const [cycleFilter,  setCycleFilter]  = useState<string>('all')
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [sort,      setSort]      = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'subscribed_at', dir: -1 })
  const [page,      setPage]      = useState(1)

  const load = useCallback(() => {
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
  }, [])

  useEffect(() => { load() }, [load])

  // ── Time-range cutoff ──────────────────────────────────────────────────────
  const cutoff = useMemo(() => {
    const range = TIME_RANGES.find(r => r.key === timeRange)!
    if (range.days === 0) return null
    return new Date(Date.now() - range.days * 86400000)
  }, [timeRange])

  // ── Filtered + sorted rows ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return (data?.subscribers ?? []).filter(s => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false
      if (planFilter   !== 'all' && s.plan_id !== planFilter)  return false
      if (cycleFilter  !== 'all' && s.billing_cycle !== cycleFilter) return false
      if (cutoff && new Date(s.subscribed_at) < cutoff) return false
      if (search) {
        const q = search.toLowerCase()
        if (!s.org_id.toLowerCase().includes(q) && !s.plan_name.toLowerCase().includes(q) && !s.status.toLowerCase().includes(q)) return false
      }
      return true
    }).sort((a, b) => {
      const av = (a[sort.key] ?? '') as string | number
      const bv = (b[sort.key] ?? '') as string | number
      return av < bv ? -sort.dir : av > bv ? sort.dir : 0
    })
  }, [data, statusFilter, planFilter, cycleFilter, cutoff, search, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleSort = (key: SortKey) => {
    setPage(1)
    setSort(prev => prev.key === key ? { key, dir: (prev.dir * -1) as 1 | -1 } : { key, dir: -1 })
  }

  const resetFilters = () => {
    setSearch(''); setStatusFilter('all'); setPlanFilter('all')
    setCycleFilter('all'); setTimeRange('30d'); setPage(1)
  }

  const hasFilters = search || statusFilter !== 'all' || planFilter !== 'all' || cycleFilter !== 'all' || timeRange !== '30d'

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
        <RefreshCw className="w-5 h-5 text-[var(--accent)] animate-spin" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Loading billing data…</p>
    </div>
  )

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col items-center justify-center gap-5">
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-red-500" />
      </div>
      <div className="text-center">
        <p className="text-sm font-black text-[var(--text-primary)] mb-1">{error}</p>
        <p className="text-[10px] font-mono text-[var(--text-secondary)]">Could not load billing data</p>
      </div>
      <button
        onClick={load}
        className="px-5 py-2 text-[10px] font-black uppercase tracking-widest border border-[var(--border-primary)] rounded-xl hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
      >
        Try Again
      </button>
    </div>
  )

  const kpis = data!.kpis
  const dist = data!.plan_distribution

  // ── Computed KPIs for filtered range ──────────────────────────────────────
  const filteredMRR = Math.round(filtered
    .filter(s => ['active','trialing'].includes(s.status))
    .reduce((sum, s) => sum + s.mrr_cents, 0) / 100)

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)]">

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-20 bg-[var(--bg-secondary)]/90 backdrop-blur-xl border-b border-[var(--border-primary)] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest leading-none">Billing Intelligence</h1>
            <p className="text-[9px] font-mono text-[var(--text-secondary)] mt-0.5">
              Platform Admin · {fmt.date(data!.computed_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV(filtered)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border border-[var(--border-primary)] rounded-lg hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
          >
            <Download className="w-3 h-3" /> Export CSV
          </button>
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border border-[var(--border-primary)] rounded-lg hover:border-[var(--accent)] transition-all"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
          <ThemeToggle />
        </div>
      </div>

      <div className="px-8 py-8 space-y-8 max-w-[1400px] mx-auto">

        {/* ── Time Range ── */}
        <div className="flex items-center gap-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-1 w-fit">
          {TIME_RANGES.map(r => (
            <button
              key={r.key}
              onClick={() => { setTimeRange(r.key); setPage(1) }}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                timeRange === r.key
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Active Subscribers"
            value={kpis.total_subscribers.toString()}
            sub={`+${kpis.new_this_month} this month`}
            icon={<Users className="w-4 h-4" />}
            color="#10b981"
            trend="up"
            trendLabel={`+${kpis.new_this_month}`}
          />
          <KPICard
            label="MRR"
            value={fmt.usd(kpis.mrr_dollars)}
            sub={`ARR · ${fmt.usd(kpis.arr_dollars)}`}
            icon={<DollarSign className="w-4 h-4" />}
            color="#3b82f6"
            trend="up"
            trendLabel="Active"
          />
          <KPICard
            label="Churn Rate · 30d"
            value={fmt.pct(kpis.churn_rate_30d)}
            sub={`${kpis.churned_last_30d} cancelled`}
            icon={<Activity className="w-4 h-4" />}
            color={kpis.churn_rate_30d > 5 ? '#ef4444' : '#f59e0b'}
            trend={kpis.churn_rate_30d > 5 ? 'down' : null}
            trendLabel="High"
          />
          <KPICard
            label="All Time Orgs"
            value={kpis.total_all_time.toString()}
            sub={`${kpis.total_subscribers} currently active`}
            icon={<Zap className="w-4 h-4" />}
            color="#8b5cf6"
          />
        </div>

        {/* ── Plan Distribution + Status Breakdown ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Plan distribution */}
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Plan Distribution</h2>
              <span className="text-[9px] font-mono text-[var(--text-secondary)] opacity-50">active subscribers</span>
            </div>
            <div className="space-y-4">
              {['starter', 'growth', 'scale'].map(planId => {
                const meta  = PLAN_META[planId]
                const count = dist[planId] ?? 0
                const total = kpis.total_subscribers || 1
                return (
                  <div key={planId} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                          style={{ color: meta.color, background: meta.bg }}
                        >
                          {meta.label}
                        </span>
                        <span className="text-[9px] font-mono text-[var(--text-secondary)]">{meta.price}/mo</span>
                      </div>
                      <span className="text-[10px] font-black text-[var(--text-primary)]">{count} orgs</span>
                    </div>
                    <MiniBar value={count} max={total} color={meta.color} />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Status breakdown */}
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Status Breakdown</h2>
              <span className="text-[9px] font-mono text-[var(--text-secondary)] opacity-50">all subscriptions</span>
            </div>
            <div className="space-y-4">
              {Object.entries(STATUS_META).map(([key, meta]) => {
                const count = data!.status_breakdown[key] ?? 0
                const total = Object.values(data!.status_breakdown).reduce((a, b) => a + b, 0) || 1
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span
                        className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{ color: meta.color, background: meta.bg }}
                      >
                        {meta.icon} {meta.label}
                      </span>
                      <span className="text-[10px] font-black text-[var(--text-primary)]">{count}</span>
                    </div>
                    <MiniBar value={count} max={total} color={meta.color} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Subscribers Table ── */}
        <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">

          {/* Toolbar */}
          <div className="px-6 py-4 border-b border-[var(--border-primary)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-[10px] font-black uppercase tracking-widest">Subscribers</h2>
                <span className="text-[9px] font-mono text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] px-2 py-0.5 rounded-full">
                  {filtered.length}
                </span>
                {filteredMRR > 0 && (
                  <span className="text-[9px] font-black text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/20 px-2 py-0.5 rounded-full">
                    {fmt.usd(filteredMRR)} filtered MRR
                  </span>
                )}
              </div>
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)] hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  placeholder="Search org ID, plan, status…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg pl-7 pr-3 py-1.5 text-[10px] font-mono text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] w-56 transition-colors"
                />
              </div>

              {/* Status */}
              <div className="relative">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-secondary)] pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                  className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg pl-7 pr-6 py-1.5 text-[10px] font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] appearance-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  {Object.entries(STATUS_META).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-secondary)] pointer-events-none" />
              </div>

              {/* Plan */}
              <div className="relative">
                <select
                  value={planFilter}
                  onChange={e => { setPlanFilter(e.target.value); setPage(1) }}
                  className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 pr-6 py-1.5 text-[10px] font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] appearance-none cursor-pointer"
                >
                  <option value="all">All Plans</option>
                  {Object.entries(PLAN_META).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-secondary)] pointer-events-none" />
              </div>

              {/* Billing cycle */}
              <div className="relative">
                <select
                  value={cycleFilter}
                  onChange={e => { setCycleFilter(e.target.value); setPage(1) }}
                  className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 pr-6 py-1.5 text-[10px] font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] appearance-none cursor-pointer"
                >
                  <option value="all">All Cycles</option>
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-secondary)] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/50">
                  {([
                    ['org_id',            'Org'],
                    ['plan_name',         'Plan'],
                    ['billing_cycle',     'Cycle'],
                    ['status',            'Status'],
                    ['mrr_cents',         'MRR'],
                    ['subscribed_at',     'Since'],
                    ['current_period_end','Renews'],
                  ] as [SortKey, string][]).map(([key, label]) => (
                    <th
                      key={key}
                      onClick={() => toggleSort(key)}
                      className="text-left px-5 py-3 text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] cursor-pointer hover:text-[var(--accent)] select-none transition-colors"
                    >
                      <span className="flex items-center gap-1">
                        {label}
                        {sort.key === key
                          ? sort.dir === 1
                            ? <ChevronUp   className="w-3 h-3 text-[var(--accent)]" />
                            : <ChevronDown className="w-3 h-3 text-[var(--accent)]" />
                          : <ChevronDown className="w-3 h-3 opacity-20" />
                        }
                      </span>
                    </th>
                  ))}
                  <th className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                    Provider
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-[var(--text-secondary)]">
                        <BarChart3 className="w-8 h-8 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50">No subscribers match your filters</p>
                        {hasFilters && (
                          <button onClick={resetFilters} className="text-[9px] font-black text-[var(--accent)] hover:underline">
                            Clear all filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : rows.map((s, i) => {
                  const sm   = STATUS_META[s.status] ?? STATUS_META['active']
                  const pm   = PLAN_META[s.plan_id]  ?? PLAN_META['starter']
                  const isEven = i % 2 === 0
                  return (
                    <tr
                      key={s.subscription_id}
                      className={`border-b border-[var(--border-primary)] hover:bg-[var(--accent)]/5 transition-colors ${isEven ? '' : 'bg-[var(--bg-secondary)]/30'}`}
                    >
                      {/* Org */}
                      <td className="px-5 py-3">
                        <span className="text-[10px] font-mono text-[var(--text-secondary)]" title={s.org_id}>
                          {s.org_id.slice(0, 8)}…
                        </span>
                      </td>
                      {/* Plan */}
                      <td className="px-5 py-3">
                        <span
                          className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                          style={{ color: pm.color, background: pm.bg }}
                        >
                          {s.plan_name}
                        </span>
                      </td>
                      {/* Cycle */}
                      <td className="px-5 py-3">
                        <span className="text-[9px] font-mono text-[var(--text-secondary)] capitalize">{s.billing_cycle}</span>
                      </td>
                      {/* Status */}
                      <td className="px-5 py-3">
                        <span
                          className="flex items-center gap-1 w-fit text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                          style={{ color: sm.color, background: sm.bg }}
                        >
                          {sm.icon} {sm.label}
                        </span>
                      </td>
                      {/* MRR */}
                      <td className="px-5 py-3">
                        {s.mrr_cents > 0
                          ? <span className="text-[11px] font-black text-[var(--text-primary)]">${Math.round(s.mrr_cents / 100)}<span className="text-[8px] font-mono text-[var(--text-secondary)]">/mo</span></span>
                          : <span className="text-[var(--text-secondary)] opacity-25 text-[10px]">—</span>
                        }
                      </td>
                      {/* Since */}
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-1 text-[9px] font-mono text-[var(--text-secondary)]">
                          <Calendar className="w-2.5 h-2.5" />
                          {fmt.dateShort(s.subscribed_at)}
                        </span>
                      </td>
                      {/* Renews */}
                      <td className="px-5 py-3">
                        <span className="text-[9px] font-mono text-[var(--text-secondary)]">
                          {s.status === 'cancelled' ? (
                            <span className="text-[#6b7280]">{fmt.dateShort(s.cancelled_at)}</span>
                          ) : fmt.dateShort(s.current_period_end)}
                        </span>
                      </td>
                      {/* Provider */}
                      <td className="px-5 py-3">
                        {s.stripe_subscription_id
                          ? <span className="text-[9px] font-black text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded-full">Stripe ✓</span>
                          : <span className="text-[9px] font-mono text-[var(--text-secondary)] opacity-30">Manual</span>
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-5 py-3 border-t border-[var(--border-primary)] flex items-center justify-between">
            <p className="text-[9px] font-mono text-[var(--text-secondary)]">
              {filtered.length === 0 ? 'No records' : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--border-primary)] disabled:opacity-30 hover:border-[var(--accent)] transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…')
                  acc.push(p); return acc
                }, [])
                .map((p, i) => p === '…'
                  ? <span key={`e${i}`} className="w-7 text-center text-[9px] text-[var(--text-secondary)]">…</span>
                  : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-[9px] font-black transition-all ${
                        page === p
                          ? 'bg-[var(--accent)] text-white'
                          : 'border border-[var(--border-primary)] hover:border-[var(--accent)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--border-primary)] disabled:opacity-30 hover:border-[var(--accent)] transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[9px] font-mono text-[var(--text-secondary)] opacity-40">
              {totalPages} page{totalPages !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* ── Recent Events ── */}
        <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border-primary)] flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-widest">Subscription Events</h2>
            <span className="text-[9px] font-mono text-[var(--text-secondary)] opacity-50">last 20</span>
          </div>
          <div className="divide-y divide-[var(--border-primary)]">
            {data!.recent_events.length === 0 ? (
              <div className="px-6 py-10 flex flex-col items-center gap-2 text-[var(--text-secondary)]">
                <Activity className="w-6 h-6 opacity-20" />
                <p className="text-[9px] font-black uppercase tracking-widest opacity-40">No events recorded yet</p>
              </div>
            ) : data!.recent_events.map(ev => {
              const evColor = ev.event_type === 'cancelled' ? '#ef4444'
                : ev.event_type === 'upgraded' ? '#10b981'
                : ev.event_type === 'created'  ? '#3b82f6'
                : 'var(--accent)'
              return (
                <div
                  key={ev.id}
                  className="px-6 py-3 flex items-center justify-between hover:bg-[var(--bg-secondary)] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: evColor }} />
                    <span
                      className="text-[9px] font-black uppercase tracking-widest"
                      style={{ color: evColor }}
                    >
                      {ev.event_type.replace(/_/g, ' ')}
                    </span>
                    {ev.from_plan_id && ev.to_plan_id && (
                      <span className="text-[9px] font-mono text-[var(--text-secondary)] flex items-center gap-1">
                        <span style={{ color: PLAN_META[ev.from_plan_id]?.color }}>{ev.from_plan_id}</span>
                        <ArrowUpRight className="w-2.5 h-2.5" />
                        <span style={{ color: PLAN_META[ev.to_plan_id]?.color }}>{ev.to_plan_id}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {ev.amount_cents != null && ev.amount_cents > 0 && (
                      <span className="text-[10px] font-black" style={{ color: evColor }}>
                        ${Math.round(ev.amount_cents / 100)}
                      </span>
                    )}
                    <span className="text-[9px] font-mono text-[var(--text-secondary)]">{fmt.date(ev.created_at)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between py-2">
          <p className="text-[9px] font-mono text-[var(--text-secondary)] opacity-40">
            Facttic Platform Admin · Billing Intelligence v1.0
          </p>
          <p className="text-[9px] font-mono text-[var(--text-secondary)] opacity-40">
            Payment provider not connected — ready for Stripe / Paddle
          </p>
        </div>

      </div>
    </div>
  )
}

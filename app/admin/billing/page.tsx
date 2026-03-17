'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  DollarSign, Users, TrendingDown, TrendingUp, RefreshCw,
  ChevronDown, ChevronUp, CreditCard, AlertCircle, CheckCircle,
  Clock, XCircle, PauseCircle, BarChart3, Calendar, ArrowUpRight,
  Download, Search, Filter, Sun, Moon, Activity, Zap,
  ChevronLeft, ChevronRight, Home, Layers, Target, ArrowRight,
  Sparkles, TrendingUp as Growth,
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

const PLAN_META: Record<string, { color: string; bg: string; label: string; price: string; mrr: number }> = {
  starter: { color: '#3b82f6', bg: '#3b82f618', label: 'Starter', price: '$39',  mrr: 39  },
  growth:  { color: '#8b5cf6', bg: '#8b5cf618', label: 'Growth',  price: '$129', mrr: 129 },
  scale:   { color: '#10b981', bg: '#10b98118', label: 'Scale',   price: '$349', mrr: 349 },
}

const TIME_RANGES: { key: TimeRange; label: string; days: number }[] = [
  { key: '7d',  label: '7D',   days: 7   },
  { key: '30d', label: '30D',  days: 30  },
  { key: '90d', label: '90D',  days: 90  },
  { key: '1y',  label: '1Y',   days: 365 },
  { key: 'all', label: 'All',  days: 0   },
]

const EVENT_COLORS: Record<string, string> = {
  created:   '#3b82f6',
  upgraded:  '#10b981',
  downgraded:'#f59e0b',
  cancelled: '#ef4444',
  paused:    '#8b5cf6',
  renewed:   '#06b6d4',
}

const PAGE_SIZE = 10

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmt = {
  usd:  (n: number) => `$${n.toLocaleString()}`,
  pct:  (n: number) => `${n.toFixed(1)}%`,
  date: (s: string | null) =>
    s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
  dateShort: (s: string | null) =>
    s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—',
  k: (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString(),
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

// ── SVG Ring Chart ─────────────────────────────────────────────────────────────

function RingChart({ segments }: { segments: { value: number; color: string; label: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  if (total === 0) {
    return (
      <div className="w-28 h-28 rounded-full border-4 border-dashed border-[var(--border-primary)] flex items-center justify-center">
        <span className="text-[8px] font-mono text-[var(--text-secondary)] opacity-30">empty</span>
      </div>
    )
  }

  const r = 38; const cx = 48; const cy = 48; const strokeW = 12
  let offset = 0
  const circumference = 2 * Math.PI * r

  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={strokeW} stroke="var(--border-primary)" />
      {segments.filter(s => s.value > 0).map((seg, i) => {
        const pct = seg.value / total
        const dash = pct * circumference
        const gap  = circumference - dash
        const rot  = offset * circumference * 360 / circumference
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            strokeWidth={strokeW}
            stroke={seg.color}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(${-90 + offset * 360} ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        )
        offset += pct
        return el
      })}
      <text x={cx} y={cy - 5} textAnchor="middle" className="fill-current" style={{ fontSize: 14, fontWeight: 900, fill: 'var(--text-primary)' }}>
        {total}
      </text>
      <text x={cx} y={cy + 9} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--text-secondary)', fontFamily: 'monospace', letterSpacing: 1 }}>
        ORGS
      </text>
    </svg>
  )
}

// ── SVG Sparkline ──────────────────────────────────────────────────────────────

function Sparkline({ values, color, height = 40, width = 160 }: { values: number[]; color: string; height?: number; width?: number }) {
  if (values.length < 2) {
    return <div style={{ width, height }} className="opacity-20 flex items-end justify-center">
      <span className="text-[8px] font-mono text-[var(--text-secondary)]">no data</span>
    </div>
  }

  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const pad = 4

  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (width - pad * 2)
    const y = pad + ((1 - (v - min) / range) * (height - pad * 2))
    return `${x},${y}`
  }).join(' ')

  const areaBottom = `${pad + (width - pad * 2)},${height - pad} ${pad},${height - pad}`
  const area = `M ${pts.split(' ')[0]} L ${pts} L ${areaBottom} Z`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${color.replace('#', '')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* last point dot */}
      <circle
        cx={Number(pts.split(' ').at(-1)!.split(',')[0])}
        cy={Number(pts.split(' ').at(-1)!.split(',')[1])}
        r={3} fill={color}
      />
    </svg>
  )
}

// ── MiniBar ────────────────────────────────────────────────────────────────────

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

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KPICard({
  label, value, sub, icon, color, trend, trendLabel, sparkData,
}: {
  label: string; value: string; sub: string
  icon: React.ReactNode; color: string
  trend?: 'up' | 'down' | null; trendLabel?: string
  sparkData?: number[]
}) {
  return (
    <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl p-5 flex flex-col gap-4 group hover:border-[color:var(--border-subtle)] transition-all overflow-hidden relative">
      {/* subtle gradient glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl" style={{ background: `radial-gradient(ellipse at 0% 0%, ${color}08 0%, transparent 70%)` }} />

      <div className="flex items-start justify-between relative">
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

      <div className="relative">
        <p className="text-[24px] font-black tracking-tighter leading-none" style={{ color }}>{value}</p>
        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] mt-1">{label}</p>
        <p className="text-[9px] font-mono text-[var(--text-secondary)] opacity-50 mt-0.5">{sub}</p>
      </div>

      {sparkData && sparkData.length > 1 && (
        <div className="relative -mx-1 -mb-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <Sparkline values={sparkData} color={color} height={28} width={160} />
        </div>
      )}
    </div>
  )
}

// ── Insight Badge ─────────────────────────────────────────────────────────────

function InsightBadge({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 hover:border-[var(--border-subtle)] transition-colors">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] truncate">{label}</p>
        <p className="text-[13px] font-black leading-tight" style={{ color }}>{value}</p>
      </div>
    </div>
  )
}

// ── Theme Toggle ──────────────────────────────────────────────────────────────

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

// ── Simulate sparkline from subscriber list ───────────────────────────────────

function buildMRRSpark(subscribers: Subscriber[], days: number): number[] {
  const now = Date.now()
  const buckets = Math.min(12, days === 0 ? 12 : Math.ceil(days / 7))
  const bucketMs = (days === 0 ? 365 : days) * 86400000 / buckets
  return Array.from({ length: buckets }, (_, i) => {
    const end = now - (buckets - 1 - i) * bucketMs
    const mrr = subscribers
      .filter(s => {
        const joined = new Date(s.subscribed_at).getTime()
        const left   = s.cancelled_at ? new Date(s.cancelled_at).getTime() : Infinity
        return joined <= end && left > end && ['active', 'trialing'].includes(s.status)
      })
      .reduce((sum, s) => sum + s.mrr_cents, 0)
    return Math.round(mrr / 100)
  })
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AdminBillingPage() {
  const [data,         setData]         = useState<Overview | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [planFilter,   setPlanFilter]   = useState<string>('all')
  const [cycleFilter,  setCycleFilter]  = useState<string>('all')
  const [timeRange,    setTimeRange]    = useState<TimeRange>('30d')
  const [sort,         setSort]         = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'subscribed_at', dir: -1 })
  const [page,         setPage]         = useState(1)

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

  const cutoff = useMemo(() => {
    const range = TIME_RANGES.find(r => r.key === timeRange)!
    if (range.days === 0) return null
    return new Date(Date.now() - range.days * 86400000)
  }, [timeRange])

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

  // ── Computed metrics ───────────────────────────────────────────────────────
  const activeSubscribers = useMemo(() =>
    (data?.subscribers ?? []).filter(s => ['active', 'trialing'].includes(s.status)), [data])

  const filteredMRR = useMemo(() =>
    Math.round(filtered.filter(s => ['active','trialing'].includes(s.status))
      .reduce((sum, s) => sum + s.mrr_cents, 0) / 100), [filtered])

  const arpu = useMemo(() => {
    if (!data?.kpis.total_subscribers) return 0
    return Math.round(data.kpis.mrr_dollars / data.kpis.total_subscribers)
  }, [data])

  const ltv = useMemo(() => {
    if (!data?.kpis.churn_rate_30d || data.kpis.churn_rate_30d === 0) return arpu * 24
    return Math.round(arpu / (data.kpis.churn_rate_30d / 100))
  }, [arpu, data])

  const timeRangeDays = TIME_RANGES.find(r => r.key === timeRange)!.days
  const mrrSpark = useMemo(() =>
    data ? buildMRRSpark(data.subscribers, timeRangeDays) : [], [data, timeRangeDays])

  const subSpark = useMemo(() => {
    if (!data) return []
    const buckets = mrrSpark.length
    const now = Date.now()
    const days = timeRangeDays || 365
    const bucketMs = days * 86400000 / buckets
    return Array.from({ length: buckets }, (_, i) => {
      const end = now - (buckets - 1 - i) * bucketMs
      return data.subscribers.filter(s => {
        const joined = new Date(s.subscribed_at).getTime()
        const left = s.cancelled_at ? new Date(s.cancelled_at).getTime() : Infinity
        return joined <= end && left > end
      }).length
    })
  }, [data, mrrSpark.length, timeRangeDays])

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
  const ringSegments = [
    { value: dist['starter'] ?? 0, color: PLAN_META.starter.color, label: 'Starter' },
    { value: dist['growth']  ?? 0, color: PLAN_META.growth.color,  label: 'Growth'  },
    { value: dist['scale']   ?? 0, color: PLAN_META.scale.color,   label: 'Scale'   },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)]">

      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-20 bg-[var(--bg-secondary)]/95 backdrop-blur-xl border-b border-[var(--border-primary)]">

        {/* Breadcrumb */}
        <div className="px-8 pt-3 pb-0 flex items-center gap-1.5 text-[9px] font-mono text-[var(--text-secondary)]">
          <Link href="/admin" className="hover:text-[var(--accent)] transition-colors flex items-center gap-1">
            <Home className="w-3 h-3" /> Admin
          </Link>
          <ChevronRight className="w-2.5 h-2.5 opacity-30" />
          <span className="text-[var(--text-primary)] font-black uppercase tracking-widest">Billing</span>
        </div>

        {/* Header row */}
        <div className="px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-primary, #6366f1)18', color: 'var(--accent)' }}>
              <CreditCard className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest leading-none">Billing Intelligence</h1>
              <p className="text-[9px] font-mono text-[var(--text-secondary)] mt-0.5 opacity-60">
                Platform Admin · synced {fmt.date(data!.computed_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Time range in header */}
            <div className="hidden sm:flex items-center gap-0.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-0.5">
              {TIME_RANGES.map(r => (
                <button
                  key={r.key}
                  onClick={() => { setTimeRange(r.key); setPage(1) }}
                  className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                    timeRange === r.key
                      ? 'bg-[var(--accent)] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => exportCSV(filtered)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border border-[var(--border-primary)] rounded-lg hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
            >
              <Download className="w-3 h-3" /> Export
            </button>
            <button
              onClick={load}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border border-[var(--border-primary)] rounded-lg hover:border-[var(--accent)] transition-all"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="px-8 py-8 space-y-8 max-w-[1440px] mx-auto">

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Active Subscribers"
            value={kpis.total_subscribers.toString()}
            sub={`+${kpis.new_this_month} joined this month`}
            icon={<Users className="w-4 h-4" />}
            color="#10b981"
            trend="up"
            trendLabel={`+${kpis.new_this_month}`}
            sparkData={subSpark}
          />
          <KPICard
            label="Monthly Recurring Revenue"
            value={fmt.usd(kpis.mrr_dollars)}
            sub={`ARR · ${fmt.usd(kpis.arr_dollars)}`}
            icon={<DollarSign className="w-4 h-4" />}
            color="#3b82f6"
            trend="up"
            trendLabel="Growing"
            sparkData={mrrSpark}
          />
          <KPICard
            label="30-Day Churn Rate"
            value={fmt.pct(kpis.churn_rate_30d)}
            sub={`${kpis.churned_last_30d} churned this period`}
            icon={<Activity className="w-4 h-4" />}
            color={kpis.churn_rate_30d > 5 ? '#ef4444' : '#f59e0b'}
            trend={kpis.churn_rate_30d > 5 ? 'down' : null}
            trendLabel="High"
          />
          <KPICard
            label="All-Time Orgs"
            value={kpis.total_all_time.toString()}
            sub={`${kpis.total_subscribers} active right now`}
            icon={<Zap className="w-4 h-4" />}
            color="#8b5cf6"
          />
        </div>

        {/* ── Insights row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <InsightBadge
            icon={<Target className="w-3.5 h-3.5" />}
            label="ARPU / Month"
            value={arpu > 0 ? fmt.usd(arpu) : '—'}
            color="#3b82f6"
          />
          <InsightBadge
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            label="Est. LTV"
            value={ltv > 0 ? fmt.usd(ltv) : '—'}
            color="#8b5cf6"
          />
          <InsightBadge
            icon={<Layers className="w-3.5 h-3.5" />}
            label="Annual Contracts"
            value={`${(data?.subscribers ?? []).filter(s => s.billing_cycle === 'annual').length} orgs`}
            color="#10b981"
          />
          <InsightBadge
            icon={<Sparkles className="w-3.5 h-3.5" />}
            label="Trial → Paid"
            value={(() => {
              const trials = (data?.subscribers ?? []).filter(s => s.status === 'trialing').length
              const active = kpis.total_subscribers
              return active + trials > 0 ? `${Math.round(active / (active + trials) * 100)}%` : '—'
            })()}
            color="#f59e0b"
          />
        </div>

        {/* ── Plan Distribution + Revenue Mix + Status ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Plan distribution — ring chart */}
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Plan Distribution</h2>
              <span className="text-[9px] font-mono text-[var(--text-secondary)] opacity-40">active orgs</span>
            </div>
            <div className="flex items-center gap-6">
              <RingChart segments={ringSegments} />
              <div className="flex-1 space-y-3">
                {['starter', 'growth', 'scale'].map(planId => {
                  const meta  = PLAN_META[planId]
                  const count = dist[planId] ?? 0
                  const total = kpis.total_subscribers || 1
                  return (
                    <div key={planId} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: meta.color }}>
                          {meta.label} <span className="opacity-40 font-mono">{meta.price}</span>
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

          {/* Revenue contribution */}
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Revenue Mix</h2>
              <span className="text-[9px] font-mono text-[var(--text-secondary)] opacity-40">MRR by plan</span>
            </div>
            <div className="space-y-4">
              {['scale', 'growth', 'starter'].map(planId => {
                const meta  = PLAN_META[planId]
                const count = dist[planId] ?? 0
                const rev   = count * meta.mrr
                const totalRev = ['starter','growth','scale'].reduce((s, p) => s + (dist[p] ?? 0) * PLAN_META[p].mrr, 0) || 1
                return (
                  <div key={planId} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: meta.color }}>
                        {meta.label}
                      </span>
                      <span className="text-[10px] font-black text-[var(--text-primary)]">{fmt.usd(rev)}<span className="text-[8px] font-mono opacity-40">/mo</span></span>
                    </div>
                    <MiniBar value={rev} max={totalRev} color={meta.color} />
                  </div>
                )
              })}
              <div className="pt-2 border-t border-[var(--border-primary)] flex items-center justify-between">
                <span className="text-[9px] font-mono text-[var(--text-secondary)]">Total MRR</span>
                <span className="text-[12px] font-black text-[var(--accent)]">{fmt.usd(kpis.mrr_dollars)}</span>
              </div>
            </div>
          </div>

          {/* Status breakdown */}
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Status Breakdown</h2>
              <span className="text-[9px] font-mono text-[var(--text-secondary)] opacity-40">all subscriptions</span>
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

        {/* ── MRR Trend ── */}
        {mrrSpark.some(v => v > 0) && (
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">MRR Trend</h2>
                <p className="text-[9px] font-mono text-[var(--text-secondary)] opacity-40 mt-0.5">
                  {TIME_RANGES.find(r => r.key === timeRange)?.label} · {mrrSpark.length} data points
                </p>
              </div>
              <div className="text-right">
                <p className="text-[20px] font-black tracking-tighter text-[#3b82f6]">{fmt.usd(mrrSpark.at(-1) ?? 0)}</p>
                <p className="text-[9px] font-mono text-[var(--text-secondary)] opacity-40">current MRR</p>
              </div>
            </div>
            <div className="w-full overflow-hidden">
              <Sparkline
                values={mrrSpark}
                color="#3b82f6"
                height={80}
                width={1200}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[8px] font-mono text-[var(--text-secondary)] opacity-30">
                {timeRange === '7d' ? '7 days ago' : timeRange === '30d' ? '30 days ago' : timeRange === '90d' ? '90 days ago' : timeRange === '1y' ? '1 year ago' : 'start'}
              </span>
              <span className="text-[8px] font-mono text-[var(--text-secondary)] opacity-30">now</span>
            </div>
          </div>
        )}

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

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  placeholder="Search org, plan, status…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg pl-7 pr-3 py-1.5 text-[10px] font-mono text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] w-52 transition-colors"
                />
              </div>

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
                <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/60">
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
                    <td colSpan={8} className="px-5 py-20 text-center">
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
                  return (
                    <tr
                      key={s.subscription_id}
                      className={`border-b border-[var(--border-primary)] hover:bg-[var(--accent)]/5 transition-colors group ${i % 2 !== 0 ? 'bg-[var(--bg-secondary)]/30' : ''}`}
                    >
                      <td className="px-5 py-3">
                        <span
                          className="text-[10px] font-mono text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors"
                          title={s.org_id}
                        >
                          {s.org_id.slice(0, 8)}…
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                          style={{ color: pm.color, background: pm.bg }}
                        >
                          {s.plan_name}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[9px] font-mono text-[var(--text-secondary)] capitalize">{s.billing_cycle}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="flex items-center gap-1 w-fit text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                          style={{ color: sm.color, background: sm.bg }}
                        >
                          {sm.icon} {sm.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {s.mrr_cents > 0
                          ? <span className="text-[11px] font-black text-[var(--text-primary)]">${Math.round(s.mrr_cents / 100)}<span className="text-[8px] font-mono text-[var(--text-secondary)]">/mo</span></span>
                          : <span className="text-[var(--text-secondary)] opacity-25 text-[10px]">—</span>
                        }
                      </td>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-1 text-[9px] font-mono text-[var(--text-secondary)]">
                          <Calendar className="w-2.5 h-2.5" />
                          {fmt.dateShort(s.subscribed_at)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[9px] font-mono text-[var(--text-secondary)]">
                          {s.status === 'cancelled'
                            ? <span className="text-[#6b7280]">{fmt.dateShort(s.cancelled_at)}</span>
                            : fmt.dateShort(s.current_period_end)
                          }
                        </span>
                      </td>
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

        {/* ── Subscription Events ── */}
        <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border-primary)] flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-widest">Subscription Events</h2>
            <span className="text-[9px] font-mono text-[var(--text-secondary)] opacity-50">last 20</span>
          </div>
          <div className="divide-y divide-[var(--border-primary)]">
            {data!.recent_events.length === 0 ? (
              <div className="px-6 py-12 flex flex-col items-center gap-3 text-[var(--text-secondary)]">
                <Activity className="w-7 h-7 opacity-20" />
                <p className="text-[9px] font-black uppercase tracking-widest opacity-40">No subscription events yet</p>
                <p className="text-[8px] font-mono opacity-20">Events appear when orgs subscribe, upgrade, or cancel</p>
              </div>
            ) : data!.recent_events.map(ev => {
              const evColor = EVENT_COLORS[ev.event_type] ?? 'var(--accent)'
              return (
                <div
                  key={ev.id}
                  className="px-6 py-3 flex items-center justify-between hover:bg-[var(--bg-secondary)] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: evColor }} />
                    <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: evColor }}>
                      {ev.event_type.replace(/_/g, ' ')}
                    </span>
                    {ev.from_plan_id && ev.to_plan_id && (
                      <span className="text-[9px] font-mono text-[var(--text-secondary)] flex items-center gap-1">
                        <span style={{ color: PLAN_META[ev.from_plan_id]?.color ?? 'inherit' }}>{ev.from_plan_id}</span>
                        <ArrowRight className="w-2.5 h-2.5 opacity-40" />
                        <span style={{ color: PLAN_META[ev.to_plan_id]?.color ?? 'inherit' }}>{ev.to_plan_id}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {ev.amount_cents != null && ev.amount_cents > 0 && (
                      <span className="text-[10px] font-black" style={{ color: evColor }}>
                        ${Math.round(ev.amount_cents / 100)}
                      </span>
                    )}
                    <span className="text-[9px] font-mono text-[var(--text-secondary)] opacity-60">{fmt.date(ev.created_at)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between py-3 border-t border-[var(--border-primary)]">
          <p className="text-[9px] font-mono text-[var(--text-secondary)] opacity-40">
            Facttic Platform Admin · Billing Intelligence v2.0
          </p>
          <p className="text-[9px] font-mono text-[var(--text-secondary)] opacity-40">
            Payment provider not connected — ready for Stripe / Paddle
          </p>
        </div>

      </div>
    </div>
  )
}

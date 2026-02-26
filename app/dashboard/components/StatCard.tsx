'use client'

type Tone = 'neutral' | 'stable' | 'watch' | 'critical'

type Props = {
  title: string
  value: number | string
  tone?: Tone
}

function getToneStyles(tone: Tone) {
  switch (tone) {
    case 'stable':
      return 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
    case 'watch':
      return 'border-amber-500 bg-amber-500/10 text-amber-400'
    case 'critical':
      return 'border-rose-500 bg-rose-500/10 text-rose-400'
    default:
      return 'border-slate-700 bg-slate-900 text-slate-300'
  }
}

export function StatCard({ title, value, tone = 'neutral' }: Props) {
  const styles = getToneStyles(tone)

  return (
    <div className={`rounded-xl border p-6 ${styles}`}>
      <div className="text-xs uppercase tracking-wide opacity-60 mb-2">
        {title}
      </div>
      <div className="text-3xl font-semibold">
        {value}
      </div>
    </div>
  )
}
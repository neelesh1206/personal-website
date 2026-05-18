import { Users } from 'lucide-react'
import { getSiteStats } from '@/lib/analytics/queries'

export async function VisitorMetrics() {
  const stats = await getSiteStats()
  return (
    <section aria-label="Site visitor metrics" className="mb-20 grid grid-cols-3 gap-2 sm:gap-3">
      <Metric
        label="Unique visitors"
        value={stats.totalVisitors}
        hint="distinct people, all time"
      />
      <Metric label="Visitors today" value={stats.visitorsToday} hint="resets at UTC midnight" />
      <Metric
        label="Page views"
        value={stats.totalViews}
        hint="every page load, deduped per visitor per day"
      />
    </section>
  )
}

export function VisitorMetricsSkeleton() {
  return (
    <section aria-hidden="true" className="mb-20 grid grid-cols-3 gap-2 sm:gap-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40 sm:h-28"
        />
      ))}
    </section>
  )
}

function Metric({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-3 sm:p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500 sm:gap-1.5 sm:text-xs dark:text-zinc-400">
        <Users size={12} />
        <span className="leading-tight">{label}</span>
      </div>
      <div className="mt-2 text-xl font-semibold tabular-nums text-zinc-900 sm:text-2xl dark:text-zinc-50">
        {value.toLocaleString()}
      </div>
      <div className="mt-1 hidden text-[11px] text-zinc-400 sm:block dark:text-zinc-500">
        {hint}
      </div>
    </div>
  )
}

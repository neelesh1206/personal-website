'use client'

import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DailyLog } from '@/lib/admin/prep/types'

type DailyXp = { date: string; xp: number }

export function DashboardCharts({
  logs,
  dailyXp,
}: {
  /** Most-recent-first per the existing getDailyLogs() contract. */
  logs: DailyLog[]
  /** Ascending by date. */
  dailyXp: DailyXp[]
}) {
  // Cumulative XP — recharts AreaChart works best on a left-to-right
  // ascending dataset. We map the per-day totals into a running sum.
  const xpSeries = useMemo(() => {
    const out: Array<{ date: string; total: number }> = []
    let running = 0
    for (const d of dailyXp) {
      running = running + d.xp
      out.push({ date: d.date.slice(5), total: running })
    }
    return out
  }, [dailyXp])

  // Problems + applications per week (Sunday-anchored buckets going
  // back ~10 weeks). We use the daily-log rollup counters rather than
  // walking prep_progress / prep_applications because they're already
  // there and reflect what landed during the day.
  const weeklySeries = useMemo(() => {
    const ordered = [...logs].sort((a, b) => a.logDate.localeCompare(b.logDate))
    const buckets = new Map<string, { week: string; problems: number; apps: number }>()
    for (const l of ordered) {
      const d = new Date(l.logDate + 'T00:00:00Z')
      const sunday = new Date(d)
      sunday.setUTCDate(d.getUTCDate() - d.getUTCDay())
      const wk = sunday.toISOString().slice(5, 10) // MM-DD label
      const b = buckets.get(wk) ?? { week: wk, problems: 0, apps: 0 }
      b.problems += l.problemsSolved
      b.apps += l.applicationsCount
      buckets.set(wk, b)
    }
    return Array.from(buckets.values()).slice(-10)
  }, [logs])

  // Mood trend — last 21 days where mood was recorded, ascending.
  const moodSeries = useMemo(() => {
    return [...logs]
      .sort((a, b) => a.logDate.localeCompare(b.logDate))
      .filter((l) => l.mood !== null)
      .slice(-21)
      .map((l) => ({ date: l.logDate.slice(5), mood: l.mood ?? 3 }))
  }, [logs])

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="XP over time">
        {xpSeries.length === 0 ? (
          <EmptyState text="XP shows up here as you bank work." />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={xpSeries} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <defs>
                <linearGradient id="xpFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-zinc-200 dark:stroke-zinc-800"
              />
              <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} width={28} />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 6,
                  border: '1px solid #d4d4d8',
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#xpFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Per-week output">
        {weeklySeries.length === 0 ? (
          <EmptyState text="Weeks fill in as you log problems and apps." />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklySeries} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-zinc-200 dark:stroke-zinc-800"
              />
              <XAxis dataKey="week" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} width={28} />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 6,
                  border: '1px solid #d4d4d8',
                }}
              />
              <Bar dataKey="problems" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="apps" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
        <p className="mt-2 flex gap-3 text-[10px] text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-violet-500" /> Problems
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-amber-500" /> Applications
          </span>
        </p>
      </ChartCard>

      <ChartCard title="Mood trend (last 21 logged days)" className="lg:col-span-2">
        {moodSeries.length === 0 ? (
          <EmptyState text="Log your mood in the journal to see the trend here." />
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={moodSeries} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-zinc-200 dark:stroke-zinc-800"
              />
              <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={20}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 6,
                  border: '1px solid #d4d4d8',
                }}
              />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="#ec4899"
                strokeWidth={2}
                dot={{ r: 3, fill: '#ec4899' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  )
}

function ChartCard({
  title,
  className,
  children,
}: {
  title: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <Card className={`border-zinc-200 dark:border-zinc-800 ${className ?? ''}`}>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">{text}</p>
}

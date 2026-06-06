'use client'

import { useMemo } from 'react'
import { Flame, Dumbbell, Code2, Send, Trophy, Heart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heatmap } from './Heatmap'
import { BadgeWall } from './BadgeWall'
import { BADGES, type Badge } from '@/lib/admin/prep/badges-data'
import type { DailyLog, BadgeRecord } from '@/lib/admin/prep/types'

type Stats = {
  studyStreak: number
  trainStreak: number
  longestStreak: number
  totalProblems: number
  totalResolves: number
  totalApplications: number
}

export function DashboardTab({
  logs,
  badges,
  stats,
}: {
  logs: DailyLog[]
  badges: BadgeRecord[]
  stats: Stats
}) {
  const unlockedIds = useMemo(() => new Set(badges.map((b) => b.badgeId)), [badges])

  const heatmapEntries = useMemo(
    () =>
      logs.map((l) => ({
        date: typeof l.logDate === 'string' ? l.logDate.slice(0, 10) : '',
        value:
          l.problemsSolved +
          (l.morningAnchorRead ? 1 : 0) +
          (l.trainedToday ? 1 : 0) +
          (l.applicationsCount > 0 ? 1 : 0),
      })),
    [logs]
  )

  const last7 = logs.slice(0, 7).reverse()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Flame} label="Study streak" value={`${stats.studyStreak}d`} />
        <Stat icon={Dumbbell} label="Gym streak" value={`${stats.trainStreak}d`} />
        <Stat icon={Code2} label="Problems" value={`${stats.totalProblems}`} />
        <Stat icon={Send} label="Applications" value={`${stats.totalApplications}`} />
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Heatmap entries={heatmapEntries} weeks={16} />
        </CardContent>
      </Card>

      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base">Last 7 days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 text-center text-[11px]">
            {last7.map((l) => (
              <div
                key={String(l.logDate)}
                className="rounded-md border border-zinc-200 p-2 dark:border-zinc-800"
              >
                <p className="font-medium text-zinc-500">{String(l.logDate).slice(5)}</p>
                <p className="mt-1 flex items-center justify-center gap-1 text-zinc-700 dark:text-zinc-300">
                  <Code2 className="h-3 w-3" /> {l.problemsSolved}
                </p>
                <p className="flex items-center justify-center gap-1 text-zinc-700 dark:text-zinc-300">
                  <Send className="h-3 w-3" /> {l.applicationsCount}
                </p>
                <p className="flex items-center justify-center gap-1 text-zinc-700 dark:text-zinc-300">
                  <Heart className="h-3 w-3" /> {l.mood ?? '—'}
                </p>
              </div>
            ))}
            {last7.length === 0 ? (
              <p className="col-span-7 py-6 text-zinc-500">No days logged yet.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4" /> Badges ({unlockedIds.size}/{BADGES.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BadgeWall badges={BADGES as Badge[]} unlockedIds={unlockedIds} variant="admin" />
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <Card className="border-zinc-200 dark:border-zinc-800">
      <CardContent className="flex items-center gap-3 py-4">
        <div className="rounded-md bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {label}
          </p>
          <p className="text-lg font-semibold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

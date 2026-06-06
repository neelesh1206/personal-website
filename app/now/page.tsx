import { Flame, Dumbbell, Code2, Send } from 'lucide-react'
import { BadgeWall } from '@/components/admin/coding-prep/dashboard/BadgeWall'
import { Heatmap } from '@/components/admin/coding-prep/dashboard/Heatmap'
import { Card, CardContent } from '@/components/ui/card'
import { getDailyLogs, getBadges, getSettings } from '@/lib/admin/prep/queries'
import { BADGES, computeBadgeContext } from '@/lib/admin/prep/badges'
import { planTotalTasks } from '@/lib/admin/prep/plan-helpers'
import planContent from '@/content/coding-prep-plan.json'
import type { Plan } from '@/lib/admin/prep/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Now — Neelesh Kakaraparthi',
  description: 'What I am currently grinding on.',
}

const PLAN = planContent as unknown as Plan

export default async function NowPage() {
  let logs: Awaited<ReturnType<typeof getDailyLogs>> = []
  let badges: Awaited<ReturnType<typeof getBadges>> = []
  let settings: Awaited<ReturnType<typeof getSettings>> = {}
  let ctx = {
    studyStreak: 0,
    trainStreak: 0,
    totalProblems: 0,
    totalResolves: 0,
    totalApplications: 0,
    fullPlanDaysCompleted: 0,
    ironDisciplineDays: 0,
    consecutiveAnchorDays: 0,
    daysWithNoDeviation: 0,
    planComplete: false,
    flashcardGrades: 0,
  }
  try {
    ;[logs, badges, settings] = await Promise.all([getDailyLogs(120), getBadges(), getSettings()])
    ctx = await computeBadgeContext(planTotalTasks(PLAN))
  } catch (err) {
    console.error('/now data load failed', err)
  }

  const unlockedIds = new Set(badges.map((b) => b.badgeId))
  const heatmapEntries = logs.map((l) => ({
    date: String(l.logDate).slice(0, 10),
    value:
      l.problemsSolved +
      (l.morningAnchorRead ? 1 : 0) +
      (l.trainedToday ? 1 : 0) +
      (l.applicationsCount > 0 ? 1 : 0),
  }))

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-10">
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
          What I’m doing now
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Currently grinding
        </h1>
        <p className="mt-3 max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
          A public, lightweight signal of what I’m training on. Streaks, badges, and consistency —
          updated every day by the actual work, not by typing about it.
        </p>
        {settings.evidence_line ? (
          <blockquote className="mt-4 border-l-2 border-amber-400 pl-3 text-sm italic text-zinc-700 dark:text-zinc-300">
            {settings.evidence_line}
          </blockquote>
        ) : null}
      </header>

      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Flame} label="Study streak" value={`${ctx.studyStreak}d`} />
        <Stat icon={Dumbbell} label="Gym streak" value={`${ctx.trainStreak}d`} />
        <Stat icon={Code2} label="Problems" value={`${ctx.totalProblems}`} />
        <Stat icon={Send} label="Applications" value={`${ctx.totalApplications}`} />
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Activity, last 16 weeks
        </h2>
        <Heatmap entries={heatmapEntries} weeks={16} />
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Badges earned ({unlockedIds.size})
        </h2>
        <BadgeWall badges={BADGES} unlockedIds={unlockedIds} variant="public" />
      </section>

      <footer className="border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        Inspired by{' '}
        <a
          href="https://nownownow.com/about"
          className="underline hover:text-zinc-900 dark:hover:text-zinc-200"
          target="_blank"
          rel="noopener noreferrer"
        >
          nownownow.com
        </a>
        . Streaks and badges are emitted by the work itself — no manual editing.
      </footer>
    </main>
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

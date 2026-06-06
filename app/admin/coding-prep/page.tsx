import { redirect } from 'next/navigation'
import { CodingPrepClient } from '@/components/admin/coding-prep/CodingPrepClient'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import {
  getCompletedTaskIds,
  getNotesByDay,
  getOrInitDailyLog,
  getTodayCompletedTaskIds,
  getSettings,
  getDailyLogs,
  getBadges,
  todayKey,
} from '@/lib/admin/prep/queries'
import { computeBadgeContext } from '@/lib/admin/prep/badges'
import { refreshBadges } from '@/lib/admin/prep/refresh-badges'
import { resolveDailyQuote } from '@/lib/admin/prep/resolve-daily-quote'
import type { BadgeRecord, DailyLog, Library, Plan, Routine } from '@/lib/admin/prep/types'
import planJson from '@/content/coding-prep-plan.json'
import libraryJson from '@/content/coding-prep-library.json'
import routineJson from '@/content/coding-prep-routine.json'

export const dynamic = 'force-dynamic'

function serializeLog(l: Awaited<ReturnType<typeof getOrInitDailyLog>>): DailyLog {
  return {
    logDate: String(l.logDate).slice(0, 10),
    morningAnchorRead: l.morningAnchorRead,
    trainedToday: l.trainedToday,
    readAloud: l.readAloud,
    rewardEarned: l.rewardEarned,
    rewardStartedAt: l.rewardStartedAt ? l.rewardStartedAt.toISOString() : null,
    applicationsCount: l.applicationsCount,
    problemsSolved: l.problemsSolved,
    mood: l.mood ?? null,
    journalFinished: l.journalFinished,
    journalAvoided: l.journalAvoided,
    journalWin: l.journalWin,
    journalDeviation: l.journalDeviation,
    noDeviation: l.noDeviation,
  }
}

export default async function CodingPrepPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin/login')

  const today = todayKey()

  const [completed, notesByDay, todayLog, todayTaskIds, settings, logs, badgesRaw] =
    await Promise.all([
      getCompletedTaskIds(),
      getNotesByDay(),
      getOrInitDailyLog(today),
      getTodayCompletedTaskIds(today),
      getSettings(),
      getDailyLogs(120),
      getBadges(),
    ])

  await refreshBadges()
  const badges = await getBadges()

  const plan = planJson as unknown as Plan
  const library = libraryJson as unknown as Library
  const routine = routineJson as unknown as Routine

  const planTotalTasks = plan.days.reduce(
    (s, d) => s + d.coding.tasks.length + d.systemDesign.tasks.length + d.wrapup.length,
    0
  )
  const ctx = await computeBadgeContext(planTotalTasks)

  // Daily quote — AI-picks from a theme-matched candidate pool when an
  // HF key is configured, otherwise a deterministic date-hash pick.
  // resolveDailyQuote handles cache + fallback + persist; returns the
  // chosen Quote object plus the AI-generated one-sentence connector.
  const dayNumForQuote = settings.plan_start_date
    ? Math.floor(
        (Date.UTC(
          Number.parseInt(today.slice(0, 4), 10),
          Number.parseInt(today.slice(5, 7), 10) - 1,
          Number.parseInt(today.slice(8, 10), 10)
        ) -
          new Date(settings.plan_start_date).setUTCHours(0, 0, 0, 0)) /
          (24 * 3600 * 1000)
      ) + 1
    : null
  const planDayForQuote = dayNumForQuote
    ? (plan.days.find((d) => d.day === dayNumForQuote) ?? null)
    : null
  const resolvedQuote = await resolveDailyQuote({
    todayKey: today,
    todayLog,
    planDayLabel: planDayForQuote ? `Day ${planDayForQuote.day}: ${planDayForQuote.title}` : null,
    planDayTheme: planDayForQuote?.title,
    studyStreak: ctx.studyStreak,
    gymStreak: ctx.trainStreak,
  })

  const serialBadges: BadgeRecord[] = badges.map((b) => ({
    badgeId: b.badgeId,
    unlockedAt: b.unlockedAt.toISOString(),
  }))

  // suppress unused warning while keeping the explicit pre-refresh fetch above
  void badgesRaw

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
          Admin · Daily driver
        </p>
        <h1
          style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
          className="mt-2 text-4xl leading-tight text-zinc-900 sm:text-5xl dark:text-zinc-50"
        >
          Coding &amp; System Design Prep
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          {plan.meta.subtitle}
        </p>
      </header>

      <CodingPrepClient
        plan={plan}
        library={library}
        routine={routine}
        quote={resolvedQuote.quote}
        quoteReflection={resolvedQuote.reflection}
        initialCompleted={Array.from(completed)}
        initialNotes={notesByDay}
        todayKey={today}
        initialLog={serializeLog(todayLog)}
        initialTodayTaskIds={Array.from(todayTaskIds)}
        initialSettings={settings}
        initialLogs={logs.map(serializeLog)}
        initialBadges={serialBadges}
        initialStats={{
          studyStreak: ctx.studyStreak,
          trainStreak: ctx.trainStreak,
          longestStreak: Math.max(ctx.studyStreak, ctx.trainStreak),
          totalProblems: ctx.totalProblems,
          totalResolves: ctx.totalResolves,
          totalApplications: ctx.totalApplications,
        }}
      />
    </main>
  )
}

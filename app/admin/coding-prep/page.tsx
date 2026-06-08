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
  getTotalXp,
  getDailyXpTotals,
  todayKey,
} from '@/lib/admin/prep/queries'
import { computeBadgeContext } from '@/lib/admin/prep/badges'
import { refreshBadges } from '@/lib/admin/prep/refresh-badges'
import { resolveDailyQuote } from '@/lib/admin/prep/resolve-daily-quote'
import { slideCurrentPlanDay, pickLoadMode, buildLoadProfile } from '@/lib/admin/prep/plan-adjust'
import { planDaysWithAllItemsCompleted, planTotalTasks } from '@/lib/admin/prep/plan-helpers'
import { completionFromLog } from '@/lib/admin/prep/day-completion'
import { patchDailyLog } from '@/lib/admin/prep/queries'
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
    loadMode: (l.loadMode as DailyLog['loadMode']) ?? 'full',
    adjustedByAi: l.adjustedByAi ?? false,
    currentPlanDay: l.currentPlanDay ?? null,
  }
}

export default async function CodingPrepPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin/login')

  const today = todayKey()

  const [
    completed,
    notesByDay,
    todayLog,
    todayTaskIds,
    settings,
    logs,
    badgesRaw,
    totalXp,
    dailyXp,
  ] = await Promise.all([
    getCompletedTaskIds(),
    getNotesByDay(),
    getOrInitDailyLog(today),
    getTodayCompletedTaskIds(today),
    getSettings(),
    getDailyLogs(120),
    getBadges(),
    getTotalXp(),
    getDailyXpTotals(120),
  ])

  await refreshBadges()
  const badges = await getBadges()

  const plan = planJson as unknown as Plan
  const library = libraryJson as unknown as Library
  const routine = routineJson as unknown as Routine

  const ctx = await computeBadgeContext(planTotalTasks(plan))

  // Plan-day slide + load mode.
  //   slideCurrentPlanDay: the lowest day whose plan-task checkboxes
  //   aren't all ticked (the day "slides" — calendar moves forward,
  //   plan content stays anchored to the earliest unfinished day).
  //   "Completed" here is driven by prep_progress checkboxes (the
  //   visible action the user performs), not by daily-log counters.
  //   pickLoadMode: based on yesterday's daily-log completion, decide
  //   if today loads at full / core / re-entry. Discipline metrics
  //   (streaks, XP, badges) are NEVER consulted here.
  const completedPlanDays = planDaysWithAllItemsCompleted(plan, completed)
  const slide = slideCurrentPlanDay({
    planStartDate: settings.plan_start_date,
    todayKey: today,
    completedDays: completedPlanDays,
    totalDays: plan.days.length,
  })
  const yesterdayKey = (() => {
    const d = new Date(
      Date.UTC(
        Number.parseInt(today.slice(0, 4), 10),
        Number.parseInt(today.slice(5, 7), 10) - 1,
        Number.parseInt(today.slice(8, 10), 10)
      )
    )
    d.setUTCDate(d.getUTCDate() - 1)
    return d.toISOString().slice(0, 10)
  })()
  const yesterdayLogRow = logs.find((l) => String(l.logDate).slice(0, 10) === yesterdayKey) ?? null
  const yesterdayCompletion = yesterdayLogRow ? completionFromLog(yesterdayLogRow) : null
  const loadMode = pickLoadMode({
    yesterday: yesterdayCompletion,
    isMaintenance: slide.isMaintenance,
    manualOverride: undefined,
  })
  const loadProfile = buildLoadProfile(loadMode)

  // Persist current_plan_day + load_mode onto today's row so the cron
  // and the email summary can read them later in the day.
  if (todayLog.currentPlanDay !== slide.planDay || todayLog.loadMode !== loadMode) {
    await patchDailyLog(today, {
      currentPlanDay: slide.planDay,
      loadMode,
    })
    todayLog.currentPlanDay = slide.planDay
    todayLog.loadMode = loadMode
  }

  // Daily quote — AI-picks from a theme-matched candidate pool when an
  // HF key is configured, otherwise a deterministic date-hash pick.
  // resolveDailyQuote handles cache + fallback + persist; returns the
  // chosen Quote object plus the AI-generated one-sentence connector.
  // Use the slid plan day for the quote (so a day that's "carrying
  // forward" still gets a theme-matched quote anchored to the actual
  // content the user is working on, not the calendar day they're on).
  const planDayForQuote = slide.planDay
    ? (plan.days.find((d) => d.day === slide.planDay) ?? null)
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
        initialTotalXp={totalXp}
        slidePlanDay={slide.planDay}
        isMaintenance={slide.isMaintenance}
        loadProfile={loadProfile}
        initialDailyXp={dailyXp}
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

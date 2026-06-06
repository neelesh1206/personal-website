import 'server-only'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  prepBadges,
  prepDailyLog,
  prepProgress,
  prepResolves,
  prepApplications,
  type PrepDailyLogRow,
} from '@/lib/db/schema'

export { BADGES, BADGE_INDEX, type Badge } from './badges-data'

type EvalContext = {
  studyStreak: number
  trainStreak: number
  totalProblems: number
  totalResolves: number
  totalApplications: number
  fullPlanDaysCompleted: number
  ironDisciplineDays: number
  consecutiveAnchorDays: number
  daysWithNoDeviation: number
  planComplete: boolean
}

/**
 * Returns the set of badge ids that should be unlocked given the current context.
 * Caller diffs against already-unlocked and writes the new ones.
 */
export function evaluateBadges(ctx: EvalContext): string[] {
  const out: string[] = []
  if (ctx.totalProblems >= 1) out.push('first-blood')
  if (ctx.studyStreak >= 3) out.push('streak-x3')
  if (ctx.studyStreak >= 7) out.push('streak-x7')
  if (ctx.studyStreak >= 14) out.push('streak-x14')
  if (ctx.ironDisciplineDays >= 5) out.push('iron-discipline')
  if (ctx.daysWithNoDeviation >= 1) out.push('cold-turkey')
  if (ctx.totalApplications >= 10) out.push('application-machine-10')
  if (ctx.totalApplications >= 25) out.push('application-machine-25')
  if (ctx.totalApplications >= 50) out.push('application-machine-50')
  if (ctx.fullPlanDaysCompleted >= 5) out.push('pattern-master')
  if (ctx.totalResolves >= 10) out.push('the-resolver')
  if (ctx.consecutiveAnchorDays >= 7) out.push('showed-up')
  if (ctx.planComplete) out.push('finisher')
  return out
}

export async function getAlreadyUnlockedBadges(): Promise<Set<string>> {
  const rows = await db.select({ id: prepBadges.badgeId }).from(prepBadges)
  return new Set(rows.map((r) => r.id))
}

export async function unlockBadges(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  await db
    .insert(prepBadges)
    .values(ids.map((id) => ({ badgeId: id })))
    .onConflictDoNothing({ target: prepBadges.badgeId })
}

/**
 * Cheap rollup of stats used by badge evaluation + dashboard.
 */
export async function computeBadgeContext(planTotalTasks: number): Promise<EvalContext> {
  const [problemsRow] = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(prepProgress)
    .where(sql`task_id LIKE 'd%-c-%'`)
  const totalProblems = problemsRow?.n ?? 0

  const [resolvesRow] = await db.select({ n: sql<number>`COUNT(*)::int` }).from(prepResolves)
  const totalResolves = resolvesRow?.n ?? 0

  const [appsRow] = await db.select({ n: sql<number>`COUNT(*)::int` }).from(prepApplications)
  const totalApplications = appsRow?.n ?? 0

  // Daily log rows in descending date order, for streak walks.
  const logs = await db
    .select()
    .from(prepDailyLog)
    .orderBy(sql`log_date DESC`)
  const studyStreak = walkStreak(logs, (l) => dayIsStudyDay(l))
  const trainStreak = walkStreak(logs, (l) => l.trainedToday)
  const consecutiveAnchorDays = walkStreak(logs, (l) => l.morningAnchorRead)
  const ironDisciplineDays = logs.filter((l) => l.trainedToday && dayIsStudyDay(l)).length
  const daysWithNoDeviation = logs.filter((l) => l.noDeviation && dayIsStudyDay(l)).length

  // Plan-day completion — TIGHTENED. Pattern Master used to fire on a
  // heuristic (≥ floor(total/10) prefix-matching tasks per day). Now
  // we require every coding-task id of that plan day to be present in
  // prep_progress. See `fullPlanDaysCompleted` in plan-adjust.ts for
  // the literal check; this stats path keeps the heuristic only as a
  // fallback. The badges route now passes the exact plan + completed
  // set in (see refresh-badges.ts).
  const completedRows = await db.select({ taskId: prepProgress.taskId }).from(prepProgress)
  const byDay: Record<string, number> = {}
  for (const r of completedRows) {
    const m = r.taskId.match(/^d(\d+)-/)
    if (!m) continue
    const dayKey = m[1]!
    byDay[dayKey] = (byDay[dayKey] ?? 0) + 1
  }
  const perDayTarget = Math.max(1, Math.floor(planTotalTasks / 10))
  const fullPlanDaysCompleted = Object.values(byDay).filter((n) => n >= perDayTarget).length
  const planComplete = fullPlanDaysCompleted >= 10

  return {
    studyStreak,
    trainStreak,
    totalProblems,
    totalResolves,
    totalApplications,
    fullPlanDaysCompleted,
    ironDisciplineDays,
    consecutiveAnchorDays,
    daysWithNoDeviation,
    planComplete,
  }
}

function dayIsStudyDay(l: PrepDailyLogRow): boolean {
  // "Study day" = at least one coding task completed OR journal was filled
  // OR morning anchor read. Generous on purpose — counting shows-up days.
  return (
    l.problemsSolved > 0 ||
    l.morningAnchorRead ||
    l.journalFinished.trim().length > 0 ||
    l.journalWin.trim().length > 0
  )
}

/**
 * Walk consecutive days backwards from "today" given DESC-sorted rows.
 * Today missing = streak starts from yesterday (grace period).
 */
function walkStreak(rows: PrepDailyLogRow[], predicate: (l: PrepDailyLogRow) => boolean): number {
  if (rows.length === 0) return 0
  const byDate = new Map<string, PrepDailyLogRow>()
  for (const r of rows) byDate.set(formatDate(r.logDate as unknown as string | Date), r)

  let streak = 0
  const cursor = new Date()
  cursor.setUTCHours(0, 0, 0, 0)

  let allowMissingToday = true
  for (;;) {
    const key = formatDate(cursor)
    const r = byDate.get(key)
    if (!r) {
      if (allowMissingToday) {
        allowMissingToday = false
        cursor.setUTCDate(cursor.getUTCDate() - 1)
        continue
      }
      break
    }
    allowMissingToday = false
    if (!predicate(r)) break
    streak += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return streak
}

function formatDate(d: string | Date): string {
  if (typeof d === 'string') return d.slice(0, 10)
  return d.toISOString().slice(0, 10)
}

import 'server-only'
import type { PrepDailyLogRow } from '@/lib/db/schema'
import { CORE_REQUIREMENTS, type DayCompletion } from './plan-adjust'

/**
 * Turn a prep_daily_log row into the boolean shape plan-adjust.ts
 * understands. "Fully completed" is the strictest test — used to count
 * full plan days for the slide.
 */
export function completionFromLog(row: PrepDailyLogRow): DayCompletion {
  const date = typeof row.logDate === 'string' ? row.logDate.slice(0, 10) : ''
  const problems = row.problemsSolved
  const apps = row.applicationsCount
  const anchor = row.morningAnchorRead
  const coreCompleted =
    problems >= CORE_REQUIREMENTS.problemsForCoreCore &&
    apps >= CORE_REQUIREMENTS.applicationsForCoreCore
  const fullyCompleted =
    problems >= CORE_REQUIREMENTS.problemsForCoreFull &&
    apps >= CORE_REQUIREMENTS.applicationsForCoreFull &&
    anchor
  return {
    date,
    solvedProblems: problems > 0,
    loggedApplication: apps > 0,
    anchorRead: anchor,
    coreCompleted,
    fullyCompleted,
  }
}

export function buildCompletedPlanDays(args: {
  planStartDate: string | undefined
  logs: PrepDailyLogRow[]
  totalDays: number
}): Set<number> {
  const { planStartDate, logs, totalDays } = args
  const completed = new Set<number>()
  if (!planStartDate) return completed
  const start = Date.UTC(
    Number.parseInt(planStartDate.slice(0, 4), 10),
    Number.parseInt(planStartDate.slice(5, 7), 10) - 1,
    Number.parseInt(planStartDate.slice(8, 10), 10)
  )
  for (const row of logs) {
    const c = completionFromLog(row)
    if (!c.fullyCompleted) continue
    const date = Date.UTC(
      Number.parseInt(c.date.slice(0, 4), 10),
      Number.parseInt(c.date.slice(5, 7), 10) - 1,
      Number.parseInt(c.date.slice(8, 10), 10)
    )
    const dayNum = Math.floor((date - start) / (24 * 3600 * 1000)) + 1
    if (dayNum >= 1 && dayNum <= totalDays) completed.add(dayNum)
  }
  return completed
}

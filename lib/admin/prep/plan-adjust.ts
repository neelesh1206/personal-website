/**
 * Plan adjustment — load + tone only, never the curriculum, never the
 * scoreboard.
 *
 * Two responsibilities:
 *
 *   1. `slideCurrentPlanDay()` — the calendar moves but the curriculum
 *      doesn't. The "current plan day" is the lowest day not fully
 *      completed. If you miss calendar Tuesday, Wednesday still shows
 *      Day 2 content with a "carrying forward" chip. After Day 10,
 *      the plan transitions to maintenance.
 *
 *   2. `pickLoadMode()` — based ONLY on whether yesterday was
 *      completed, decide whether today loads at full intensity, core
 *      tasks only, or a soft re-entry. This drives what's *asked* of
 *      the user today. It must never change XP awards, streaks, or
 *      badges — those are tied to actual completion, not to load.
 *
 * Pure functions. No DB. Tested.
 */

import type { Plan } from './types'
import { codingItems } from './plan-helpers'

export type LoadMode = 'full' | 'core' | 're-entry' | 'maintenance'

export type DayCompletion = {
  /** Date in YYYY-MM-DD. */
  date: string
  /** Did the user solve at least one problem? */
  solvedProblems: boolean
  /** Did the user log at least one application? */
  loggedApplication: boolean
  /** Was the morning anchor read? */
  anchorRead: boolean
  /** Were both coding + applications cleared? */
  coreCompleted: boolean
  /** Was the full day completed (all required blocks)? */
  fullyCompleted: boolean
}

export const CORE_REQUIREMENTS = {
  /** Problems to count as "coding block done" at full load. */
  problemsForCoreFull: 2,
  problemsForCoreCore: 1,
  /** Applications to count as "applications block done." */
  applicationsForCoreFull: 3,
  applicationsForCoreCore: 1,
} as const

/**
 * Compute the currently-anchored plan day. Slides forward only after a
 * plan day is fully completed; otherwise the same plan day stays
 * "current" until done. Caps at totalDays + 1 (post-program).
 */
export function slideCurrentPlanDay(args: {
  planStartDate: string | undefined
  todayKey: string
  completedDays: Set<number>
  totalDays: number
}): { planDay: number | null; isMaintenance: boolean } {
  const { planStartDate, todayKey, completedDays, totalDays } = args
  if (!planStartDate) return { planDay: null, isMaintenance: false }

  const start = Date.UTC(
    Number.parseInt(planStartDate.slice(0, 4), 10),
    Number.parseInt(planStartDate.slice(5, 7), 10) - 1,
    Number.parseInt(planStartDate.slice(8, 10), 10)
  )
  const today = Date.UTC(
    Number.parseInt(todayKey.slice(0, 4), 10),
    Number.parseInt(todayKey.slice(5, 7), 10) - 1,
    Number.parseInt(todayKey.slice(8, 10), 10)
  )
  const dayByCalendar = Math.floor((today - start) / (24 * 3600 * 1000)) + 1
  if (dayByCalendar < 1) return { planDay: 1, isMaintenance: false }

  // The "slid" plan day = the lowest day in [1..totalDays] that isn't
  // already in completedDays, but never less than calendar day - some
  // margin. We slide BACKWARDS to "the earliest unfinished day," which
  // is the right behavior: if you missed Day 2, today still shows Day 2.
  for (let d = 1; d <= Math.min(dayByCalendar, totalDays); d++) {
    if (!completedDays.has(d)) {
      return { planDay: d, isMaintenance: false }
    }
  }
  // All days through calendar-today are complete. Are we past Day 10?
  if (dayByCalendar > totalDays) return { planDay: null, isMaintenance: true }
  // Calendar hasn't moved past current; default to the calendar day.
  return { planDay: dayByCalendar, isMaintenance: false }
}

/**
 * Pick today's load mode from yesterday's completion record alone.
 * Post-Day-10 → maintenance regardless. The discipline scoreboard is
 * never consulted here — load is independent of streak / XP / badges.
 */
export function pickLoadMode(args: {
  yesterday: DayCompletion | null
  isMaintenance: boolean
  manualOverride?: LoadMode
}): LoadMode {
  if (args.manualOverride) return args.manualOverride
  if (args.isMaintenance) return 'maintenance'
  if (!args.yesterday) return 'full' // first day or no data — start strong
  if (args.yesterday.fullyCompleted) return 'full'
  if (args.yesterday.coreCompleted) return 'core'
  return 're-entry'
}

/**
 * What does today look like under the chosen load mode? Returns the
 * concrete numbers the UI / hero / Pomodoro block should respect.
 */
export type LoadProfile = {
  mode: LoadMode
  sprints: number
  appTarget: number
  /** Whether the system-design block is shown at full visibility or
   *  collapsed under a "stretch when ready" expander. */
  systemDesign: 'full' | 'collapsed' | 'hidden'
  /** Calm + inviting copy line for the hero. Never shames a miss. */
  toneLine: string
}

export function buildLoadProfile(mode: LoadMode): LoadProfile {
  switch (mode) {
    case 'full':
      return {
        mode,
        sprints: 2,
        appTarget: 3,
        systemDesign: 'full',
        toneLine: 'Full load today — two sprints, three applications, full design block.',
      }
    case 'core':
      return {
        mode,
        sprints: 1,
        appTarget: 1,
        systemDesign: 'full',
        toneLine: 'Light load today. Hit one sprint and one application. Design stays in.',
      }
    case 're-entry':
      return {
        mode,
        sprints: 1,
        appTarget: 1,
        systemDesign: 'collapsed',
        toneLine:
          'Soft on-ramp. Open the routine. One sprint, one application — that’s the win today.',
      }
    case 'maintenance':
      return {
        mode,
        sprints: 1,
        appTarget: 1,
        systemDesign: 'collapsed',
        toneLine:
          'Maintenance mode — keep the structure, pick a shaky pattern, ship one application.',
      }
  }
}

/**
 * Compute how many of yesterday's days are "missed" — used by the
 * encouragement line in the HF re-plan call. Walks back from `todayKey`
 * collecting consecutive days where the daily log shows no real work
 * (no problems, no applications, no anchor).
 */
export function countConsecutiveMissedDays(
  todayKey: string,
  recent: DayCompletion[],
  maxLookback = 14
): number {
  const byDate = new Map(recent.map((d) => [d.date, d]))
  const cursor = new Date(
    Date.UTC(
      Number.parseInt(todayKey.slice(0, 4), 10),
      Number.parseInt(todayKey.slice(5, 7), 10) - 1,
      Number.parseInt(todayKey.slice(8, 10), 10)
    )
  )
  cursor.setUTCDate(cursor.getUTCDate() - 1)
  let missed = 0
  for (let i = 0; i < maxLookback; i++) {
    const key = cursor.toISOString().slice(0, 10)
    const day = byDate.get(key)
    const counts = !day || (!day.solvedProblems && !day.loggedApplication && !day.anchorRead)
    if (!counts) break
    missed += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return missed
}

/**
 * "Coding completion" check for the Pattern Master badge — tightened
 * from a heuristic to a literal: every task id in plan.days[K].coding
 * must be in `completedTaskIds`. Returns the count of plan days for
 * which this is true.
 */
export function fullPlanDaysCompleted(plan: Plan, completedTaskIds: Set<string>): number {
  let n = 0
  for (const d of plan.days) {
    const ids = codingItems(d).map((t) => t.id)
    if (ids.length === 0) continue
    if (ids.every((id) => completedTaskIds.has(id))) n += 1
  }
  return n
}

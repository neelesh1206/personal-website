/**
 * Pure derivations from the new block-based PlanDay shape. The rest of
 * the codebase used to read `d.coding.tasks`, `d.systemDesign.topic`,
 * etc.; this module is the bridge from the new generic blocks to those
 * surfaces so the rest of the app doesn't need to know about the
 * block-type enum at every call site.
 */

import type { Plan, PlanBlock, PlanDay, PlanTask } from './types'

/**
 * Educative-coding + NeetCode-reps blocks. These are the "is this a
 * coding rep?" surfaces — XP grant, re-solve toggle, Pattern Master
 * eligibility all key off this set.
 */
export function codingBlocks(day: PlanDay): PlanBlock[] {
  return day.blocks.filter((b) => b.type === 'educative-coding' || b.type === 'neetcode-reps')
}

export function codingItems(day: PlanDay): PlanTask[] {
  return codingBlocks(day).flatMap((b) => b.items)
}

export function sysDesignBlocks(day: PlanDay): PlanBlock[] {
  return day.blocks.filter((b) => b.type === 'educative-sysdesign')
}

export function sysDesignItems(day: PlanDay): PlanTask[] {
  return sysDesignBlocks(day).flatMap((b) => b.items)
}

export function wrapupItems(day: PlanDay): PlanTask[] {
  return day.blocks.filter((b) => b.type === 'wrapup').flatMap((b) => b.items)
}

export function allItems(day: PlanDay): PlanTask[] {
  return day.blocks.flatMap((b) => b.items)
}

export function planTotalTasks(plan: Plan): number {
  return plan.days.reduce((sum, d) => sum + allItems(d).length, 0)
}

/**
 * Which plan days are *fully checked off* in prep_progress (i.e. every
 * item across every block — coding, system design, neetcode-reps, and
 * wrapup — is present in the completed set).
 *
 * This is the canonical signal for the plan-day slide. A day's tasks
 * are the explicit user-facing checkboxes on the 15-Day Plan tab;
 * ticking them is the act that should advance the slide. The daily-log
 * counters (problemsSolved / applicationsCount / anchorRead) drive
 * streaks + load mode independently — they are not the slide signal.
 */
export function planDaysWithAllItemsCompleted(
  plan: Plan,
  completedTaskIds: Set<string>
): Set<number> {
  const done = new Set<number>()
  for (const d of plan.days) {
    const ids = allItems(d).map((t) => t.id)
    if (ids.length === 0) continue
    if (ids.every((id) => completedTaskIds.has(id))) done.add(d.day)
  }
  return done
}

/**
 * Top-line "what pattern is today about" — the day's title is already
 * the pattern (e.g. "Two Pointers", "Tree DFS"), so we use that
 * verbatim. The first coding block's title is the long form (e.g.
 * "Grokking · Two Pointers") and reads better in cron prose.
 */
export function todaysCodingPattern(day: PlanDay): string {
  const first = codingBlocks(day)[0]
  return first?.title ?? day.title
}

/** First system-design block's title; falls back to day title. */
export function todaysSysDesignTopic(day: PlanDay): string {
  const first = sysDesignBlocks(day)[0]
  return first?.title ?? `${day.title} — design slot`
}

/** Concatenated short summary of system-design items for the anchor field. */
export function todaysSysDesignAnchor(day: PlanDay): string {
  const items = sysDesignItems(day)
  if (items.length === 0) return ''
  return items.map((i) => i.label).join(' · ')
}

/** Convenience: regex shared by ChecklistItem + the XP-grant route. */
export const CODING_TASK_ID_RE = /^d\d+-c\d/

/** Is a raw task id a coding rep? Used server-side where we only have the id. */
export function isCodingTaskId(taskId: string): boolean {
  return CODING_TASK_ID_RE.test(taskId)
}

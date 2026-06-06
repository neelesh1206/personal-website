import 'server-only'
import {
  evaluateBadges,
  getAlreadyUnlockedBadges,
  computeBadgeContext,
  unlockBadges,
  BADGE_INDEX,
} from './badges'
import { fullPlanDaysCompleted } from './plan-adjust'
import { getCompletedTaskIds } from './queries'
import planContent from '@/content/coding-prep-plan.json'
import type { Plan } from './types'

type PlanFile = {
  days: Array<{
    coding: { tasks: Array<{ id: string }> }
    systemDesign: { tasks: Array<{ id: string }> }
    wrapup: Array<{ id: string }>
  }>
}

function getPlanTotalTasks(): number {
  const plan = planContent as unknown as PlanFile
  return plan.days.reduce(
    (sum, d) => sum + d.coding.tasks.length + d.systemDesign.tasks.length + d.wrapup.length,
    0
  )
}

/**
 * Recompute eligibility and unlock any newly earned badges.
 * Returns the badge ids that were newly unlocked this call.
 */
export async function refreshBadges(): Promise<string[]> {
  try {
    const ctx = await computeBadgeContext(getPlanTotalTasks())
    // Pattern Master tighten — replace the heuristic count with the
    // literal "every coding task of this plan day is completed" count.
    const completed = await getCompletedTaskIds()
    const literal = fullPlanDaysCompleted(planContent as unknown as Plan, completed)
    ctx.fullPlanDaysCompleted = literal
    ctx.planComplete = literal >= 10
    const eligible = evaluateBadges(ctx)
    const already = await getAlreadyUnlockedBadges()
    const fresh = eligible.filter((id) => !already.has(id) && BADGE_INDEX[id])
    if (fresh.length > 0) await unlockBadges(fresh)
    return fresh
  } catch (err) {
    console.error('refreshBadges failed:', err)
    return []
  }
}

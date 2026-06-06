import 'server-only'
import {
  evaluateBadges,
  getAlreadyUnlockedBadges,
  computeBadgeContext,
  unlockBadges,
  BADGE_INDEX,
} from './badges'
import { fullPlanDaysCompleted } from './plan-adjust'
import { planTotalTasks } from './plan-helpers'
import { getCompletedTaskIds } from './queries'
import planContent from '@/content/coding-prep-plan.json'
import type { Plan } from './types'

const PLAN_TOTAL_DAYS = (planContent as unknown as Plan).days.length

/**
 * Recompute eligibility and unlock any newly earned badges.
 * Returns the badge ids that were newly unlocked this call.
 */
export async function refreshBadges(): Promise<string[]> {
  try {
    const plan = planContent as unknown as Plan
    const ctx = await computeBadgeContext(planTotalTasks(plan))
    // Pattern Master tighten — replace the heuristic count with the
    // literal "every coding task of this plan day is completed" count.
    const completed = await getCompletedTaskIds()
    const literal = fullPlanDaysCompleted(plan, completed)
    ctx.fullPlanDaysCompleted = literal
    ctx.planComplete = literal >= PLAN_TOTAL_DAYS
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

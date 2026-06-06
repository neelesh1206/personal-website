/**
 * Day grading + per-tier tone + per-block emojis for the daily summary
 * email and Slack message.
 *
 * Pure. Tested. Tiers honor the governing principle: even the lowest
 * tier (Reset) reads as warm and forward-looking — no shame language,
 * no "you missed yesterday," no participation credit either. The point
 * of the scoreboard is that it's honest; the point of the tone is that
 * it never punishes.
 */

export type DayTier = 'triumph' | 'solid' | 'steady' | 'quiet' | 'reset'

export type DayGradeInput = {
  rewardEarned: boolean
  studyStreak: number
  problemsSolved: number
  applicationsCount: number
  morningAnchorRead: boolean
  trainedToday: boolean
  readAloud: boolean
  newlyUnlockedCount: number
}

export type DayGrade = {
  tier: DayTier
  subjectPrefix: string
  headerEmoji: string
  openingLine: string
}

const TIER_COPY: Record<DayTier, Omit<DayGrade, 'tier'>> = {
  triumph: {
    subjectPrefix: '🔥 Day stacked',
    headerEmoji: '🏆',
    openingLine: 'Stacked day. That’s the rep.',
  },
  solid: {
    subjectPrefix: '🟢 Solid day',
    headerEmoji: '🎯',
    openingLine: 'Both core blocks closed. Banked.',
  },
  steady: {
    subjectPrefix: '🪨 Held the chain',
    headerEmoji: '🌅',
    openingLine: 'The chain held. Tomorrow stacks on this.',
  },
  quiet: {
    subjectPrefix: '🌱 Showed up',
    headerEmoji: '🌱',
    openingLine: 'Showed up. That counts more than people think.',
  },
  reset: {
    subjectPrefix: 'Fresh page',
    headerEmoji: '🌅',
    openingLine: 'New page. No baggage. Open the routine and start with the anchor.',
  },
}

export function gradeDay(input: DayGradeInput): DayGrade {
  const tier = pickTier(input)
  return { tier, ...TIER_COPY[tier] }
}

function pickTier(i: DayGradeInput): DayTier {
  const noWork =
    !i.morningAnchorRead &&
    !i.trainedToday &&
    !i.readAloud &&
    i.problemsSolved === 0 &&
    i.applicationsCount === 0
  if (noWork) return 'reset'

  const coreDone = i.problemsSolved >= 2 && i.applicationsCount >= 3
  if (i.rewardEarned && coreDone && i.studyStreak >= 3) return 'triumph'
  if (coreDone) return 'solid'

  const heldChain = i.morningAnchorRead && (i.problemsSolved > 0 || i.applicationsCount > 0)
  if (heldChain) return 'steady'
  return 'quiet'
}

export type CompletionLine = { emoji: string; label: string }

/**
 * Compose the per-block "Done today" bullet list with one emoji per
 * line. Empty if nothing was completed; caller can render an em-dash
 * fallback.
 */
export function buildCompletionLines(input: {
  morningAnchorRead: boolean
  problemsSolved: number
  systemDesignDone?: boolean
  trainedToday: boolean
  readAloud: boolean
  applicationsCount: number
  rewardEarned: boolean
  newlyUnlocked: string[]
}): CompletionLine[] {
  const out: CompletionLine[] = []
  if (input.morningAnchorRead) out.push({ emoji: '🌅', label: 'Morning anchor' })
  if (input.problemsSolved > 0)
    out.push({ emoji: '🧠', label: `Coding (${input.problemsSolved} solved)` })
  if (input.systemDesignDone) out.push({ emoji: '🏗️', label: 'System design' })
  if (input.applicationsCount > 0)
    out.push({ emoji: '📨', label: `${input.applicationsCount} applications` })
  if (input.trainedToday) out.push({ emoji: '🏋️', label: 'CrossFit' })
  if (input.readAloud) out.push({ emoji: '📖', label: 'Read aloud' })
  if (input.rewardEarned) out.push({ emoji: '🎁', label: 'Reward earned' })
  if (input.newlyUnlocked.length > 0)
    out.push({ emoji: '🎖️', label: `Badges: ${input.newlyUnlocked.join(', ')}` })
  return out
}

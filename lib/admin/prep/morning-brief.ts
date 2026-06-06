/**
 * Morning brief composition — pure functions only. Tested.
 *
 * The morning cron fires before any user interaction, so it can't rely
 * on the Today page having computed/persisted current_plan_day or
 * load_mode. We pass the slid plan day + load profile in from the
 * route, which computes them itself the same way page.tsx does.
 *
 * Tone rules (mirrors day-grade.ts / plan-adjust.ts):
 *   - Re-entry and maintenance days get warm, forward-looking copy.
 *   - Never reference a missed day or a broken streak. The scoreboard
 *     stays elsewhere; this brief is about today's load.
 */

import type { LoadMode, LoadProfile } from './plan-adjust'

export type MorningBriefInput = {
  date: string
  planDayNum: number | null
  planDayTitle: string | null
  isMaintenance: boolean
  isCarryingForward: boolean
  loadProfile: LoadProfile
  codingPattern: string | null
  codingTaskCount: number
  systemDesignTopic: string | null
  systemDesignAnchor: string | null
  /** Yesterday's "avoided" journal — used to compose a forward-looking edge,
   *  never to assign blame. Falsy = skip the edge line. */
  yesterdayAvoided?: string
}

export type MorningBrief = {
  subjectPrefix: string
  headerEmoji: string
  openingLine: string
  todayLabel: string
  focusLines: Array<{ emoji: string; label: string; detail?: string }>
  /** Optional one-sentence "edge today" — calm, forward-looking. */
  edgeLine: string | null
}

const TIER_OPENING: Record<LoadMode, string> = {
  full: 'Full plate today. Run the routine.',
  core: 'Lighter plate today. Hit the two core blocks and you’re winning the day.',
  're-entry': 'Soft on-ramp today. One sprint, one application — that’s the win.',
  maintenance: 'Maintenance mode. Pick a shaky pattern, ship one application, keep the structure.',
}

const TIER_SUBJECT: Record<LoadMode, string> = {
  full: '🌅 Today — full plate',
  core: '🌅 Today — light plate',
  're-entry': '🌅 Today — soft on-ramp',
  maintenance: '🌅 Today — maintenance',
}

const TIER_HEADER_EMOJI: Record<LoadMode, string> = {
  full: '🌅',
  core: '🌤️',
  're-entry': '🌱',
  maintenance: '🪴',
}

export function buildMorningBrief(input: MorningBriefInput): MorningBrief {
  const mode = input.loadProfile.mode
  const todayLabel = input.isMaintenance
    ? 'Maintenance day · free practice'
    : input.planDayNum !== null
      ? `Day ${input.planDayNum}${input.planDayTitle ? ` · ${input.planDayTitle}` : ''}`
      : 'Free practice day'

  const focusLines: MorningBrief['focusLines'] = []

  if (input.codingPattern || input.codingTaskCount > 0) {
    focusLines.push({
      emoji: '🧠',
      label: `Coding · ${input.loadProfile.sprints} sprint${input.loadProfile.sprints === 1 ? '' : 's'}`,
      detail: input.codingPattern ?? undefined,
    })
  }

  if (input.systemDesignTopic && input.loadProfile.systemDesign !== 'hidden') {
    const stretch = input.loadProfile.systemDesign === 'collapsed' ? ' (stretch)' : ''
    focusLines.push({
      emoji: '🏗️',
      label: `System design${stretch}`,
      detail: input.systemDesignTopic,
    })
  }

  focusLines.push({
    emoji: '📨',
    label: `Applications · ${input.loadProfile.appTarget} target`,
  })

  focusLines.push({
    emoji: '🏋️',
    label: 'CrossFit when you can',
  })

  focusLines.push({
    emoji: '📖',
    label: 'Read aloud · 10 min',
  })

  return {
    subjectPrefix: TIER_SUBJECT[mode],
    headerEmoji: TIER_HEADER_EMOJI[mode],
    openingLine: TIER_OPENING[mode],
    todayLabel: input.isCarryingForward ? `${todayLabel} — carried forward` : todayLabel,
    focusLines,
    edgeLine: composeEdge(input),
  }
}

function composeEdge(i: MorningBriefInput): string | null {
  if (i.isMaintenance) {
    return 'Pick one pattern that still feels shaky and rep it fresh.'
  }
  if (i.loadProfile.mode === 're-entry') {
    return i.yesterdayAvoided
      ? `Yesterday you noted: "${truncate(i.yesterdayAvoided, 70)}" — start there, gently.`
      : 'Open the anchor, do the first sprint, ship one application. That’s the day.'
  }
  if (i.loadProfile.mode === 'core') {
    return 'Bias toward shipping over polishing. One real rep beats two half ones.'
  }
  // full
  if (i.codingPattern) {
    return `Lead with ${i.codingPattern}. Burn down the easy ones first, recover momentum into the harder one.`
  }
  return 'Anchor first, then sprint. The reps are the only thing that matters.'
}

function truncate(s: string, max: number): string {
  const cleaned = s.trim().replace(/\s+/g, ' ')
  if (cleaned.length <= max) return cleaned
  return cleaned.slice(0, max - 1).replace(/\s+\S*$/, '') + '…'
}

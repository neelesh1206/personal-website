/**
 * SM-2-lite spaced repetition for the Reference-Library flashcards.
 * Pure functions only — `scheduleNext()` takes the current card state
 * + a grade and returns the new state. The DB queries call it; tests
 * cover the math.
 *
 * Design notes:
 *   - We avoid float drift on the ease factor by storing it as an
 *     integer ×100 (250 = 2.50). Conversion happens at the edges.
 *   - "Got it" growth bounded by MAX_INTERVAL_DAYS so a card can't
 *     vanish for years.
 *   - "Missed" resets to due-now / next-session, never punitive copy.
 *   - "Mastered" = 4 consecutive Got-it grades (MASTERY_STREAK). When
 *     mastered, intervals continue to grow but the deck filter drops
 *     them out of the default "due / weak" view unless they're
 *     actually due.
 *   - XP per grade is effort-weighted (3/2/1) — the attempt matters
 *     more than the outcome. Bonus +2 for clearing a "Missed" card
 *     within the same day (re-rep). Caller can pass XP override.
 */

export type Grade = 'got-it' | 'almost' | 'missed'

export type CardState = {
  /** Days between this review and the next. 0 = due today / this session. */
  intervalDays: number
  /** Ease factor × 100 — 250 = 2.50, the SM-2 starting point. */
  easeFactorX100: number
  /** Consecutive correct in a row. Reset on Missed. */
  streakCorrect: number
  timesSeen: number
  timesMissed: number
  timesCorrect: number
  lastGrade: Grade | null
}

export const STARTING_EASE_X100 = 250
export const MIN_EASE_X100 = 130
export const MAX_INTERVAL_DAYS = 90
export const MASTERY_STREAK = 4

export const INITIAL_STATE: CardState = {
  intervalDays: 0,
  easeFactorX100: STARTING_EASE_X100,
  streakCorrect: 0,
  timesSeen: 0,
  timesMissed: 0,
  timesCorrect: 0,
  lastGrade: null,
}

/** XP per grade — effort-weighted. Attempting a hard card with "Missed it" still earns. */
export const XP_PER_GRADE: Record<Grade, number> = {
  'got-it': 5,
  almost: 3,
  missed: 2,
}

export type ScheduleResult = {
  state: CardState
  /** Days until next review, for caller to translate into a nextDueAt. */
  nextDueInDays: number
  /** Did this grade push the card to "mastered" status this turn? */
  becameMastered: boolean
}

export function isMastered(state: CardState): boolean {
  return state.streakCorrect >= MASTERY_STREAK
}

/**
 * Apply a grade to a card's current state. Pure. The caller decides
 * the "now" anchor when translating intervalDays → nextDueAt.
 */
export function scheduleNext(prev: CardState, grade: Grade): ScheduleResult {
  const wasMastered = isMastered(prev)
  let ease = prev.easeFactorX100
  let interval = prev.intervalDays
  let streak = prev.streakCorrect
  let timesMissed = prev.timesMissed
  let timesCorrect = prev.timesCorrect

  if (grade === 'got-it') {
    timesCorrect += 1
    streak += 1
    interval = nextIntervalGotIt(prev.intervalDays, ease)
    ease = Math.min(400, Math.round(ease * 1.05)) // gentle bump
  } else if (grade === 'almost') {
    streak = 0 // breaks the streak — the attempt still counts but mastery resets
    interval = Math.max(1, Math.floor(prev.intervalDays / 2))
    ease = Math.max(MIN_EASE_X100, Math.round(ease * 0.85))
  } else {
    // missed
    timesMissed += 1
    streak = 0
    interval = 0 // due now / this session
    ease = Math.max(MIN_EASE_X100, Math.round(ease * 0.8))
  }

  const next: CardState = {
    intervalDays: interval,
    easeFactorX100: ease,
    streakCorrect: streak,
    timesSeen: prev.timesSeen + 1,
    timesMissed,
    timesCorrect,
    lastGrade: grade,
  }
  return {
    state: next,
    nextDueInDays: interval,
    becameMastered: !wasMastered && isMastered(next),
  }
}

function nextIntervalGotIt(prevDays: number, easeX100: number): number {
  if (prevDays === 0) return 1
  if (prevDays === 1) return 3
  if (prevDays <= 3) return 7
  const ease = easeX100 / 100
  return Math.min(MAX_INTERVAL_DAYS, Math.round(prevDays * ease))
}

/**
 * Given a "now" Date and an interval in days, return the next due time
 * at start-of-day to keep ordering stable across sessions.
 */
export function dueAt(now: Date, intervalDays: number): Date {
  const out = new Date(now)
  out.setUTCDate(out.getUTCDate() + Math.max(0, Math.floor(intervalDays)))
  if (intervalDays > 0) out.setUTCHours(0, 0, 0, 0)
  return out
}

/** Stable session id generator (caller's responsibility to keep it). */
export function makeSessionId(): string {
  const epoch = Math.floor(Date.now() / 1000).toString(36)
  // 6 hex chars from crypto.getRandomValues if available; deterministic fallback.
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const buf = new Uint8Array(3)
    crypto.getRandomValues(buf)
    return `${epoch}-${Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('')}`
  }
  return `${epoch}-${Math.floor(Math.random() * 0xffffff).toString(16)}`
}

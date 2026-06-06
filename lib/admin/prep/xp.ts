/**
 * XP economy + level computation. Pure functions — no DB, no I/O.
 *
 * Governing principle: XP only ever credits *real* completed work.
 * Configuring features, defaulting checkboxes, or hitting an endpoint
 * with no actual progress must never grant XP. Every action below maps
 * to a one-line server-side handler that fires the grant at the moment
 * the work happens.
 */

export type XpAction =
  | 'solve-problem' // toggle a coding task in the 10-day plan
  | 'finish-sprint' // pomodoro focus session completed
  | 'log-application' // POST /applications
  | 'train' // crossfit checkbox flips to true
  | 'journal-field' // a non-empty journal field saved (cap 12/day)
  | 'read-aloud' // English read-aloud flips to true
  | 'morning-anchor' // morning anchor checkbox flips to true
  | 'resolve-blank' // POST /resolves — re-solved from blank
  | 'full-day' // every required block done in one calendar day
  | 'flashcard-grade' // graded a flashcard via active recall

export const XP_RATES: Record<XpAction, number> = {
  'solve-problem': 20,
  'finish-sprint': 10,
  'log-application': 5,
  train: 15,
  'journal-field': 3,
  'read-aloud': 5,
  'morning-anchor': 3,
  'resolve-blank': 25,
  'full-day': 50,
  // Effort-weighted on purpose — the attempt is what matters, and we
  // don't want the user to game grades. Per-grade override happens at
  // the call site via the optional `xp` param on grantXp().
  'flashcard-grade': 3,
}

/** Per-day cap for journal fields — 4 prompts × 3 XP = 12. */
export const JOURNAL_DAILY_CAP = 12

export type LevelName = 'Apprentice' | 'Practitioner' | 'Senior' | 'Staff'

export type LevelTier = {
  name: LevelName
  minXp: number
  /** null for top tier */
  nextMinXp: number | null
}

export const LEVELS: LevelTier[] = [
  { name: 'Apprentice', minXp: 0, nextMinXp: 200 },
  { name: 'Practitioner', minXp: 200, nextMinXp: 600 },
  { name: 'Senior', minXp: 600, nextMinXp: 1500 },
  { name: 'Staff', minXp: 1500, nextMinXp: null },
]

export type LevelInfo = {
  level: LevelName
  totalXp: number
  /** XP at the floor of the current tier */
  currentTierMinXp: number
  /** XP at the floor of the next tier; null when Staff. */
  nextTierMinXp: number | null
  /** 0–100; 100 when at top tier. */
  progressPct: number
  /** XP needed to advance; null at top tier. */
  xpToNext: number | null
}

/**
 * Map a total XP count to its level + progress toward the next tier.
 * Pure; safe to call from server or client.
 */
export function computeLevel(totalXp: number): LevelInfo {
  const xp = Math.max(0, Math.floor(totalXp))
  let tier = LEVELS[0]!
  for (const t of LEVELS) {
    if (xp >= t.minXp) tier = t
  }
  if (tier.nextMinXp === null) {
    return {
      level: tier.name,
      totalXp: xp,
      currentTierMinXp: tier.minXp,
      nextTierMinXp: null,
      progressPct: 100,
      xpToNext: null,
    }
  }
  const span = tier.nextMinXp - tier.minXp
  const within = xp - tier.minXp
  const progressPct = Math.min(100, Math.max(0, Math.round((within / span) * 100)))
  return {
    level: tier.name,
    totalXp: xp,
    currentTierMinXp: tier.minXp,
    nextTierMinXp: tier.nextMinXp,
    progressPct,
    xpToNext: tier.nextMinXp - xp,
  }
}

/** Did the user cross a tier boundary between these two totals? */
export function crossedLevelUp(beforeXp: number, afterXp: number): LevelName | null {
  if (afterXp <= beforeXp) return null
  const before = computeLevel(beforeXp).level
  const after = computeLevel(afterXp).level
  return before !== after ? after : null
}

/* ------------------------------------------------------------------ *
 * Source-ID helpers — encode the thing that produced the XP so the
 * UNIQUE (action, source_id) ledger constraint keeps grants idempotent.
 * Calling the same handler twice grants once. Revocation is a separate
 * row with negative xp (see revokeXp in queries.ts).
 * ------------------------------------------------------------------ */

export const SourceId = {
  task: (taskId: string) => `task:${taskId}`,
  pomodoro: (id: number) => `pomo:${id}`,
  application: (id: number) => `app:${id}`,
  resolve: (id: number) => `resolve:${id}`,
  anchor: (date: string) => `anchor:${date}`,
  train: (date: string) => `train:${date}`,
  readAloud: (date: string) => `read:${date}`,
  journalField: (date: string, field: string) => `journal:${date}:${field}`,
  fullDay: (date: string) => `fullday:${date}`,
  flashcard: (cardId: string, sessionId: string) => `card:${cardId}:${sessionId}`,
}

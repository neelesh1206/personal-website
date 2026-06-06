import 'server-only'
import { sql, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  prepProgress,
  prepNotes,
  prepSettings,
  prepDailyLog,
  prepTodayTasks,
  prepPomodoros,
  prepApplications,
  prepResolves,
  prepWords,
  prepBadges,
  prepXpEvents,
  prepFlashcards,
  type PrepDailyLogRow,
  type PrepApplicationRow,
  type PrepPomodoroRow,
  type PrepWordRow,
  type PrepResolveRow,
  type PrepBadgeRow,
  type PrepXpEventRow,
  type PrepFlashcardRow,
} from '@/lib/db/schema'
import { XP_RATES, type XpAction } from './xp'

/* ---------------------------------------------------------------- *
 * Existing 10-day plan progress + notes.
 * ---------------------------------------------------------------- */

export async function getCompletedTaskIds(): Promise<Set<string>> {
  try {
    const rows = await db.select({ taskId: prepProgress.taskId }).from(prepProgress)
    return new Set(rows.map((r) => r.taskId))
  } catch (err) {
    console.error('getCompletedTaskIds failed:', err)
    return new Set()
  }
}

export async function getNotesByDay(): Promise<Record<string, string>> {
  try {
    const rows = await db.select().from(prepNotes)
    const out: Record<string, string> = {}
    for (const r of rows) out[r.day] = r.body
    return out
  } catch (err) {
    console.error('getNotesByDay failed:', err)
    return {}
  }
}

export async function setTaskCompleted(taskId: string, completed: boolean): Promise<void> {
  if (completed) {
    await db
      .insert(prepProgress)
      .values({ taskId })
      .onConflictDoNothing({ target: prepProgress.taskId })
  } else {
    await db.delete(prepProgress).where(sql`task_id = ${taskId}`)
  }
}

export async function setDayNote(day: string, body: string): Promise<void> {
  await db
    .insert(prepNotes)
    .values({ day, body })
    .onConflictDoUpdate({
      target: prepNotes.day,
      set: { body, updatedAt: sql`now()` },
    })
}

export async function resetAllProgress(): Promise<void> {
  await db.delete(prepProgress)
  await db.delete(prepNotes)
  await db.delete(prepDailyLog)
  await db.delete(prepTodayTasks)
  await db.delete(prepPomodoros)
  await db.delete(prepApplications)
  await db.delete(prepResolves)
  await db.delete(prepWords)
  await db.delete(prepBadges)
  await db.delete(prepXpEvents)
  await db.delete(prepFlashcards)
}

/* ---------------------------------------------------------------- *
 * Today's date helpers — single source of truth: server UTC day.
 * ---------------------------------------------------------------- */

export function todayKey(d: Date = new Date()): string {
  // YYYY-MM-DD UTC
  return d.toISOString().slice(0, 10)
}

/* ---------------------------------------------------------------- *
 * Settings (key-value JSONB).
 * ---------------------------------------------------------------- */

export const SETTING_KEYS = {
  planStartDate: 'plan_start_date',
  emailTime: 'email_time',
  evidenceLine: 'evidence_line',
  rewardMinutes: 'reward_minutes',
} as const

export type SettingsMap = {
  plan_start_date?: string
  email_time?: string
  evidence_line?: string
  reward_minutes?: number
  sound_enabled?: boolean
  my_wins?: string[]
  cards_per_session?: number
}

export async function getSettings(): Promise<SettingsMap> {
  try {
    const rows = await db.select().from(prepSettings)
    const out: SettingsMap = {}
    for (const r of rows) {
      ;(out as Record<string, unknown>)[r.key] = r.value as unknown
    }
    return out
  } catch (err) {
    console.error('getSettings failed:', err)
    return {}
  }
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await db
    .insert(prepSettings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: prepSettings.key,
      set: { value, updatedAt: sql`now()` },
    })
}

/* ---------------------------------------------------------------- *
 * Today's routine tasks — independent from 10-day plan progress.
 * Task IDs include the date (e.g. "2026-06-05:applications:apply-3").
 * ---------------------------------------------------------------- */

export async function getTodayCompletedTaskIds(date: string = todayKey()): Promise<Set<string>> {
  const rows = await db
    .select({ taskId: prepTodayTasks.taskId })
    .from(prepTodayTasks)
    .where(sql`task_id LIKE ${date + ':%'}`)
  return new Set(rows.map((r) => r.taskId))
}

export async function setTodayTaskCompleted(taskId: string, completed: boolean): Promise<void> {
  if (completed) {
    await db
      .insert(prepTodayTasks)
      .values({ taskId })
      .onConflictDoNothing({ target: prepTodayTasks.taskId })
  } else {
    await db.delete(prepTodayTasks).where(sql`task_id = ${taskId}`)
  }
}

/* ---------------------------------------------------------------- *
 * Daily log — per-day rollup row.
 * ---------------------------------------------------------------- */

export async function getOrInitDailyLog(date: string = todayKey()): Promise<PrepDailyLogRow> {
  const existing = await db
    .select()
    .from(prepDailyLog)
    .where(eq(prepDailyLog.logDate, date))
    .limit(1)
  if (existing[0]) return existing[0]
  await db.insert(prepDailyLog).values({ logDate: date }).onConflictDoNothing()
  const [row] = await db.select().from(prepDailyLog).where(eq(prepDailyLog.logDate, date)).limit(1)
  return row!
}

export async function getDailyLogs(limit = 90): Promise<PrepDailyLogRow[]> {
  return db.select().from(prepDailyLog).orderBy(desc(prepDailyLog.logDate)).limit(limit)
}

export async function getDailyLog(date: string): Promise<PrepDailyLogRow | null> {
  const [row] = await db.select().from(prepDailyLog).where(eq(prepDailyLog.logDate, date)).limit(1)
  return row ?? null
}

export async function patchDailyLog(
  date: string,
  patch: Partial<Omit<PrepDailyLogRow, 'logDate' | 'updatedAt'>>
): Promise<PrepDailyLogRow> {
  await getOrInitDailyLog(date)
  const [row] = await db
    .update(prepDailyLog)
    .set({ ...patch, updatedAt: sql`now()` })
    .where(eq(prepDailyLog.logDate, date))
    .returning()
  return row!
}

/* ---------------------------------------------------------------- *
 * Pomodoros.
 * ---------------------------------------------------------------- */

export async function startPomodoro(
  durationSeconds: number,
  kind: 'focus' | 'break' = 'focus'
): Promise<PrepPomodoroRow> {
  const [row] = await db.insert(prepPomodoros).values({ durationSeconds, kind }).returning()
  return row!
}

export async function completePomodoro(id: number): Promise<void> {
  await db
    .update(prepPomodoros)
    .set({ completedAt: sql`now()` })
    .where(eq(prepPomodoros.id, id))
}

export async function getRecentPomodoros(limit = 200): Promise<PrepPomodoroRow[]> {
  return db.select().from(prepPomodoros).orderBy(desc(prepPomodoros.startedAt)).limit(limit)
}

/* ---------------------------------------------------------------- *
 * Applications.
 * ---------------------------------------------------------------- */

export async function addApplication(
  company: string,
  role: string,
  notes = ''
): Promise<PrepApplicationRow> {
  const [row] = await db.insert(prepApplications).values({ company, role, notes }).returning()
  // Bump today's count
  const today = todayKey()
  await getOrInitDailyLog(today)
  await db
    .update(prepDailyLog)
    .set({
      applicationsCount: sql`${prepDailyLog.applicationsCount} + 1`,
      updatedAt: sql`now()`,
    })
    .where(eq(prepDailyLog.logDate, today))
  return row!
}

export async function getApplications(limit = 100): Promise<PrepApplicationRow[]> {
  return db.select().from(prepApplications).orderBy(desc(prepApplications.sentAt)).limit(limit)
}

export async function updateApplicationStatus(id: number, status: string): Promise<void> {
  await db.update(prepApplications).set({ status }).where(eq(prepApplications.id, id))
}

/* ---------------------------------------------------------------- *
 * Re-solves.
 * ---------------------------------------------------------------- */

export async function addResolve(problemLabel: string): Promise<PrepResolveRow> {
  const [row] = await db.insert(prepResolves).values({ problemLabel }).returning()
  return row!
}

export async function getResolves(limit = 100): Promise<PrepResolveRow[]> {
  return db.select().from(prepResolves).orderBy(desc(prepResolves.resolvedAt)).limit(limit)
}

/* ---------------------------------------------------------------- *
 * Words.
 * ---------------------------------------------------------------- */

export async function addWord(word: string, meaning = ''): Promise<PrepWordRow> {
  const [row] = await db.insert(prepWords).values({ word, meaning }).returning()
  return row!
}

export async function getWords(limit = 200): Promise<PrepWordRow[]> {
  return db.select().from(prepWords).orderBy(desc(prepWords.id)).limit(limit)
}

/* ---------------------------------------------------------------- *
 * Badges.
 * ---------------------------------------------------------------- */

export async function getBadges(): Promise<PrepBadgeRow[]> {
  return db.select().from(prepBadges).orderBy(desc(prepBadges.unlockedAt))
}

/* ---------------------------------------------------------------- *
 * XP ledger.
 *
 * grantXp() is idempotent — UNIQUE (action, source_id) means re-firing
 * the same handler doesn't double-credit. revokeXp() inserts a
 * matching negative-XP row so the SUM stays honest if the user
 * unticks something they already got credit for.
 *
 * Both functions are *side effects only* — they never throw user-
 * facing errors. Logging on failure preserves the principle that the
 * scoreboard is honest but a transient DB hiccup mustn't break the
 * mutation that the user actually cares about.
 * ---------------------------------------------------------------- */

export async function grantXp(args: {
  action: XpAction
  sourceId: string
  /** Override the default rate. Used by the journal-field cap, where we
   * grant the leftover amount up to the per-day ceiling. */
  xp?: number
}): Promise<{ granted: number; alreadyGranted: boolean }> {
  const amount = args.xp ?? XP_RATES[args.action]
  if (amount <= 0) return { granted: 0, alreadyGranted: false }
  try {
    const res = await db
      .insert(prepXpEvents)
      .values({ action: args.action, sourceId: args.sourceId, xp: amount })
      .onConflictDoNothing({
        target: [prepXpEvents.action, prepXpEvents.sourceId],
      })
      .returning({ id: prepXpEvents.id })
    if (res.length === 0) return { granted: 0, alreadyGranted: true }
    return { granted: amount, alreadyGranted: false }
  } catch (err) {
    console.error('grantXp failed', { action: args.action, sourceId: args.sourceId }, err)
    return { granted: 0, alreadyGranted: false }
  }
}

export async function revokeXp(action: XpAction, sourceId: string): Promise<void> {
  try {
    // Sum existing rows for this (action, source_id). If positive, insert
    // a matching negative row tagged with a `:revoke` suffix so the
    // UNIQUE constraint doesn't reject it.
    const existing = await db
      .select({ total: sql<number>`COALESCE(SUM(${prepXpEvents.xp}), 0)::int` })
      .from(prepXpEvents)
      .where(sql`${prepXpEvents.action} = ${action} AND ${prepXpEvents.sourceId} = ${sourceId}`)
    const net = existing[0]?.total ?? 0
    if (net <= 0) return
    await db.insert(prepXpEvents).values({
      action,
      sourceId: `${sourceId}:revoke:${Date.now()}`,
      xp: -net,
    })
  } catch (err) {
    console.error('revokeXp failed', { action, sourceId }, err)
  }
}

export async function getTotalXp(): Promise<number> {
  try {
    const [row] = await db
      .select({ total: sql<number>`COALESCE(SUM(${prepXpEvents.xp}), 0)::int` })
      .from(prepXpEvents)
    return row?.total ?? 0
  } catch (err) {
    console.error('getTotalXp failed', err)
    return 0
  }
}

export async function getXpToday(date: string = todayKey()): Promise<number> {
  try {
    const [row] = await db
      .select({ total: sql<number>`COALESCE(SUM(${prepXpEvents.xp}), 0)::int` })
      .from(prepXpEvents)
      .where(sql`DATE(${prepXpEvents.occurredAt}) = ${date}`)
    return row?.total ?? 0
  } catch (err) {
    console.error('getXpToday failed', err)
    return 0
  }
}

export async function getRecentXpEvents(limit = 200): Promise<PrepXpEventRow[]> {
  try {
    return db.select().from(prepXpEvents).orderBy(desc(prepXpEvents.occurredAt)).limit(limit)
  } catch (err) {
    console.error('getRecentXpEvents failed', err)
    return []
  }
}

/* ---------------------------------------------------------------- *
 * Flashcards — SM-2-lite scheduling state per card id.
 *
 * Card ids match the natural keys from
 * content/coding-prep-library.json (topics[].items[].id). Content
 * stays in the JSON; this table only stores progress.
 * ---------------------------------------------------------------- */

export async function getFlashcardState(cardId: string): Promise<PrepFlashcardRow | null> {
  try {
    const [row] = await db
      .select()
      .from(prepFlashcards)
      .where(eq(prepFlashcards.cardId, cardId))
      .limit(1)
    return row ?? null
  } catch (err) {
    console.error('getFlashcardState failed', err)
    return null
  }
}

export async function getAllFlashcardStates(): Promise<PrepFlashcardRow[]> {
  try {
    return await db.select().from(prepFlashcards)
  } catch (err) {
    console.error('getAllFlashcardStates failed', err)
    return []
  }
}

export async function getDueFlashcardCount(now: Date = new Date()): Promise<number> {
  try {
    const [row] = await db
      .select({ n: sql<number>`COUNT(*)::int` })
      .from(prepFlashcards)
      .where(sql`${prepFlashcards.nextDueAt} <= ${now.toISOString()}`)
    return row?.n ?? 0
  } catch (err) {
    console.error('getDueFlashcardCount failed', err)
    return 0
  }
}

export async function upsertFlashcardState(
  cardId: string,
  state: {
    lastGrade: string
    timesSeen: number
    timesMissed: number
    timesCorrect: number
    streakCorrect: number
    intervalDays: number
    easeFactorX100: number
    nextDueAt: Date
  }
): Promise<void> {
  try {
    await db
      .insert(prepFlashcards)
      .values({
        cardId,
        lastGrade: state.lastGrade,
        lastSeen: sql`now()`,
        timesSeen: state.timesSeen,
        timesMissed: state.timesMissed,
        timesCorrect: state.timesCorrect,
        streakCorrect: state.streakCorrect,
        intervalDays: state.intervalDays,
        easeFactor: state.easeFactorX100,
        nextDueAt: state.nextDueAt,
      })
      .onConflictDoUpdate({
        target: prepFlashcards.cardId,
        set: {
          lastGrade: state.lastGrade,
          lastSeen: sql`now()`,
          timesSeen: state.timesSeen,
          timesMissed: state.timesMissed,
          timesCorrect: state.timesCorrect,
          streakCorrect: state.streakCorrect,
          intervalDays: state.intervalDays,
          easeFactor: state.easeFactorX100,
          nextDueAt: state.nextDueAt,
        },
      })
  } catch (err) {
    console.error('upsertFlashcardState failed', err)
  }
}

/** Daily cumulative XP totals for the chart. Ascending by date. */
export async function getDailyXpTotals(days = 90): Promise<Array<{ date: string; xp: number }>> {
  try {
    const rows = await db
      .select({
        date: sql<string>`TO_CHAR(DATE(${prepXpEvents.occurredAt}), 'YYYY-MM-DD')`,
        xp: sql<number>`COALESCE(SUM(${prepXpEvents.xp}), 0)::int`,
      })
      .from(prepXpEvents)
      .groupBy(sql`DATE(${prepXpEvents.occurredAt})`)
      .orderBy(sql`DATE(${prepXpEvents.occurredAt}) ASC`)
      .limit(days)
    return rows.map((r) => ({ date: r.date, xp: r.xp }))
  } catch (err) {
    console.error('getDailyXpTotals failed', err)
    return []
  }
}

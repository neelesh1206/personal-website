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
  type PrepDailyLogRow,
  type PrepApplicationRow,
  type PrepPomodoroRow,
  type PrepWordRow,
  type PrepResolveRow,
  type PrepBadgeRow,
} from '@/lib/db/schema'

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

import 'server-only'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { prepProgress, prepNotes } from '@/lib/db/schema'

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
}

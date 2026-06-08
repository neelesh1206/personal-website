import 'server-only'
import { sql, eq, asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { prepInterviewQuestions, type PrepInterviewQuestionRow } from '@/lib/db/schema'

export type InterviewQuestion = {
  id: string
  question: string
  cues: string[]
  answer: string
  followUps: string[]
  cueLine: string
  sortOrder: number
}

function rowToQuestion(r: PrepInterviewQuestionRow): InterviewQuestion {
  return {
    id: r.id,
    question: r.question,
    cues: Array.isArray(r.cues) ? (r.cues as string[]) : [],
    answer: r.answer,
    followUps: Array.isArray(r.followUps) ? (r.followUps as string[]) : [],
    cueLine: r.cueLine,
    sortOrder: r.sortOrder,
  }
}

export async function listInterviewQuestions(): Promise<InterviewQuestion[]> {
  try {
    const rows = await db
      .select()
      .from(prepInterviewQuestions)
      .orderBy(asc(prepInterviewQuestions.sortOrder), asc(prepInterviewQuestions.id))
    return rows.map(rowToQuestion)
  } catch (err) {
    console.error('listInterviewQuestions failed', err)
    return []
  }
}

export async function getInterviewQuestion(id: string): Promise<InterviewQuestion | null> {
  try {
    const [row] = await db
      .select()
      .from(prepInterviewQuestions)
      .where(eq(prepInterviewQuestions.id, id))
      .limit(1)
    return row ? rowToQuestion(row) : null
  } catch (err) {
    console.error('getInterviewQuestion failed', err)
    return null
  }
}

export async function upsertInterviewQuestion(
  q: Omit<InterviewQuestion, 'sortOrder'> & { sortOrder?: number }
): Promise<void> {
  const order = q.sortOrder ?? (await nextSortOrder())
  await db
    .insert(prepInterviewQuestions)
    .values({
      id: q.id,
      question: q.question,
      cues: q.cues,
      answer: q.answer,
      followUps: q.followUps,
      cueLine: q.cueLine,
      sortOrder: order,
    })
    .onConflictDoUpdate({
      target: prepInterviewQuestions.id,
      set: {
        question: q.question,
        cues: q.cues,
        answer: q.answer,
        followUps: q.followUps,
        cueLine: q.cueLine,
        sortOrder: order,
        updatedAt: sql`now()`,
      },
    })
}

export async function deleteInterviewQuestion(id: string): Promise<void> {
  await db.delete(prepInterviewQuestions).where(eq(prepInterviewQuestions.id, id))
}

export async function bulkImportInterviewQuestions(
  questions: Array<Omit<InterviewQuestion, 'sortOrder'>>,
  mode: 'replace' | 'merge' = 'merge'
): Promise<{ inserted: number }> {
  if (mode === 'replace') await db.delete(prepInterviewQuestions)
  let inserted = 0
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]!
    await upsertInterviewQuestion({ ...q, sortOrder: i * 10 })
    inserted += 1
  }
  return { inserted }
}

export async function reorderInterviewQuestions(orderedIds: string[]): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(prepInterviewQuestions)
      .set({ sortOrder: i * 10, updatedAt: sql`now()` })
      .where(eq(prepInterviewQuestions.id, orderedIds[i]!))
  }
}

async function nextSortOrder(): Promise<number> {
  try {
    const [row] = await db
      .select({ m: sql<number>`COALESCE(MAX(${prepInterviewQuestions.sortOrder}), -10)::int` })
      .from(prepInterviewQuestions)
    return (row?.m ?? -10) + 10
  } catch {
    return 0
  }
}

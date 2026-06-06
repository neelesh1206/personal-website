import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { getAllFlashcardStates } from '@/lib/admin/prep/queries'

export const runtime = 'nodejs'

/**
 * Returns the full per-card progress map keyed by cardId so the client
 * can decide what's due / weak / mastered without round-tripping the
 * server on every navigation. Card content stays in the JSON.
 */
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const rows = await getAllFlashcardStates()
  const states = rows.map((r) => ({
    cardId: r.cardId,
    lastGrade: r.lastGrade,
    lastSeenAt: r.lastSeen?.toISOString() ?? null,
    nextDueAt: r.nextDueAt.toISOString(),
    intervalDays: r.intervalDays,
    easeFactorX100: r.easeFactor,
    streakCorrect: r.streakCorrect,
    timesSeen: r.timesSeen,
    timesMissed: r.timesMissed,
    timesCorrect: r.timesCorrect,
  }))
  return NextResponse.json({ states })
}

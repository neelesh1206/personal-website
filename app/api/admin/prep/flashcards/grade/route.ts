import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import {
  getFlashcardState,
  upsertFlashcardState,
  grantXp,
  getTotalXp,
} from '@/lib/admin/prep/queries'
import { refreshBadges } from '@/lib/admin/prep/refresh-badges'
import { SourceId, crossedLevelUp } from '@/lib/admin/prep/xp'
import {
  scheduleNext,
  INITIAL_STATE,
  XP_PER_GRADE,
  dueAt,
  type CardState,
  type Grade,
} from '@/lib/admin/prep/flashcards'

export const runtime = 'nodejs'

const Body = z.object({
  cardId: z.string().min(1).max(64),
  grade: z.enum(['got-it', 'almost', 'missed']),
  sessionId: z.string().min(1).max(48),
})

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = Body.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', detail: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const { cardId, grade, sessionId } = parsed.data

  const existing = await getFlashcardState(cardId)
  const prev: CardState = existing
    ? {
        intervalDays: existing.intervalDays,
        easeFactorX100: existing.easeFactor,
        streakCorrect: existing.streakCorrect,
        timesSeen: existing.timesSeen,
        timesMissed: existing.timesMissed,
        timesCorrect: existing.timesCorrect,
        lastGrade: (existing.lastGrade as Grade | null) ?? null,
      }
    : INITIAL_STATE

  const result = scheduleNext(prev, grade)
  await upsertFlashcardState(cardId, {
    lastGrade: grade,
    timesSeen: result.state.timesSeen,
    timesMissed: result.state.timesMissed,
    timesCorrect: result.state.timesCorrect,
    streakCorrect: result.state.streakCorrect,
    intervalDays: result.state.intervalDays,
    easeFactorX100: result.state.easeFactorX100,
    nextDueAt: dueAt(new Date(), result.state.intervalDays),
  })

  const xpBefore = await getTotalXp()
  const xpRes = await grantXp({
    action: 'flashcard-grade',
    sourceId: SourceId.flashcard(cardId, sessionId),
    xp: XP_PER_GRADE[grade],
  })
  const newBadges = await refreshBadges()
  const levelUp = xpRes.granted > 0 ? crossedLevelUp(xpBefore, xpBefore + xpRes.granted) : null

  return NextResponse.json({
    ok: true,
    nextDueInDays: result.nextDueInDays,
    state: result.state,
    becameMastered: result.becameMastered,
    xp: xpRes.granted,
    levelUp,
    newBadges,
  })
}

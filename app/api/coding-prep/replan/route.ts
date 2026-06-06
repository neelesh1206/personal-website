import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { replanDay } from '@/lib/hf'
import {
  buildLoadProfile,
  countConsecutiveMissedDays,
  type DayCompletion,
  type LoadMode,
} from '@/lib/admin/prep/plan-adjust'

export const runtime = 'nodejs'

/**
 * POST /api/coding-prep/replan
 *
 * Best-effort AI tuning of today's load. The page always falls back to
 * the deterministic load profile (lib/admin/prep/plan-adjust) when the
 * HF call is unavailable, errors, returns invalid JSON, or leaks any
 * shame language. The route never touches discipline metrics — XP /
 * streaks / badges are computed from the prep_xp_events ledger and the
 * daily-log row, neither of which this endpoint mutates.
 */

const ReplanBody = z.object({
  currentDay: z.number().int().min(1).max(50).nullable(),
  planDayTitle: z.string().max(200).default(''),
  loadMode: z.enum(['full', 'core', 're-entry', 'maintenance']),
  recentJournal: z
    .array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        finished: z.string().max(2000).default(''),
        avoided: z.string().max(2000).default(''),
        win: z.string().max(2000).default(''),
        mood: z.number().int().min(1).max(5).nullable().default(null),
      })
    )
    .max(7)
    .default([]),
  daysMissed: z.number().int().min(0).max(60).default(0),
  recentCompletions: z
    .array(
      z.object({
        date: z.string(),
        solvedProblems: z.boolean(),
        loggedApplication: z.boolean(),
        anchorRead: z.boolean(),
        coreCompleted: z.boolean(),
        fullyCompleted: z.boolean(),
      })
    )
    .max(30)
    .default([]),
  myWins: z.array(z.string().max(120)).max(8).default([]),
})

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = ReplanBody.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', detail: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const input = parsed.data

  // Deterministic baseline — what we'd show without HF at all. Always
  // returned alongside so the client can render immediately and the AI
  // chip is a clear, undoable overlay rather than a load-blocker.
  const baseline = buildLoadProfile(input.loadMode)

  const yesterdayCompletion: DayCompletion | null = input.recentCompletions[0] ?? null
  // Use the calling date as today for missed-day count if available.
  const todayKey = new Date().toISOString().slice(0, 10)
  const daysMissed = countConsecutiveMissedDays(todayKey, input.recentCompletions)

  let hfError: string | null = null
  const ai = await replanDay(
    {
      currentDay: input.currentDay,
      planDayTitle: input.planDayTitle,
      loadMode: input.loadMode as LoadMode,
      defaultSprints: baseline.sprints,
      defaultAppTarget: baseline.appTarget,
      completedYesterday: yesterdayCompletion
        ? [
            yesterdayCompletion.solvedProblems ? 'problems' : '',
            yesterdayCompletion.loggedApplication ? 'applications' : '',
            yesterdayCompletion.anchorRead ? 'anchor' : '',
          ].filter(Boolean)
        : [],
      missedYesterday: !yesterdayCompletion || !yesterdayCompletion.coreCompleted,
      daysMissed: Math.max(daysMissed, input.daysMissed),
      recentJournal: input.recentJournal,
      myWins: input.myWins,
    },
    (msg) => {
      hfError = msg
    }
  )

  return NextResponse.json({
    ok: true,
    baseline,
    ai,
    diagnostics: {
      has_hf_key: !!process.env.HUGGINGFACE_API_KEY,
      hf_error: hfError,
    },
  })
}

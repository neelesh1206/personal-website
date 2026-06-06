import { NextResponse, type NextRequest } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { patchDailyLog, todayKey } from '@/lib/admin/prep/queries'
import { refreshBadges } from '@/lib/admin/prep/refresh-badges'

export const runtime = 'nodejs'

const TEXT_FIELDS = new Set(['journalFinished', 'journalAvoided', 'journalWin', 'journalDeviation'])

const BOOL_FIELDS = new Set([
  'morningAnchorRead',
  'trainedToday',
  'readAloud',
  'rewardEarned',
  'noDeviation',
])

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const date = typeof body.date === 'string' ? body.date : todayKey()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patch: Record<string, any> = {}

  for (const [k, v] of Object.entries(body)) {
    if (k === 'date') continue
    if (BOOL_FIELDS.has(k)) {
      if (typeof v !== 'boolean') continue
      patch[k] = v
    } else if (TEXT_FIELDS.has(k)) {
      if (typeof v !== 'string') continue
      patch[k] = v.slice(0, 4000)
    } else if (k === 'mood') {
      if (v === null) {
        patch[k] = null
      } else if (typeof v === 'number' && v >= 1 && v <= 5) {
        patch[k] = v
      }
    } else if (k === 'problemsSolved' || k === 'applicationsCount') {
      if (typeof v === 'number' && v >= 0) patch[k] = Math.floor(v)
    } else if (k === 'rewardStartedAt') {
      if (typeof v === 'string') patch[k] = new Date(v)
    }
  }

  const row = await patchDailyLog(date, patch)
  const newBadges = await refreshBadges()
  return NextResponse.json({ ok: true, row, newBadges })
}

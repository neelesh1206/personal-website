import { NextResponse, type NextRequest } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import {
  patchDailyLog,
  getDailyLog,
  grantXp,
  revokeXp,
  getTotalXp,
  todayKey,
} from '@/lib/admin/prep/queries'
import { refreshBadges } from '@/lib/admin/prep/refresh-badges'
import { SourceId, XP_RATES, JOURNAL_DAILY_CAP, crossedLevelUp } from '@/lib/admin/prep/xp'

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

  // Snapshot the pre-state so we can detect 'just flipped to true'
  // for the boolean XP triggers (anchor / train / read-aloud) and
  // 'first non-empty' for journal fields.
  const prev = await getDailyLog(date)
  const row = await patchDailyLog(date, patch)

  // XP grants — only on the transition that represents real new work.
  const before = await getTotalXp()
  let xp = 0

  // Anchor
  if (patch.morningAnchorRead === true && !prev?.morningAnchorRead) {
    xp += (await grantXp({ action: 'morning-anchor', sourceId: SourceId.anchor(date) })).granted
  } else if (patch.morningAnchorRead === false && prev?.morningAnchorRead) {
    await revokeXp('morning-anchor', SourceId.anchor(date))
  }

  // Train
  if (patch.trainedToday === true && !prev?.trainedToday) {
    xp += (await grantXp({ action: 'train', sourceId: SourceId.train(date) })).granted
  } else if (patch.trainedToday === false && prev?.trainedToday) {
    await revokeXp('train', SourceId.train(date))
  }

  // Read aloud
  if (patch.readAloud === true && !prev?.readAloud) {
    xp += (await grantXp({ action: 'read-aloud', sourceId: SourceId.readAloud(date) })).granted
  } else if (patch.readAloud === false && prev?.readAloud) {
    await revokeXp('read-aloud', SourceId.readAloud(date))
  }

  // Journal fields — first time a field becomes non-empty grants +3,
  // capped at JOURNAL_DAILY_CAP (12 = all four fields filled). The
  // SourceId per-field encoding makes the cap natural: each field can
  // grant at most once per day.
  const journalKeys = [
    ['journalFinished', 'finished'],
    ['journalAvoided', 'avoided'],
    ['journalWin', 'win'],
    ['journalDeviation', 'deviation'],
  ] as const
  for (const [field, shortName] of journalKeys) {
    const next = patch[field]
    const wasEmpty = !prev || ((prev as Record<string, unknown>)[field] as string)?.trim() === ''
    if (typeof next === 'string' && next.trim().length > 0 && wasEmpty) {
      const res = await grantXp({
        action: 'journal-field',
        sourceId: SourceId.journalField(date, shortName),
        xp: Math.min(XP_RATES['journal-field'], JOURNAL_DAILY_CAP),
      })
      xp += res.granted
    }
  }

  const newBadges = await refreshBadges()
  const levelUp = xp > 0 ? crossedLevelUp(before, before + xp) : null
  return NextResponse.json({ ok: true, row, newBadges, xp, levelUp })
}

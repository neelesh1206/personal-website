import { NextResponse, type NextRequest } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { setTodayTaskCompleted, grantXp, revokeXp, getTotalXp } from '@/lib/admin/prep/queries'
import { refreshBadges } from '@/lib/admin/prep/refresh-badges'
import { crossedLevelUp } from '@/lib/admin/prep/xp'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { taskId?: unknown; completed?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const taskId = typeof body.taskId === 'string' ? body.taskId : null
  const completed = typeof body.completed === 'boolean' ? body.completed : null
  if (!taskId || completed === null) {
    return NextResponse.json({ error: 'taskId+completed required' }, { status: 400 })
  }
  if (taskId.length > 128) {
    return NextResponse.json({ error: 'taskId too long' }, { status: 400 })
  }

  await setTodayTaskCompleted(taskId, completed)

  // XP grant for routine checklist items. The taskId encodes
  // `YYYY-MM-DD:block:task` — only the apply-3 / referral-1 /
  // follow-up-1 items in the applications checklist credit XP, since
  // they reflect a real action. (Reading the morning anchor, training,
  // and reading aloud are tracked as booleans on prep_daily_log and
  // grant via the /daily-log route.) The same source id is reused so
  // re-toggling can't double-credit.
  let xp = 0
  let levelUp: string | null = null
  const isApplicationChecklistItem = /:applications:(apply-3|referral-1|follow-up-1)$/.test(taskId)
  if (isApplicationChecklistItem) {
    if (completed) {
      const before = await getTotalXp()
      const res = await grantXp({ action: 'log-application', sourceId: `today:${taskId}` })
      xp = res.granted
      if (xp > 0) levelUp = crossedLevelUp(before, before + xp)
    } else {
      await revokeXp('log-application', `today:${taskId}`)
    }
  }

  const newBadges = await refreshBadges()
  return NextResponse.json({ ok: true, newBadges, xp, levelUp })
}

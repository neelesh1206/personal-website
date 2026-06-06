import { NextResponse, type NextRequest } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { setTaskCompleted, grantXp, revokeXp, getTotalXp } from '@/lib/admin/prep/queries'
import { SourceId, crossedLevelUp } from '@/lib/admin/prep/xp'

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
    return NextResponse.json(
      { error: 'taskId (string) + completed (boolean) required' },
      { status: 400 }
    )
  }
  if (taskId.length > 64) {
    return NextResponse.json({ error: 'taskId too long' }, { status: 400 })
  }

  await setTaskCompleted(taskId, completed)

  // XP grant: only the coding tasks (id pattern dX-c-N) award the
  // solve-problem XP. System-design + wrap-up tasks log progress but
  // aren't problems solved. Honest scoreboard rule: untick = revoke.
  let xp = 0
  let levelUp: string | null = null
  if (/^d\d+-c-/.test(taskId)) {
    const sid = SourceId.task(taskId)
    if (completed) {
      const before = await getTotalXp()
      const res = await grantXp({ action: 'solve-problem', sourceId: sid })
      xp = res.granted
      if (xp > 0) levelUp = crossedLevelUp(before, before + xp)
    } else {
      await revokeXp('solve-problem', sid)
    }
  }
  return NextResponse.json({ ok: true, xp, levelUp })
}

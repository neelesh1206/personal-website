import { NextResponse, type NextRequest } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { setTodayTaskCompleted } from '@/lib/admin/prep/queries'
import { refreshBadges } from '@/lib/admin/prep/refresh-badges'

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
  const newBadges = await refreshBadges()
  return NextResponse.json({ ok: true, newBadges })
}

import { NextResponse, type NextRequest } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { setTaskCompleted } from '@/lib/admin/prep/queries'

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
  return NextResponse.json({ ok: true })
}

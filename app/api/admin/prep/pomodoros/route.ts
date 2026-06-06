import { NextResponse, type NextRequest } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { startPomodoro, completePomodoro } from '@/lib/admin/prep/queries'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: { durationSeconds?: unknown; kind?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const durationSeconds =
    typeof body.durationSeconds === 'number' && body.durationSeconds > 0
      ? Math.min(Math.floor(body.durationSeconds), 60 * 60 * 4)
      : null
  if (durationSeconds === null) {
    return NextResponse.json({ error: 'durationSeconds required' }, { status: 400 })
  }
  const kind = body.kind === 'break' ? 'break' : 'focus'
  const row = await startPomodoro(durationSeconds, kind)
  return NextResponse.json({ ok: true, pomodoro: row })
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: { id?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const id = typeof body.id === 'number' ? body.id : null
  if (id === null) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await completePomodoro(id)
  return NextResponse.json({ ok: true })
}

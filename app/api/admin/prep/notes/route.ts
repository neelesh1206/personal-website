import { NextResponse, type NextRequest } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { setDayNote } from '@/lib/admin/prep/queries'

export const runtime = 'nodejs'

const MAX_BODY = 20_000 // 20 KB of notes per day is generous

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { day?: unknown; body?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const day = typeof body.day === 'string' ? body.day : null
  const bodyText = typeof body.body === 'string' ? body.body : null

  if (!day || !/^(0[1-9]|10)$/.test(day)) {
    return NextResponse.json({ error: 'day must be "01" through "10"' }, { status: 400 })
  }
  if (bodyText === null) {
    return NextResponse.json({ error: 'body required (string, may be empty)' }, { status: 400 })
  }
  if (bodyText.length > MAX_BODY) {
    return NextResponse.json({ error: `body too large (max ${MAX_BODY} bytes)` }, { status: 400 })
  }

  await setDayNote(day, bodyText)
  return NextResponse.json({ ok: true })
}

import { NextResponse, type NextRequest } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { getSettings, setSetting } from '@/lib/admin/prep/queries'

export const runtime = 'nodejs'

const ALLOWED_KEYS = new Set(['plan_start_date', 'email_time', 'evidence_line', 'reward_minutes'])

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ settings: await getSettings() })
}

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
  const entries = Object.entries(body).filter(([k]) => ALLOWED_KEYS.has(k))
  for (const [k, v] of entries) {
    await setSetting(k, v)
  }
  return NextResponse.json({ ok: true, settings: await getSettings() })
}

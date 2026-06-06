import { NextResponse, type NextRequest } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { addResolve, getResolves } from '@/lib/admin/prep/queries'
import { refreshBadges } from '@/lib/admin/prep/refresh-badges'

export const runtime = 'nodejs'

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const rows = await getResolves()
  return NextResponse.json({ resolves: rows })
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: { problemLabel?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const label = typeof body.problemLabel === 'string' ? body.problemLabel.trim() : ''
  if (!label) return NextResponse.json({ error: 'problemLabel required' }, { status: 400 })
  const row = await addResolve(label.slice(0, 200))
  const newBadges = await refreshBadges()
  return NextResponse.json({ ok: true, resolve: row, newBadges })
}

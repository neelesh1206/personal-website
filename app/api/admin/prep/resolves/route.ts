import { NextResponse, type NextRequest } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { addResolve, getResolves, grantXp, getTotalXp } from '@/lib/admin/prep/queries'
import { refreshBadges } from '@/lib/admin/prep/refresh-badges'
import { SourceId, crossedLevelUp } from '@/lib/admin/prep/xp'

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
  const before = await getTotalXp()
  const xpRes = await grantXp({
    action: 'resolve-blank',
    sourceId: SourceId.resolve(row.id),
  })
  const newBadges = await refreshBadges()
  const levelUp = xpRes.granted > 0 ? crossedLevelUp(before, before + xpRes.granted) : null
  return NextResponse.json({
    ok: true,
    resolve: row,
    newBadges,
    xp: xpRes.granted,
    levelUp,
  })
}

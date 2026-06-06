import { NextResponse, type NextRequest } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import {
  addApplication,
  getApplications,
  updateApplicationStatus,
  grantXp,
  getTotalXp,
} from '@/lib/admin/prep/queries'
import { refreshBadges } from '@/lib/admin/prep/refresh-badges'
import { SourceId, crossedLevelUp } from '@/lib/admin/prep/xp'

export const runtime = 'nodejs'

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const rows = await getApplications()
  return NextResponse.json({ applications: rows })
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { company?: unknown; role?: unknown; notes?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const company = typeof body.company === 'string' ? body.company.trim() : ''
  if (!company) return NextResponse.json({ error: 'company required' }, { status: 400 })
  const role = typeof body.role === 'string' ? body.role.slice(0, 200) : ''
  const notes = typeof body.notes === 'string' ? body.notes.slice(0, 2000) : ''

  const row = await addApplication(company.slice(0, 200), role, notes)
  const before = await getTotalXp()
  const xpRes = await grantXp({
    action: 'log-application',
    sourceId: SourceId.application(row.id),
  })
  const newBadges = await refreshBadges()
  const levelUp = xpRes.granted > 0 ? crossedLevelUp(before, before + xpRes.granted) : null
  return NextResponse.json({
    ok: true,
    application: row,
    newBadges,
    xp: xpRes.granted,
    levelUp,
  })
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: { id?: unknown; status?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const id = typeof body.id === 'number' ? body.id : null
  const status = typeof body.status === 'string' ? body.status : null
  if (id === null || !status) {
    return NextResponse.json({ error: 'id+status required' }, { status: 400 })
  }
  const allowed = new Set(['applied', 'replied', 'interview', 'rejected', 'offer'])
  if (!allowed.has(status)) {
    return NextResponse.json({ error: 'invalid status' }, { status: 400 })
  }
  await updateApplicationStatus(id, status)
  return NextResponse.json({ ok: true })
}

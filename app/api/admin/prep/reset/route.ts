import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { resetAllProgress } from '@/lib/admin/prep/queries'

export const runtime = 'nodejs'

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await resetAllProgress()
  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { getDueFlashcardCount } from '@/lib/admin/prep/queries'

export const runtime = 'nodejs'

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ due: await getDueFlashcardCount(new Date()) })
}

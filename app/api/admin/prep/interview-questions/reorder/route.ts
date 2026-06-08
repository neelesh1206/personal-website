import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { reorderInterviewQuestions } from '@/lib/admin/prep/interview-queries'

export const runtime = 'nodejs'

const Body = z.object({
  ids: z.array(z.string().min(1).max(64)).min(1).max(100),
})

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = Body.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', detail: parsed.error.flatten() },
      { status: 400 }
    )
  }
  await reorderInterviewQuestions(parsed.data.ids)
  return NextResponse.json({ ok: true })
}

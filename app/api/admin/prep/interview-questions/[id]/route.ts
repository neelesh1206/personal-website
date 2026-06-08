import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import {
  deleteInterviewQuestion,
  getInterviewQuestion,
  upsertInterviewQuestion,
} from '@/lib/admin/prep/interview-queries'

export const runtime = 'nodejs'

const PatchBody = z.object({
  question: z.string().min(1).max(1000).optional(),
  cues: z.array(z.string().max(500)).max(40).optional(),
  answer: z.string().max(20000).optional(),
  followUps: z.array(z.string().max(2000)).max(20).optional(),
  cueLine: z.string().max(1000).optional(),
})

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await ctx.params
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = PatchBody.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', detail: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const existing = await getInterviewQuestion(id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const next = {
    id: existing.id,
    question: parsed.data.question ?? existing.question,
    cues: parsed.data.cues ?? existing.cues,
    answer: parsed.data.answer ?? existing.answer,
    followUps: parsed.data.followUps ?? existing.followUps,
    cueLine: parsed.data.cueLine ?? existing.cueLine,
    sortOrder: existing.sortOrder,
  }
  await upsertInterviewQuestion(next)
  return NextResponse.json({ ok: true, question: next })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await ctx.params
  await deleteInterviewQuestion(id)
  return NextResponse.json({ ok: true })
}

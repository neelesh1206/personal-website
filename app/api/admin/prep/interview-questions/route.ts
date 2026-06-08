import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { listInterviewQuestions, upsertInterviewQuestion } from '@/lib/admin/prep/interview-queries'

export const runtime = 'nodejs'

const QuestionBody = z.object({
  id: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, 'id must be lowercase letters/digits/hyphens'),
  question: z.string().min(1).max(1000),
  cues: z.array(z.string().max(500)).max(40),
  answer: z.string().max(20000),
  followUps: z.array(z.string().max(2000)).max(20),
  cueLine: z.string().max(1000),
})

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ questions: await listInterviewQuestions() })
}

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
  const parsed = QuestionBody.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', detail: parsed.error.flatten() },
      { status: 400 }
    )
  }
  await upsertInterviewQuestion(parsed.data)
  return NextResponse.json({ ok: true })
}

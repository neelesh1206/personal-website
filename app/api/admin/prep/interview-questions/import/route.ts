import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { bulkImportInterviewQuestions } from '@/lib/admin/prep/interview-queries'
import { setSetting } from '@/lib/admin/prep/queries'

export const runtime = 'nodejs'

const ImportBody = z.object({
  mode: z.enum(['replace', 'merge']).default('merge'),
  deliveryRules: z.array(z.string().max(500)).max(20).optional(),
  questions: z.array(
    z.object({
      id: z
        .string()
        .min(1)
        .max(64)
        .regex(/^[a-z0-9-]+$/, 'id must be lowercase letters/digits/hyphens'),
      question: z.string().min(1).max(1000),
      cues: z.array(z.string().max(500)).max(40),
      answer: z.string().max(20000),
      followUps: z.array(z.string().max(2000)).max(20).default([]),
      cueLine: z.string().max(1000).default(''),
    })
  ),
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
  const parsed = ImportBody.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', detail: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const res = await bulkImportInterviewQuestions(parsed.data.questions, parsed.data.mode)
  if (parsed.data.deliveryRules) {
    await setSetting('interview_delivery_rules', parsed.data.deliveryRules)
  }
  return NextResponse.json({ ok: true, inserted: res.inserted })
}

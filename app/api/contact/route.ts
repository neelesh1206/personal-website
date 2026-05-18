import { NextResponse, type NextRequest } from 'next/server'
import { saveContact } from '@/lib/db/queries'
import { getResend } from '@/lib/email/resend'
import { ownerEmail, visitorEmail } from '@/lib/email/templates'
import { contactInputSchema } from '@/lib/validation/contact'

export const runtime = 'nodejs'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = contactInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  // Honeypot — silently accept and discard
  if (parsed.data.website) {
    return NextResponse.json({ ok: true })
  }

  const { name, email, message, referrer } = parsed.data

  const contact = await saveContact({
    name,
    email,
    message: message ?? null,
    referrer: referrer ?? null,
  })
  if (!contact) {
    return NextResponse.json({ error: 'Failed to save contact' }, { status: 500 })
  }

  const fromAddress = process.env.RESEND_FROM_ADDRESS ?? 'Neelesh <hello@neeleshkakaraparthi.dev>'
  const ownerAddress = requireEnv('CONTACT_NOTIFICATION_EMAIL')
  const resumeUrl = process.env.PUBLIC_RESUME_URL

  const visitor = visitorEmail({ name, resumeUrl })
  const owner = ownerEmail({
    name,
    email,
    message: message ?? undefined,
    referrer: referrer ?? undefined,
    createdAt: contact.createdAt,
  })

  const resend = getResend()
  const results = await Promise.allSettled([
    resend.emails.send({
      from: fromAddress,
      to: email,
      subject: visitor.subject,
      text: visitor.text,
      html: visitor.html,
      replyTo: ownerAddress,
    }),
    resend.emails.send({
      from: fromAddress,
      to: ownerAddress,
      subject: owner.subject,
      text: owner.text,
      html: owner.html,
      replyTo: email,
    }),
  ])

  const errors = results
    .map((r, i) => (r.status === 'rejected' ? { i, reason: String(r.reason) } : null))
    .filter(Boolean)

  if (errors.length > 0) {
    console.error('Resend partial failure', errors)
  }

  return NextResponse.json({ ok: true, id: contact.id })
}

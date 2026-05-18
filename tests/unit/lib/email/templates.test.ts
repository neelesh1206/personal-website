import { describe, it, expect } from 'vitest'
import { visitorEmail, ownerEmail } from '@/lib/email/templates'

describe('visitorEmail', () => {
  it('returns subject + text + html with the visitor name', () => {
    const email = visitorEmail({ name: 'Jane' })
    expect(email.subject).toContain('resume')
    expect(email.text).toContain('Hi Jane')
    expect(email.html).toContain('Hi Jane')
  })

  it('embeds the resume URL when provided', () => {
    const url = 'https://example.com/resume.pdf'
    const email = visitorEmail({ name: 'Jane', resumeUrl: url })
    expect(email.text).toContain(url)
    expect(email.html).toContain(url)
    expect(email.text).not.toContain("I'll follow up")
  })

  it('falls back to a follow-up promise when no URL is set', () => {
    const email = visitorEmail({ name: 'Jane' })
    expect(email.text).toContain("I'll follow up")
    expect(email.html).toContain('follow up')
  })

  it('html-escapes the name to prevent XSS', () => {
    const email = visitorEmail({ name: '<script>alert(1)</script>' })
    expect(email.html).not.toContain('<script>alert(1)</script>')
    expect(email.html).toContain('&lt;script&gt;')
  })
})

describe('ownerEmail', () => {
  const createdAt = new Date('2026-05-18T07:00:00Z')

  it('includes the submitter name in the subject', () => {
    const email = ownerEmail({
      name: 'Jane',
      email: 'jane@example.com',
      createdAt,
    })
    expect(email.subject).toBe('New portfolio contact: Jane')
  })

  it('includes all fields in the text body', () => {
    const email = ownerEmail({
      name: 'Jane',
      email: 'jane@example.com',
      message: 'Hello there',
      referrer: 'https://google.com',
      createdAt,
    })
    expect(email.text).toContain('Jane')
    expect(email.text).toContain('jane@example.com')
    expect(email.text).toContain('Hello there')
    expect(email.text).toContain('https://google.com')
    expect(email.text).toContain('2026-05-18T07:00:00.000Z')
  })

  it('renders "(no message)" when message is absent', () => {
    const email = ownerEmail({ name: 'Jane', email: 'jane@example.com', createdAt })
    expect(email.text).toContain('(no message)')
    expect(email.html).toContain('(no message)')
  })

  it('omits the referrer row when missing', () => {
    const email = ownerEmail({ name: 'Jane', email: 'jane@example.com', createdAt })
    expect(email.html).not.toContain('Referrer')
  })

  it('html-escapes every untrusted field', () => {
    const email = ownerEmail({
      name: '<b>Jane</b>',
      email: 'jane@<script>example.com',
      message: 'Hi & welcome <world>',
      referrer: 'https://x.com/"onclick="alert(1)',
      createdAt,
    })
    expect(email.html).not.toContain('<b>Jane</b>')
    expect(email.html).not.toContain('<script>')
    expect(email.html).toContain('&lt;b&gt;Jane&lt;/b&gt;')
    expect(email.html).toContain('&amp;')
    // Quote in referrer must be escaped
    expect(email.html).toContain('&quot;onclick=&quot;alert(1)')
  })
})

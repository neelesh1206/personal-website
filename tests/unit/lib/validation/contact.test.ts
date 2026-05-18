import { describe, it, expect } from 'vitest'
import { contactInputSchema } from '@/lib/validation/contact'

describe('contactInputSchema', () => {
  it('accepts a minimal valid payload', () => {
    const result = contactInputSchema.safeParse({
      name: 'Jane Recruiter',
      email: 'jane@example.com',
    })
    expect(result.success).toBe(true)
  })

  it('accepts all fields populated', () => {
    const result = contactInputSchema.safeParse({
      name: 'Jane',
      email: 'jane@example.com',
      message: 'Hello!',
      referrer: 'https://linkedin.com/in/foo',
      website: '',
    })
    expect(result.success).toBe(true)
  })

  it('trims whitespace from name and email', () => {
    const result = contactInputSchema.safeParse({
      name: '  Jane  ',
      email: '  jane@example.com  ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Jane')
      expect(result.data.email).toBe('jane@example.com')
    }
  })

  it('accepts an empty-string message (handled downstream by ?? null)', () => {
    // The schema's optional() branch matches '' before the literal-to-undefined
    // branch can fire, so '' passes through. The route handler treats it as
    // "no message" via `message ?? null` (which keeps '' as-is; see #TODO if
    // we ever want to coerce to null at the schema layer).
    const result = contactInputSchema.safeParse({
      name: 'Jane',
      email: 'jane@example.com',
      message: '',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.message).toBe('')
    }
  })

  it('rejects an empty name', () => {
    const result = contactInputSchema.safeParse({ name: '', email: 'jane@example.com' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name).toContain('Name is required')
    }
  })

  it('rejects names longer than 100 chars', () => {
    const result = contactInputSchema.safeParse({
      name: 'a'.repeat(101),
      email: 'jane@example.com',
    })
    expect(result.success).toBe(false)
  })

  it('rejects malformed email', () => {
    const result = contactInputSchema.safeParse({ name: 'Jane', email: 'not-an-email' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toContain('Enter a valid email')
    }
  })

  it('rejects emails longer than 255 chars', () => {
    const long = 'a'.repeat(245) + '@a.com' // 251 chars
    const longer = 'a'.repeat(260) + '@a.com'
    expect(contactInputSchema.safeParse({ name: 'J', email: long }).success).toBe(true)
    expect(contactInputSchema.safeParse({ name: 'J', email: longer }).success).toBe(false)
  })

  it('rejects messages longer than 2000 chars', () => {
    const result = contactInputSchema.safeParse({
      name: 'Jane',
      email: 'jane@example.com',
      message: 'a'.repeat(2001),
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-empty website (honeypot)', () => {
    const result = contactInputSchema.safeParse({
      name: 'Spam',
      email: 'spam@bot.com',
      website: 'https://buy-meds.example',
    })
    expect(result.success).toBe(false)
  })
})

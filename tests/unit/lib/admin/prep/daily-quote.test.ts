import { describe, it, expect } from 'vitest'
import {
  getDailyQuote,
  getCandidateQuotes,
  getQuoteById,
  ALL_QUOTES,
  type Quote,
} from '@/lib/admin/prep/daily-quote'

describe('getDailyQuote', () => {
  it('returns a quote from the curated library', () => {
    const q = getDailyQuote('2026-06-05')
    expect(ALL_QUOTES.some((x) => x.id === q.id)).toBe(true)
  })

  it('is deterministic — same date always yields the same quote', () => {
    const a = getDailyQuote('2026-06-05')
    const b = getDailyQuote('2026-06-05')
    expect(a.id).toBe(b.id)
  })

  it('different dates yield different quotes (almost always)', () => {
    // Sample 14 consecutive days; we should see more than one distinct quote.
    const ids = new Set<string>()
    for (let day = 1; day <= 14; day++) {
      const key = `2026-06-${String(day).padStart(2, '0')}`
      ids.add(getDailyQuote(key).id)
    }
    expect(ids.size).toBeGreaterThan(1)
  })

  it('biases toward theme-matched tags when a plan theme is provided', () => {
    // "Arrays / hashing — warmup" should match consistency|focus tags.
    const q = getDailyQuote('2026-06-05', 'Arrays / hashing — warmup')
    const allowedTags = new Set(['consistency', 'focus'])
    const overlaps = q.tags.some((t) => allowedTags.has(t))
    expect(overlaps).toBe(true)
  })

  it('"System design — scale" maps to depth-flavored quotes', () => {
    const q = getDailyQuote('2026-06-05', 'System design — scale and reliability')
    const allowedTags = new Set(['depth', 'discipline'])
    const overlaps = q.tags.some((t) => allowedTags.has(t))
    expect(overlaps).toBe(true)
  })

  it('falls back to the full pool when the theme matches no rules', () => {
    const q = getDailyQuote('2026-06-05', 'something nonsensical zzz')
    expect(ALL_QUOTES.some((x) => x.id === q.id)).toBe(true)
  })

  it('every quote has the required shape', () => {
    const validCats = new Set([
      'athlete',
      'philosopher',
      'scientist',
      'builder',
      'writer',
      'leader',
    ])
    for (const q of ALL_QUOTES as Quote[]) {
      expect(q.id).toBeTruthy()
      expect(q.text.length).toBeGreaterThan(0)
      expect(q.author.length).toBeGreaterThan(0)
      expect(q.role.length).toBeGreaterThan(0)
      expect(validCats.has(q.category)).toBe(true)
      expect(Array.isArray(q.tags)).toBe(true)
    }
  })

  it('quote ids are unique', () => {
    const ids = ALL_QUOTES.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('getCandidateQuotes', () => {
  it('returns at most the requested limit', () => {
    const c = getCandidateQuotes('2026-06-05', undefined, 10)
    expect(c.length).toBeLessThanOrEqual(10)
    expect(c.length).toBeGreaterThan(0)
  })

  it('spans multiple categories when possible', () => {
    const c = getCandidateQuotes('2026-06-05', undefined, 12)
    const categories = new Set(c.map((q) => q.category))
    expect(categories.size).toBeGreaterThan(1)
  })

  it('biases toward theme-matched tags when theme is provided', () => {
    const c = getCandidateQuotes('2026-06-05', 'Arrays / hashing — warmup', 6)
    const allowed = new Set(['consistency', 'focus'])
    const matchCount = c.filter((q) => q.tags.some((t) => allowed.has(t))).length
    expect(matchCount).toBeGreaterThan(0)
  })

  it('is deterministic for the same date + theme', () => {
    const a = getCandidateQuotes('2026-06-05', 'Trees & Graphs', 8)
    const b = getCandidateQuotes('2026-06-05', 'Trees & Graphs', 8)
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id))
  })

  it('returns unique ids only', () => {
    const c = getCandidateQuotes('2026-06-05', undefined, 18)
    const ids = c.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('getQuoteById', () => {
  it('returns the matching quote', () => {
    const q = getQuoteById('marcus-mind')
    expect(q?.author).toBe('Marcus Aurelius')
  })

  it('returns null for unknown id', () => {
    expect(getQuoteById('does-not-exist-zzz')).toBeNull()
  })
})

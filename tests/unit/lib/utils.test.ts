import { describe, it, expect } from 'vitest'
import { cn, formatDate } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('deduplicates conflicting Tailwind classes (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'excluded', 'included')).toBe('base included')
  })

  it('handles undefined and null', () => {
    expect(cn('base', undefined, null)).toBe('base')
  })
})

describe('formatDate', () => {
  it('formats a date to a human-readable string', () => {
    // Use a local Date object to avoid UTC-midnight timezone shifts
    const date = new Date(2026, 0, 15) // Jan 15, 2026 in local time
    const result = formatDate(date)
    expect(result).toContain('January')
    expect(result).toContain('15')
    expect(result).toContain('2026')
  })

  it('accepts a Date object', () => {
    const result = formatDate(new Date('2026-05-17'))
    expect(result).toContain('2026')
  })
})

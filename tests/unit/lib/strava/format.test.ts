import { describe, it, expect } from 'vitest'
import {
  formatDistance,
  formatElevation,
  formatDuration,
  formatPace,
  formatSpeed,
  formatActivityDate,
  metersToMiles,
  metersToFeet,
} from '@/lib/strava/format'

describe('metersToMiles', () => {
  it('converts using 1609.344 m/mi', () => {
    expect(metersToMiles(1609.344)).toBe(1)
    expect(metersToMiles(16093.44)).toBeCloseTo(10, 5)
  })
})

describe('metersToFeet', () => {
  it('converts using 3.28084 ft/m', () => {
    expect(metersToFeet(1)).toBeCloseTo(3.28084, 5)
    expect(metersToFeet(1000)).toBeCloseTo(3280.84, 2)
  })
})

describe('formatDistance', () => {
  it('uses one decimal place below 10 mi', () => {
    expect(formatDistance(5000)).toBe('3.1 mi')
  })

  it('uses whole miles with thousands separator at or above 10 mi', () => {
    expect(formatDistance(20000)).toBe('12 mi')
    expect(formatDistance(2_000_000)).toBe('1,243 mi')
  })

  it('handles zero', () => {
    expect(formatDistance(0)).toBe('0.0 mi')
  })
})

describe('formatElevation', () => {
  it('rounds to whole feet with thousands separator', () => {
    expect(formatElevation(1000)).toBe('3,281 ft')
  })

  it('handles zero', () => {
    expect(formatElevation(0)).toBe('0 ft')
  })
})

describe('formatDuration', () => {
  it('formats minutes only below an hour', () => {
    expect(formatDuration(45)).toBe('0m')
    expect(formatDuration(900)).toBe('15m')
  })

  it('formats hours + minutes for >= 1h', () => {
    expect(formatDuration(3600)).toBe('1h 0m')
    expect(formatDuration(5400)).toBe('1h 30m')
    expect(formatDuration(7245)).toBe('2h 0m')
  })
})

describe('formatPace', () => {
  it('returns an em-dash for non-positive speed', () => {
    expect(formatPace(0)).toBe('—')
    expect(formatPace(-1)).toBe('—')
  })

  it('formats min:ss /mi from m/s', () => {
    // 1609.344 m in 360 s = 4.469 m/s → 6:00 /mi
    expect(formatPace(1609.344 / 360)).toBe('6:00 /mi')
    // 1609.344 m in 510 s = 3.155 m/s → 8:30 /mi
    expect(formatPace(1609.344 / 510)).toBe('8:30 /mi')
  })

  it('zero-pads seconds', () => {
    // 7:05 /mi
    expect(formatPace(1609.344 / 425)).toBe('7:05 /mi')
  })
})

describe('formatSpeed', () => {
  it('converts m/s to mph with one decimal', () => {
    expect(formatSpeed(0)).toBe('0.0 mph')
    expect(formatSpeed(1)).toBe('2.2 mph')
    expect(formatSpeed(10)).toBe('22.4 mph')
  })
})

describe('formatActivityDate', () => {
  it('renders short month, day, year (en-US)', () => {
    const out = formatActivityDate('2026-05-15T10:00:00')
    expect(out).toContain('May')
    expect(out).toContain('15')
    expect(out).toContain('2026')
  })
})

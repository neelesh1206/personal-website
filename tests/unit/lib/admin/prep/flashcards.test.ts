import { describe, it, expect } from 'vitest'
import {
  scheduleNext,
  INITIAL_STATE,
  STARTING_EASE_X100,
  MIN_EASE_X100,
  MAX_INTERVAL_DAYS,
  MASTERY_STREAK,
  XP_PER_GRADE,
  isMastered,
  dueAt,
} from '@/lib/admin/prep/flashcards'

describe('XP_PER_GRADE — effort-weighted', () => {
  it('every grade earns a positive amount (attempt > outcome)', () => {
    expect(XP_PER_GRADE['got-it']).toBeGreaterThan(0)
    expect(XP_PER_GRADE['almost']).toBeGreaterThan(0)
    expect(XP_PER_GRADE['missed']).toBeGreaterThan(0)
  })

  it('got-it > almost > missed', () => {
    expect(XP_PER_GRADE['got-it']).toBeGreaterThan(XP_PER_GRADE['almost'])
    expect(XP_PER_GRADE['almost']).toBeGreaterThan(XP_PER_GRADE['missed'])
  })
})

describe('scheduleNext — got-it growth', () => {
  it('0d → 1d on first got-it', () => {
    const r = scheduleNext(INITIAL_STATE, 'got-it')
    expect(r.state.intervalDays).toBe(1)
    expect(r.state.streakCorrect).toBe(1)
    expect(r.state.timesCorrect).toBe(1)
  })

  it('1d → 3d, 3d → 7d on successive got-its', () => {
    const r1 = scheduleNext(INITIAL_STATE, 'got-it')
    const r2 = scheduleNext(r1.state, 'got-it')
    const r3 = scheduleNext(r2.state, 'got-it')
    expect(r2.state.intervalDays).toBe(3)
    expect(r3.state.intervalDays).toBe(7)
  })

  it('grows by ease factor after 7d', () => {
    let s = INITIAL_STATE
    for (let i = 0; i < 3; i++) s = scheduleNext(s, 'got-it').state
    expect(s.intervalDays).toBe(7)
    s = scheduleNext(s, 'got-it').state
    // 7 × ~2.5 → 18 (rounded), plus ease may have bumped
    expect(s.intervalDays).toBeGreaterThanOrEqual(16)
    expect(s.intervalDays).toBeLessThanOrEqual(20)
  })

  it('bounded by MAX_INTERVAL_DAYS', () => {
    let s = { ...INITIAL_STATE, intervalDays: 60 }
    for (let i = 0; i < 10; i++) s = scheduleNext(s, 'got-it').state
    expect(s.intervalDays).toBeLessThanOrEqual(MAX_INTERVAL_DAYS)
  })
})

describe('scheduleNext — almost halves + drops ease', () => {
  it('halves the interval and resets the streak', () => {
    const after = scheduleNext({ ...INITIAL_STATE, intervalDays: 16, streakCorrect: 3 }, 'almost')
    expect(after.state.intervalDays).toBe(8)
    expect(after.state.streakCorrect).toBe(0)
  })

  it('drops ease but never below the floor', () => {
    let s = { ...INITIAL_STATE, easeFactorX100: 150 }
    for (let i = 0; i < 5; i++) s = scheduleNext(s, 'almost').state
    expect(s.easeFactorX100).toBeGreaterThanOrEqual(MIN_EASE_X100)
  })

  it('almost on a 0-day card → due in at least 1 day', () => {
    const r = scheduleNext(INITIAL_STATE, 'almost')
    expect(r.state.intervalDays).toBeGreaterThanOrEqual(1)
  })
})

describe('scheduleNext — missed resets to due-now', () => {
  it('missed → intervalDays 0 + streak reset + missed counter bump', () => {
    const r = scheduleNext(
      { ...INITIAL_STATE, intervalDays: 16, streakCorrect: 3, timesMissed: 0 },
      'missed'
    )
    expect(r.state.intervalDays).toBe(0)
    expect(r.state.streakCorrect).toBe(0)
    expect(r.state.timesMissed).toBe(1)
  })

  it('missed copy: never reset to a value greater than 0', () => {
    for (let i = 0; i < 10; i++) {
      const r = scheduleNext({ ...INITIAL_STATE, intervalDays: i * 5 }, 'missed')
      expect(r.state.intervalDays).toBe(0)
    }
  })
})

describe('mastery', () => {
  it(`isMastered = true after ${MASTERY_STREAK} consecutive got-its`, () => {
    let s = INITIAL_STATE
    for (let i = 0; i < MASTERY_STREAK; i++) s = scheduleNext(s, 'got-it').state
    expect(isMastered(s)).toBe(true)
  })

  it('becameMastered fires exactly once on the threshold crossing', () => {
    let s = INITIAL_STATE
    let crossings = 0
    for (let i = 0; i < 6; i++) {
      const r = scheduleNext(s, 'got-it')
      if (r.becameMastered) crossings += 1
      s = r.state
    }
    expect(crossings).toBe(1)
  })

  it('almost breaks the mastery streak', () => {
    let s = INITIAL_STATE
    for (let i = 0; i < 3; i++) s = scheduleNext(s, 'got-it').state
    s = scheduleNext(s, 'almost').state
    expect(s.streakCorrect).toBe(0)
    expect(isMastered(s)).toBe(false)
  })
})

describe('dueAt', () => {
  it('intervalDays = 0 → returns the same moment (due now)', () => {
    const now = new Date('2026-06-08T15:00:00Z')
    expect(dueAt(now, 0).getTime()).toBe(now.getTime())
  })

  it('intervalDays > 0 → snaps to UTC start-of-day N days out', () => {
    const now = new Date('2026-06-08T15:00:00Z')
    const out = dueAt(now, 3)
    expect(out.toISOString().slice(0, 10)).toBe('2026-06-11')
    expect(out.getUTCHours()).toBe(0)
    expect(out.getUTCMinutes()).toBe(0)
  })
})

describe('starting state matches constants', () => {
  it('INITIAL_STATE values', () => {
    expect(INITIAL_STATE.easeFactorX100).toBe(STARTING_EASE_X100)
    expect(INITIAL_STATE.intervalDays).toBe(0)
    expect(INITIAL_STATE.streakCorrect).toBe(0)
    expect(INITIAL_STATE.lastGrade).toBeNull()
  })
})

import { describe, it, expect } from 'vitest'
import {
  XP_RATES,
  JOURNAL_DAILY_CAP,
  LEVELS,
  computeLevel,
  crossedLevelUp,
  SourceId,
} from '@/lib/admin/prep/xp'

describe('XP_RATES', () => {
  it('matches the locked economy', () => {
    expect(XP_RATES['solve-problem']).toBe(20)
    expect(XP_RATES['finish-sprint']).toBe(10)
    expect(XP_RATES['log-application']).toBe(5)
    expect(XP_RATES['train']).toBe(15)
    expect(XP_RATES['journal-field']).toBe(3)
    expect(XP_RATES['read-aloud']).toBe(5)
    expect(XP_RATES['morning-anchor']).toBe(3)
    expect(XP_RATES['resolve-blank']).toBe(25)
    expect(XP_RATES['full-day']).toBe(50)
  })

  it('journal cap covers exactly four prompts × per-field rate', () => {
    expect(JOURNAL_DAILY_CAP).toBe(4 * XP_RATES['journal-field'])
  })
})

describe('computeLevel', () => {
  it('starts at Apprentice with zero XP', () => {
    const l = computeLevel(0)
    expect(l.level).toBe('Apprentice')
    expect(l.totalXp).toBe(0)
    expect(l.progressPct).toBe(0)
    expect(l.xpToNext).toBe(200)
  })

  it('halfway through Apprentice tier is 50%', () => {
    const l = computeLevel(100)
    expect(l.level).toBe('Apprentice')
    expect(l.progressPct).toBe(50)
    expect(l.xpToNext).toBe(100)
  })

  it('promotes to Practitioner at 200 XP', () => {
    expect(computeLevel(199).level).toBe('Apprentice')
    expect(computeLevel(200).level).toBe('Practitioner')
  })

  it('promotes to Senior at 600 XP', () => {
    expect(computeLevel(599).level).toBe('Practitioner')
    expect(computeLevel(600).level).toBe('Senior')
  })

  it('promotes to Staff at 1500 XP and stays there', () => {
    expect(computeLevel(1499).level).toBe('Senior')
    expect(computeLevel(1500).level).toBe('Staff')
    expect(computeLevel(99999).level).toBe('Staff')
  })

  it('Staff tier reports 100% progress + null xpToNext', () => {
    const l = computeLevel(2000)
    expect(l.progressPct).toBe(100)
    expect(l.xpToNext).toBeNull()
    expect(l.nextTierMinXp).toBeNull()
  })

  it('clamps and floors negative / non-integer inputs', () => {
    expect(computeLevel(-50).totalXp).toBe(0)
    expect(computeLevel(99.9).totalXp).toBe(99)
  })

  it('LEVELS array is monotonic', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i]!.minXp).toBeGreaterThan(LEVELS[i - 1]!.minXp)
    }
  })
})

describe('crossedLevelUp', () => {
  it('returns the new level name when crossing a boundary', () => {
    expect(crossedLevelUp(195, 215)).toBe('Practitioner')
    expect(crossedLevelUp(595, 605)).toBe('Senior')
    expect(crossedLevelUp(1490, 1510)).toBe('Staff')
  })

  it('returns null when staying in the same tier', () => {
    expect(crossedLevelUp(100, 150)).toBeNull()
    expect(crossedLevelUp(800, 900)).toBeNull()
  })

  it('returns null on zero or negative delta', () => {
    expect(crossedLevelUp(200, 200)).toBeNull()
    expect(crossedLevelUp(300, 100)).toBeNull()
  })
})

describe('SourceId', () => {
  it('encodes each action with a unique-enough prefix', () => {
    expect(SourceId.task('d1-c-1')).toBe('task:d1-c-1')
    expect(SourceId.pomodoro(42)).toBe('pomo:42')
    expect(SourceId.application(7)).toBe('app:7')
    expect(SourceId.resolve(3)).toBe('resolve:3')
    expect(SourceId.anchor('2026-06-06')).toBe('anchor:2026-06-06')
    expect(SourceId.train('2026-06-06')).toBe('train:2026-06-06')
    expect(SourceId.readAloud('2026-06-06')).toBe('read:2026-06-06')
    expect(SourceId.journalField('2026-06-06', 'finished')).toBe('journal:2026-06-06:finished')
    expect(SourceId.fullDay('2026-06-06')).toBe('fullday:2026-06-06')
  })

  it('produces distinct ids for distinct inputs', () => {
    const ids = [
      SourceId.task('d1-c-1'),
      SourceId.task('d1-c-2'),
      SourceId.pomodoro(1),
      SourceId.application(1),
      SourceId.anchor('2026-06-06'),
      SourceId.anchor('2026-06-07'),
    ]
    expect(new Set(ids).size).toBe(ids.length)
  })
})

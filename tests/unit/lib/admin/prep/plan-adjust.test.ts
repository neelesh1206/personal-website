import { describe, it, expect } from 'vitest'
import {
  slideCurrentPlanDay,
  pickLoadMode,
  buildLoadProfile,
  countConsecutiveMissedDays,
  fullPlanDaysCompleted,
  type DayCompletion,
} from '@/lib/admin/prep/plan-adjust'
import type { Plan } from '@/lib/admin/prep/types'

function day(date: string, partial: Partial<DayCompletion> = {}): DayCompletion {
  return {
    date,
    solvedProblems: false,
    loggedApplication: false,
    anchorRead: false,
    coreCompleted: false,
    fullyCompleted: false,
    ...partial,
  }
}

describe('slideCurrentPlanDay', () => {
  it('returns null when no plan start date set', () => {
    const r = slideCurrentPlanDay({
      planStartDate: undefined,
      todayKey: '2026-06-06',
      completedDays: new Set(),
      totalDays: 10,
    })
    expect(r.planDay).toBeNull()
    expect(r.isMaintenance).toBe(false)
  })

  it('slides to the earliest unfinished day', () => {
    // Start Mon June 1; today is Thu June 4 (calendar Day 4); Day 2 incomplete
    const r = slideCurrentPlanDay({
      planStartDate: '2026-06-01',
      todayKey: '2026-06-04',
      completedDays: new Set([1, 3]),
      totalDays: 10,
    })
    expect(r.planDay).toBe(2)
  })

  it('matches calendar day when caught up', () => {
    const r = slideCurrentPlanDay({
      planStartDate: '2026-06-01',
      todayKey: '2026-06-04',
      completedDays: new Set([1, 2, 3]),
      totalDays: 10,
    })
    expect(r.planDay).toBe(4)
  })

  it('returns maintenance after Day 10 complete', () => {
    const r = slideCurrentPlanDay({
      planStartDate: '2026-06-01',
      todayKey: '2026-06-15',
      completedDays: new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
      totalDays: 10,
    })
    expect(r.planDay).toBeNull()
    expect(r.isMaintenance).toBe(true)
  })

  it('starts at day 1 when plan start is in the future', () => {
    const r = slideCurrentPlanDay({
      planStartDate: '2026-06-10',
      todayKey: '2026-06-06',
      completedDays: new Set(),
      totalDays: 10,
    })
    expect(r.planDay).toBe(1)
  })
})

describe('pickLoadMode', () => {
  it('starts with full when no yesterday data', () => {
    expect(pickLoadMode({ yesterday: null, isMaintenance: false })).toBe('full')
  })

  it('full when yesterday was fully completed', () => {
    expect(
      pickLoadMode({
        yesterday: day('y', { fullyCompleted: true, coreCompleted: true }),
        isMaintenance: false,
      })
    ).toBe('full')
  })

  it('core when yesterday was partial (core but not full)', () => {
    expect(
      pickLoadMode({
        yesterday: day('y', { coreCompleted: true, fullyCompleted: false }),
        isMaintenance: false,
      })
    ).toBe('core')
  })

  it('re-entry when yesterday was missed entirely', () => {
    expect(
      pickLoadMode({
        yesterday: day('y'),
        isMaintenance: false,
      })
    ).toBe('re-entry')
  })

  it('maintenance overrides everything when isMaintenance', () => {
    expect(
      pickLoadMode({
        yesterday: day('y', { fullyCompleted: true }),
        isMaintenance: true,
      })
    ).toBe('maintenance')
  })

  it('manual override beats everything else', () => {
    expect(
      pickLoadMode({
        yesterday: day('y', { fullyCompleted: true }),
        isMaintenance: false,
        manualOverride: 'core',
      })
    ).toBe('core')
  })
})

describe('buildLoadProfile', () => {
  it('full = 2 sprints, 3 apps, full design', () => {
    const p = buildLoadProfile('full')
    expect(p.sprints).toBe(2)
    expect(p.appTarget).toBe(3)
    expect(p.systemDesign).toBe('full')
  })

  it('re-entry collapses system design and softens copy', () => {
    const p = buildLoadProfile('re-entry')
    expect(p.sprints).toBe(1)
    expect(p.systemDesign).toBe('collapsed')
    // Honest tone — never blames a miss.
    expect(p.toneLine).not.toMatch(/missed|failed|broke/i)
  })

  it('every mode has a tone line that avoids shame language', () => {
    for (const mode of ['full', 'core', 're-entry', 'maintenance'] as const) {
      const p = buildLoadProfile(mode)
      expect(p.toneLine).not.toMatch(/missed|failed|fell off|shame|broke the chain/i)
    }
  })
})

describe('countConsecutiveMissedDays', () => {
  it('returns 0 when yesterday had real work', () => {
    const missed = countConsecutiveMissedDays('2026-06-06', [
      day('2026-06-05', { solvedProblems: true }),
    ])
    expect(missed).toBe(0)
  })

  it('counts back through consecutive empty days', () => {
    const missed = countConsecutiveMissedDays('2026-06-06', [
      day('2026-06-05'),
      day('2026-06-04'),
      day('2026-06-03', { anchorRead: true }),
    ])
    expect(missed).toBe(2)
  })

  it('stops on the first day with real work', () => {
    const missed = countConsecutiveMissedDays('2026-06-06', [
      day('2026-06-05'),
      day('2026-06-04', { loggedApplication: true }),
      day('2026-06-03'),
    ])
    expect(missed).toBe(1)
  })

  it('respects maxLookback', () => {
    const empty: DayCompletion[] = []
    for (let i = 1; i <= 30; i++) {
      empty.push(day(`2026-05-${String(i).padStart(2, '0')}`))
    }
    const missed = countConsecutiveMissedDays('2026-06-06', empty, 7)
    expect(missed).toBe(7)
  })
})

describe('fullPlanDaysCompleted', () => {
  const plan = {
    days: [
      {
        day: 1,
        title: 't',
        badge: '[E]',
        successCheck: '',
        blocks: [
          {
            type: 'educative-coding',
            title: 'X',
            items: [
              { id: 'd1-c1-1', label: 'a' },
              { id: 'd1-c1-2', label: 'b' },
            ],
          },
        ],
      },
      {
        day: 2,
        title: 't',
        badge: '[E]',
        successCheck: '',
        blocks: [
          {
            type: 'educative-coding',
            title: 'X',
            items: [
              { id: 'd2-c1-1', label: 'a' },
              { id: 'd2-c1-2', label: 'b' },
            ],
          },
          {
            type: 'neetcode-reps',
            title: 'Y',
            items: [{ id: 'd2-c2-1', label: 'c' }],
          },
        ],
      },
    ],
  } as unknown as Plan

  it('counts only days where every coding-type item id is completed', () => {
    expect(fullPlanDaysCompleted(plan, new Set(['d1-c1-1', 'd1-c1-2', 'd2-c1-1', 'd2-c1-2']))).toBe(
      1
    )
    expect(
      fullPlanDaysCompleted(plan, new Set(['d1-c1-1', 'd1-c1-2', 'd2-c1-1', 'd2-c1-2', 'd2-c2-1']))
    ).toBe(2)
  })

  it('zero on empty set', () => {
    expect(fullPlanDaysCompleted(plan, new Set())).toBe(0)
  })
})

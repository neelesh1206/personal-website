import { describe, it, expect } from 'vitest'
import {
  codingBlocks,
  codingItems,
  sysDesignBlocks,
  sysDesignItems,
  wrapupItems,
  allItems,
  planTotalTasks,
  planDaysWithAllItemsCompleted,
  todaysCodingPattern,
  todaysSysDesignTopic,
  todaysSysDesignAnchor,
  isCodingTaskId,
  CODING_TASK_ID_RE,
} from '@/lib/admin/prep/plan-helpers'
import type { Plan, PlanDay } from '@/lib/admin/prep/types'

function day(overrides: Partial<PlanDay> = {}): PlanDay {
  const n = overrides.day ?? 1
  return {
    day: n,
    title: 'Two Pointers',
    badge: '[EASY]',
    successCheck: 'win',
    blocks: [
      {
        type: 'educative-coding',
        title: 'Grokking · Two Pointers',
        items: [
          { id: `d${n}-c1-1`, label: 'Read intro' },
          { id: `d${n}-c1-2`, label: 'Valid Palindrome' },
        ],
      },
      {
        type: 'neetcode-reps',
        title: 'NeetCode reps',
        items: [{ id: `d${n}-c2-1`, label: 'Best Time to Buy/Sell' }],
      },
      {
        type: 'educative-sysdesign',
        title: 'Grokking SD · Intro',
        items: [
          { id: `d${n}-s1-1`, label: 'Why it matters' },
          { id: `d${n}-s1-2`, label: 'Interview framing' },
        ],
      },
      {
        type: 'wrapup',
        items: [{ id: `d${n}-w-1`, label: 'Log it' }],
      },
    ],
    ...overrides,
  }
}

describe('codingBlocks / codingItems', () => {
  it('includes both educative-coding and neetcode-reps', () => {
    const d = day()
    expect(codingBlocks(d).map((b) => b.type)).toEqual(['educative-coding', 'neetcode-reps'])
    expect(codingItems(d).map((i) => i.id)).toEqual(['d1-c1-1', 'd1-c1-2', 'd1-c2-1'])
  })

  it('returns empty arrays for a day with no coding blocks', () => {
    const d = day({
      blocks: [
        {
          type: 'educative-sysdesign',
          title: 'SD only',
          items: [{ id: 'd1-s1-1', label: 'x' }],
        },
      ],
    })
    expect(codingBlocks(d)).toEqual([])
    expect(codingItems(d)).toEqual([])
  })
})

describe('sysDesignBlocks / sysDesignItems', () => {
  it('isolates educative-sysdesign blocks', () => {
    const d = day()
    expect(sysDesignBlocks(d)).toHaveLength(1)
    expect(sysDesignItems(d)).toHaveLength(2)
  })
})

describe('wrapupItems / allItems', () => {
  it('wrapupItems returns only wrapup items', () => {
    expect(wrapupItems(day()).map((i) => i.id)).toEqual(['d1-w-1'])
  })
  it('allItems flattens every block', () => {
    expect(allItems(day())).toHaveLength(6)
  })
})

describe('planTotalTasks', () => {
  it('sums all items across all days', () => {
    const plan = { days: [day(), day({ day: 2 })] } as unknown as Plan
    expect(planTotalTasks(plan)).toBe(12)
  })
})

describe('planDaysWithAllItemsCompleted', () => {
  const plan = { days: [day(), day({ day: 2 })] } as unknown as Plan

  it('empty completed set → no days complete', () => {
    const s = planDaysWithAllItemsCompleted(plan, new Set())
    expect([...s]).toEqual([])
  })

  it('partial completion → that day is NOT in the set', () => {
    // Day 1 has 6 items total; we tick 5
    const s = planDaysWithAllItemsCompleted(
      plan,
      new Set(['d1-c1-1', 'd1-c1-2', 'd1-c2-1', 'd1-s1-1', 'd1-s1-2'])
    )
    expect(s.has(1)).toBe(false)
  })

  it('every item of a day ticked → that day IS in the set', () => {
    // All 6 items of Day 1
    const s = planDaysWithAllItemsCompleted(
      plan,
      new Set(['d1-c1-1', 'd1-c1-2', 'd1-c2-1', 'd1-s1-1', 'd1-s1-2', 'd1-w-1'])
    )
    expect(s.has(1)).toBe(true)
    expect(s.has(2)).toBe(false)
  })

  it('skips days with no items rather than counting them as done', () => {
    const emptyDay = { day: 3, title: 't', badge: '', successCheck: '', blocks: [] }
    const p = { days: [...plan.days, emptyDay] } as unknown as Plan
    const s = planDaysWithAllItemsCompleted(p, new Set())
    expect(s.has(3)).toBe(false)
  })
})

describe('today helpers', () => {
  it('codingPattern uses the first coding block title', () => {
    expect(todaysCodingPattern(day())).toBe('Grokking · Two Pointers')
  })

  it('codingPattern falls back to day.title when no coding blocks', () => {
    const d = day({ blocks: [day().blocks[2]!] })
    expect(todaysCodingPattern(d)).toBe('Two Pointers')
  })

  it('sysDesignTopic uses the first sys-design block title', () => {
    expect(todaysSysDesignTopic(day())).toBe('Grokking SD · Intro')
  })

  it('sysDesignAnchor joins the sys-design item labels', () => {
    expect(todaysSysDesignAnchor(day())).toBe('Why it matters · Interview framing')
  })

  it('sysDesignAnchor empty when no sys-design block', () => {
    const d = day({ blocks: [day().blocks[0]!] })
    expect(todaysSysDesignAnchor(d)).toBe('')
  })
})

describe('isCodingTaskId / CODING_TASK_ID_RE', () => {
  it('matches new shape ids: d{N}-c{B}-{I}', () => {
    expect(isCodingTaskId('d1-c1-1')).toBe(true)
    expect(isCodingTaskId('d15-c2-7')).toBe(true)
    expect(CODING_TASK_ID_RE.test('d11-c1-1')).toBe(true)
  })

  it('rejects system-design / wrapup / unrelated ids', () => {
    expect(isCodingTaskId('d1-s1-1')).toBe(false)
    expect(isCodingTaskId('d1-w-1')).toBe(false)
    expect(isCodingTaskId('foo')).toBe(false)
    expect(isCodingTaskId('today:applications:apply-3')).toBe(false)
  })

  it('rejects legacy ids without the digit suffix on the type prefix', () => {
    expect(isCodingTaskId('d1-c-1')).toBe(false) // old shape, now invalid
  })
})

import { describe, it, expect } from 'vitest'
import { gradeDay, buildCompletionLines, type DayGradeInput } from '@/lib/admin/prep/day-grade'

function input(overrides: Partial<DayGradeInput> = {}): DayGradeInput {
  return {
    rewardEarned: false,
    studyStreak: 0,
    problemsSolved: 0,
    applicationsCount: 0,
    morningAnchorRead: false,
    trainedToday: false,
    readAloud: false,
    newlyUnlockedCount: 0,
    ...overrides,
  }
}

describe('gradeDay tiers', () => {
  it('triumph requires reward earned + ≥3 streak + ≥2 problems + ≥3 apps', () => {
    expect(
      gradeDay(
        input({
          rewardEarned: true,
          studyStreak: 3,
          problemsSolved: 2,
          applicationsCount: 3,
        })
      ).tier
    ).toBe('triumph')
  })

  it('solid = both core blocks done but conditions for triumph not met', () => {
    expect(gradeDay(input({ problemsSolved: 2, applicationsCount: 3 })).tier).toBe('solid')
  })

  it('steady = anchor + at least one of problems/apps', () => {
    expect(gradeDay(input({ morningAnchorRead: true, problemsSolved: 1 })).tier).toBe('steady')
  })

  it('quiet = some activity but no anchor + no problems/apps', () => {
    expect(gradeDay(input({ trainedToday: true })).tier).toBe('quiet')
    expect(gradeDay(input({ readAloud: true })).tier).toBe('quiet')
  })

  it('reset = nothing logged', () => {
    expect(gradeDay(input()).tier).toBe('reset')
  })
})

describe('gradeDay copy — no shame language anywhere', () => {
  it('reset tier opening is calm + forward-looking, never blames', () => {
    const g = gradeDay(input())
    expect(g.tier).toBe('reset')
    expect(g.openingLine).not.toMatch(/missed|failed|fell off|behind|sorry/i)
    expect(g.subjectPrefix).not.toMatch(/missed|failed|streak broken/i)
  })

  it('every tier opening is free of shame language', () => {
    const cases: Array<Partial<DayGradeInput>> = [
      { rewardEarned: true, studyStreak: 7, problemsSolved: 4, applicationsCount: 5 },
      { problemsSolved: 2, applicationsCount: 3 },
      { morningAnchorRead: true, problemsSolved: 1 },
      { trainedToday: true },
      {},
    ]
    for (const c of cases) {
      const g = gradeDay(input(c))
      expect(g.openingLine).not.toMatch(/missed|failed|broke|shame|sorry|behind/i)
    }
  })
})

describe('buildCompletionLines', () => {
  it('returns an empty array on a quiet day', () => {
    expect(
      buildCompletionLines({
        morningAnchorRead: false,
        problemsSolved: 0,
        trainedToday: false,
        readAloud: false,
        applicationsCount: 0,
        rewardEarned: false,
        newlyUnlocked: [],
      })
    ).toEqual([])
  })

  it('includes anchor / coding / apps / train / read / reward / badges with correct emoji', () => {
    const lines = buildCompletionLines({
      morningAnchorRead: true,
      problemsSolved: 3,
      systemDesignDone: true,
      trainedToday: true,
      readAloud: true,
      applicationsCount: 2,
      rewardEarned: true,
      newlyUnlocked: ['First Blood', 'Showed Up'],
    })
    const emojis = lines.map((l) => l.emoji)
    expect(emojis).toContain('🌅')
    expect(emojis).toContain('🧠')
    expect(emojis).toContain('🏗️')
    expect(emojis).toContain('🏋️')
    expect(emojis).toContain('📖')
    expect(emojis).toContain('📨')
    expect(emojis).toContain('🎁')
    expect(emojis).toContain('🎖️')
    expect(lines.find((l) => l.emoji === '🧠')?.label).toContain('3 solved')
    expect(lines.find((l) => l.emoji === '🎖️')?.label).toContain('First Blood')
  })
})

import { describe, it, expect } from 'vitest'
import { buildMorningBrief, type MorningBriefInput } from '@/lib/admin/prep/morning-brief'
import { buildLoadProfile, type LoadMode } from '@/lib/admin/prep/plan-adjust'

function input(overrides: Partial<MorningBriefInput> = {}): MorningBriefInput {
  return {
    date: '2026-06-07',
    planDayNum: 3,
    planDayTitle: 'Trees & Graphs',
    isMaintenance: false,
    isCarryingForward: false,
    loadProfile: buildLoadProfile('full'),
    codingPattern: 'BFS / DFS',
    codingTaskCount: 4,
    systemDesignTopic: 'URL Shortener',
    systemDesignAnchor: 'capacity → API → schema → scale',
    ...overrides,
  }
}

describe('buildMorningBrief — tone never shames a miss', () => {
  it('re-entry opening is calm + forward-looking', () => {
    const b = buildMorningBrief(input({ loadProfile: buildLoadProfile('re-entry') }))
    expect(b.openingLine).not.toMatch(/missed|failed|broke|behind|sorry/i)
    expect(b.edgeLine ?? '').not.toMatch(/missed|failed|broke|behind|sorry/i)
  })

  it('maintenance opening avoids program-completion language that reads punitive', () => {
    const b = buildMorningBrief(
      input({ loadProfile: buildLoadProfile('maintenance'), isMaintenance: true })
    )
    expect(b.openingLine).not.toMatch(/missed|failed|fell off/i)
    expect(b.todayLabel).toContain('Maintenance')
  })

  it('every load-mode opening + edge passes the shame-language ban', () => {
    const modes: LoadMode[] = ['full', 'core', 're-entry', 'maintenance']
    for (const m of modes) {
      const b = buildMorningBrief(input({ loadProfile: buildLoadProfile(m) }))
      const blob = b.openingLine + ' ' + (b.edgeLine ?? '')
      expect(blob).not.toMatch(/missed|failed|broke|sorry|behind|shame/i)
    }
  })
})

describe('buildMorningBrief — structure', () => {
  it('full-load brief shows coding + system design + applications', () => {
    const b = buildMorningBrief(input())
    const emojis = b.focusLines.map((l) => l.emoji)
    expect(emojis).toContain('🧠')
    expect(emojis).toContain('🏗️')
    expect(emojis).toContain('📨')
  })

  it('re-entry brief shows system design as stretch + 1 sprint label', () => {
    const b = buildMorningBrief(
      input({
        loadProfile: buildLoadProfile('re-entry'),
        codingTaskCount: 1,
      })
    )
    const coding = b.focusLines.find((l) => l.emoji === '🧠')
    expect(coding?.label).toMatch(/1 sprint\b/)
    const sd = b.focusLines.find((l) => l.emoji === '🏗️')
    expect(sd?.label).toMatch(/stretch/i)
  })

  it('appends "carried forward" when the slide kept us on an earlier day', () => {
    const b = buildMorningBrief(input({ isCarryingForward: true }))
    expect(b.todayLabel).toMatch(/carried forward/i)
  })

  it('quotes yesterday avoided line into the edge — truncated cleanly', () => {
    const b = buildMorningBrief(
      input({
        loadProfile: buildLoadProfile('re-entry'),
        yesterdayAvoided:
          'I avoided system design and spent the hour scrolling LinkedIn instead, then felt guilty about it for the rest of the night',
      })
    )
    expect(b.edgeLine).toMatch(/yesterday you noted/i)
    expect(b.edgeLine?.length).toBeLessThan(180)
    expect(b.edgeLine).toMatch(/…|"$|"\s/) // ends in ellipsis or quote
  })

  it('omits system-design line when load profile hides it', () => {
    const profile = { ...buildLoadProfile('full'), systemDesign: 'hidden' as const }
    const b = buildMorningBrief(input({ loadProfile: profile }))
    expect(b.focusLines.find((l) => l.emoji === '🏗️')).toBeUndefined()
  })

  it('subject prefix matches the load mode', () => {
    expect(
      buildMorningBrief(input({ loadProfile: buildLoadProfile('full') })).subjectPrefix
    ).toMatch(/full plate/i)
    expect(
      buildMorningBrief(input({ loadProfile: buildLoadProfile('re-entry') })).subjectPrefix
    ).toMatch(/on-ramp/i)
  })
})

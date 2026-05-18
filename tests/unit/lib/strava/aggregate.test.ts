import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import {
  groupSport,
  aggregateByYear,
  aggregateAllTime,
  aggregateLastFourWeeks,
  computeWeeklyStreak,
  sumYtdAchievements,
  biggestClimb,
  longestBySport,
} from '@/lib/strava/aggregate'
import type { StravaActivity } from '@/lib/strava/types'

function activity(over: Partial<StravaActivity>): StravaActivity {
  return {
    id: 1,
    name: 'Test',
    type: 'Run',
    sport_type: 'Run',
    start_date: '2026-05-15T10:00:00Z',
    start_date_local: '2026-05-15T03:00:00',
    distance: 0,
    moving_time: 0,
    elapsed_time: 0,
    total_elevation_gain: 0,
    average_speed: 0,
    max_speed: 0,
    kudos_count: 0,
    achievement_count: 0,
    ...over,
  }
}

describe('groupSport', () => {
  it.each([
    ['Run', 'Run'],
    ['TrailRun', 'Run'],
    ['VirtualRun', 'Run'],
    ['Hike', 'Hike'],
    ['Walk', 'Hike'],
    ['Ride', 'Ride'],
    ['VirtualRide', 'Ride'],
    ['GravelRide', 'Ride'],
    ['MountainBikeRide', 'Ride'],
    ['EBikeRide', 'Ride'],
    ['EMountainBikeRide', 'Ride'],
    ['Swim', 'Swim'],
    ['WeightTraining', 'Training'],
    ['Workout', 'Training'],
    ['CrossTraining', 'Training'],
    ['HighIntensityIntervalTraining', 'Training'],
    ['Yoga', 'Training'],
    ['Pilates', 'Training'],
    ['Crossfit', 'Training'],
    ['Soccer', 'Other'],
    ['SomethingUnknown', 'Other'],
  ])('maps %s → %s', (input, expected) => {
    expect(groupSport(input)).toBe(expected)
  })
})

describe('aggregateByYear', () => {
  const activities: StravaActivity[] = [
    activity({
      id: 1,
      sport_type: 'Hike',
      start_date_local: '2026-04-10T08:00:00',
      distance: 8000,
      moving_time: 7200,
      total_elevation_gain: 1500,
    }),
    activity({
      id: 2,
      sport_type: 'Hike',
      start_date_local: '2026-05-01T08:00:00',
      distance: 12000,
      moving_time: 10800,
      total_elevation_gain: 2000,
    }),
    activity({
      id: 3,
      sport_type: 'Run',
      start_date_local: '2026-05-05T08:00:00',
      distance: 5000,
      moving_time: 1500,
      total_elevation_gain: 50,
    }),
    activity({
      id: 4,
      sport_type: 'Hike',
      start_date_local: '2025-08-01T08:00:00',
      distance: 5000,
      moving_time: 4000,
      total_elevation_gain: 800,
    }),
  ]

  it('groups by sport and sums distance / time / elevation', () => {
    const result = aggregateByYear(activities, 2026)
    const hike = result.find((r) => r.sport === 'Hike')
    expect(hike).toBeDefined()
    expect(hike!.count).toBe(2)
    expect(hike!.distance).toBe(20000)
    expect(hike!.moving_time).toBe(18000)
    expect(hike!.elevation_gain).toBe(3500)
    expect(hike!.longest_distance).toBe(12000)
    expect(hike!.biggest_climb).toBe(2000)
  })

  it('skips activities outside the requested year', () => {
    const result = aggregateByYear(activities, 2026)
    const hike = result.find((r) => r.sport === 'Hike')
    expect(hike!.count).toBe(2) // not 3 — the 2025 hike excluded
  })

  it('sorts buckets by moving_time desc', () => {
    const result = aggregateByYear(activities, 2026)
    expect(result[0]!.sport).toBe('Hike') // longer moving_time than Run
    expect(result[1]!.sport).toBe('Run')
  })

  it('returns empty array when no activities match', () => {
    expect(aggregateByYear([], 2026)).toEqual([])
    expect(aggregateByYear(activities, 2030)).toEqual([])
  })
})

describe('aggregateAllTime', () => {
  it('sums every activity regardless of year', () => {
    const list = [
      activity({ distance: 1000, moving_time: 100, total_elevation_gain: 10 }),
      activity({ distance: 2000, moving_time: 200, total_elevation_gain: 20 }),
    ]
    const result = aggregateAllTime(list)
    expect(result).toEqual({
      count: 2,
      distance: 3000,
      moving_time: 300,
      elevation_gain: 30,
    })
  })

  it('returns zeros for empty list', () => {
    expect(aggregateAllTime([])).toEqual({
      count: 0,
      distance: 0,
      moving_time: 0,
      elevation_gain: 0,
    })
  })
})

describe('aggregateLastFourWeeks', () => {
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-18T12:00:00Z'))
  })
  afterAll(() => vi.useRealTimers())

  it('includes activities within the last 28 days only', () => {
    const list = [
      activity({
        start_date: '2026-05-15T10:00:00Z',
        distance: 1000,
        moving_time: 600,
        total_elevation_gain: 100,
      }),
      activity({
        start_date: '2026-04-25T10:00:00Z',
        distance: 2000,
        moving_time: 900,
        total_elevation_gain: 200,
      }),
      activity({
        start_date: '2026-03-01T10:00:00Z',
        distance: 9999,
        moving_time: 9999,
        total_elevation_gain: 9999,
      }),
    ]
    const result = aggregateLastFourWeeks(list)
    expect(result.count).toBe(2)
    expect(result.distance).toBe(3000)
    expect(result.activitiesPerWeek).toBe(0.5)
    expect(result.avgDistancePerWeek).toBe(750)
    expect(result.avgElevationPerWeek).toBe(75)
    expect(result.avgTimePerWeek).toBe(375)
  })

  it('returns all zeros for empty list', () => {
    const result = aggregateLastFourWeeks([])
    expect(result.count).toBe(0)
    expect(result.activitiesPerWeek).toBe(0)
  })
})

describe('computeWeeklyStreak', () => {
  it('returns 0 for empty input', () => {
    expect(computeWeeklyStreak([])).toBe(0)
  })

  it('returns 0 when the most recent activity is older than 14 days', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-18T12:00:00Z'))
    const list = [activity({ start_date: '2026-04-01T10:00:00Z', start_date_local: '2026-04-01' })]
    expect(computeWeeklyStreak(list)).toBe(0)
    vi.useRealTimers()
  })

  it('counts consecutive ISO weeks back from the most recent activity', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-18T12:00:00Z'))
    const list = [
      // W20 (May 11-17)
      activity({ id: 1, start_date: '2026-05-15T10:00:00Z', start_date_local: '2026-05-15' }),
      // W19 (May 4-10)
      activity({ id: 2, start_date: '2026-05-07T10:00:00Z', start_date_local: '2026-05-07' }),
      // W18 (Apr 27 - May 3)
      activity({ id: 3, start_date: '2026-04-30T10:00:00Z', start_date_local: '2026-04-30' }),
      // missing W17 — streak breaks
      // W16 (Apr 13-19) — exists but not consecutive
      activity({ id: 4, start_date: '2026-04-15T10:00:00Z', start_date_local: '2026-04-15' }),
    ]
    expect(computeWeeklyStreak(list)).toBe(3)
    vi.useRealTimers()
  })

  it('uses local-date strings to bucket weeks (TZ-independent)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-18T12:00:00Z'))
    // start_date in UTC could shift week; start_date_local is what we trust
    const list = [activity({ start_date: '2026-05-15T23:00:00Z', start_date_local: '2026-05-15' })]
    expect(computeWeeklyStreak(list)).toBe(1)
    vi.useRealTimers()
  })
})

describe('sumYtdAchievements', () => {
  it('sums achievement_count + pr_count for activities in the year', () => {
    // Mid-day timestamps so getFullYear() returns the same year in every TZ
    const list = [
      activity({ start_date_local: '2026-01-15T12:00:00', achievement_count: 5, pr_count: 2 }),
      activity({ start_date_local: '2026-06-01T12:00:00', achievement_count: 3, pr_count: 1 }),
      activity({ start_date_local: '2025-12-15T12:00:00', achievement_count: 99, pr_count: 99 }),
    ]
    expect(sumYtdAchievements(list, 2026)).toEqual({ achievements: 8, prs: 3 })
  })

  it('treats missing counts as 0', () => {
    const list = [activity({ start_date_local: '2026-05-15T12:00:00' })]
    expect(sumYtdAchievements(list, 2026)).toEqual({ achievements: 0, prs: 0 })
  })
})

describe('biggestClimb', () => {
  it('returns the max total_elevation_gain', () => {
    const list = [
      activity({ total_elevation_gain: 100 }),
      activity({ total_elevation_gain: 500 }),
      activity({ total_elevation_gain: 300 }),
    ]
    expect(biggestClimb(list)).toBe(500)
  })

  it('returns 0 for empty list', () => {
    expect(biggestClimb([])).toBe(0)
  })
})

describe('longestBySport', () => {
  it('returns the max distance for the given sport group only', () => {
    const list = [
      activity({ sport_type: 'Run', distance: 5000 }),
      activity({ sport_type: 'Run', distance: 10000 }),
      activity({ sport_type: 'Ride', distance: 50000 }),
    ]
    expect(longestBySport(list, 'Run')).toBe(10000)
    expect(longestBySport(list, 'Ride')).toBe(50000)
    expect(longestBySport(list, 'Swim')).toBe(0)
  })
})

import type { LastFourWeeks, SportGroup, SportTotals, StravaActivity, StravaTotals } from './types'

export function groupSport(sportType: string): SportGroup {
  switch (sportType) {
    case 'Run':
    case 'TrailRun':
    case 'VirtualRun':
      return 'Run'
    case 'Hike':
    case 'Walk':
      return 'Hike'
    case 'Ride':
    case 'VirtualRide':
    case 'GravelRide':
    case 'MountainBikeRide':
    case 'EBikeRide':
    case 'EMountainBikeRide':
      return 'Ride'
    case 'Swim':
      return 'Swim'
    case 'WeightTraining':
    case 'Workout':
    case 'CrossTraining':
    case 'HighIntensityIntervalTraining':
    case 'Yoga':
    case 'Pilates':
    case 'Crossfit':
      return 'Training'
    default:
      return 'Other'
  }
}

function emptyTotals(): StravaTotals {
  return { count: 0, distance: 0, moving_time: 0, elevation_gain: 0 }
}

export function aggregateByYear(activities: StravaActivity[], year: number): SportTotals[] {
  const buckets = new Map<SportGroup, SportTotals>()

  for (const act of activities) {
    if (new Date(act.start_date_local).getFullYear() !== year) continue
    const sport = groupSport(act.sport_type)
    const existing =
      buckets.get(sport) ??
      ({ sport, ...emptyTotals(), longest_distance: 0, biggest_climb: 0 } satisfies SportTotals)
    existing.count += 1
    existing.distance += act.distance
    existing.moving_time += act.moving_time
    existing.elevation_gain += act.total_elevation_gain
    if (act.distance > existing.longest_distance) existing.longest_distance = act.distance
    if (act.total_elevation_gain > existing.biggest_climb)
      existing.biggest_climb = act.total_elevation_gain
    buckets.set(sport, existing)
  }

  return Array.from(buckets.values()).sort((a, b) => b.moving_time - a.moving_time)
}

export function sumTotals(
  rows: ({ count?: number } & StravaTotals[]) | SportTotals[]
): StravaTotals {
  const list = Array.isArray(rows) ? rows : []
  return list.reduce<StravaTotals>(
    (acc, r) => ({
      count: acc.count + r.count,
      distance: acc.distance + r.distance,
      moving_time: acc.moving_time + r.moving_time,
      elevation_gain: acc.elevation_gain + r.elevation_gain,
    }),
    emptyTotals()
  )
}

export function aggregateAllTime(activities: StravaActivity[]): StravaTotals {
  return activities.reduce<StravaTotals>(
    (acc, a) => ({
      count: acc.count + 1,
      distance: acc.distance + a.distance,
      moving_time: acc.moving_time + a.moving_time,
      elevation_gain: acc.elevation_gain + a.total_elevation_gain,
    }),
    emptyTotals()
  )
}

export function aggregateLastFourWeeks(activities: StravaActivity[]): LastFourWeeks {
  const cutoff = Date.now() - 28 * 24 * 60 * 60 * 1000
  const recent = activities.filter((a) => new Date(a.start_date).getTime() >= cutoff)
  const totals = aggregateAllTime(recent)
  return {
    ...totals,
    activitiesPerWeek: totals.count / 4,
    avgDistancePerWeek: totals.distance / 4,
    avgElevationPerWeek: totals.elevation_gain / 4,
    avgTimePerWeek: totals.moving_time / 4,
  }
}

function isoWeekKey(d: Date): string {
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dayNum = tmp.getUTCDay() || 7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  const weekNum = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${tmp.getUTCFullYear()}-W${weekNum.toString().padStart(2, '0')}`
}

function parseLocalDate(localIso: string): Date {
  const [y, m, d] = localIso.slice(0, 10).split('-').map(Number) as [number, number, number]
  return new Date(Date.UTC(y, m - 1, d))
}

export function computeWeeklyStreak(activities: StravaActivity[]): number {
  if (activities.length === 0) return 0

  const sorted = [...activities].sort(
    (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  )
  const mostRecent = sorted[0]
  if (!mostRecent) return 0

  const twoWeeksMs = 14 * 24 * 60 * 60 * 1000
  if (Date.now() - new Date(mostRecent.start_date).getTime() > twoWeeksMs) return 0

  const weeks = new Set(activities.map((a) => isoWeekKey(parseLocalDate(a.start_date_local))))
  const cursor = parseLocalDate(mostRecent.start_date_local)
  let streak = 0
  for (;;) {
    const key = isoWeekKey(cursor)
    if (!weeks.has(key)) break
    streak += 1
    cursor.setUTCDate(cursor.getUTCDate() - 7)
  }
  return streak
}

export function sumYtdAchievements(activities: StravaActivity[], year: number) {
  let achievements = 0
  let prs = 0
  for (const a of activities) {
    if (new Date(a.start_date_local).getFullYear() !== year) continue
    achievements += a.achievement_count ?? 0
    prs += a.pr_count ?? 0
  }
  return { achievements, prs }
}

export function biggestClimb(activities: StravaActivity[]): number {
  return activities.reduce((max, a) => Math.max(max, a.total_elevation_gain), 0)
}

export function longestBySport(activities: StravaActivity[], sport: SportGroup): number {
  return activities
    .filter((a) => groupSport(a.sport_type) === sport)
    .reduce((max, a) => Math.max(max, a.distance), 0)
}

import 'server-only'
import {
  aggregateAllTime,
  aggregateByYear,
  aggregateLastFourWeeks,
  biggestClimb,
  computeWeeklyStreak,
  longestBySport,
  sumTotals,
  sumYtdAchievements,
} from './aggregate'
import type { StravaActivity, StravaAthlete, StravaDashboardData } from './types'

const STRAVA_API = 'https://www.strava.com/api/v3'
const STRAVA_OAUTH = 'https://www.strava.com/api/v3/oauth/token'
const PER_PAGE = 200
const MAX_PAGES = 10

type TokenResponse = {
  token_type: string
  access_token: string
  expires_at: number
  expires_in: number
  refresh_token: string
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

async function getAccessToken(): Promise<string> {
  const res = await fetch(STRAVA_OAUTH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: requireEnv('STRAVA_CLIENT_ID'),
      client_secret: requireEnv('STRAVA_CLIENT_SECRET'),
      refresh_token: requireEnv('STRAVA_REFRESH_TOKEN'),
      grant_type: 'refresh_token',
    }),
    next: { revalidate: 18000 },
  })

  if (!res.ok) {
    throw new Error(`Strava token refresh failed: ${res.status} ${res.statusText}`)
  }

  const data = (await res.json()) as TokenResponse
  return data.access_token
}

async function stravaFetch<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${STRAVA_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    throw new Error(`Strava API ${path} failed: ${res.status} ${res.statusText}`)
  }

  return (await res.json()) as T
}

async function fetchAllActivities(accessToken: string): Promise<StravaActivity[]> {
  const all: StravaActivity[] = []
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const batch = await stravaFetch<StravaActivity[]>(
      `/athlete/activities?per_page=${PER_PAGE}&page=${page}`,
      accessToken
    )
    all.push(...batch)
    if (batch.length < PER_PAGE) break
  }
  return all
}

export async function getStravaDashboard(): Promise<StravaDashboardData> {
  const accessToken = await getAccessToken()
  const athlete = await stravaFetch<StravaAthlete>('/athlete', accessToken)
  const activities = await fetchAllActivities(accessToken)

  const year = new Date().getFullYear()
  const ytdBySport = aggregateByYear(activities, year)
  const ytdTotal = sumTotals(ytdBySport)
  const allTimeTotal = aggregateAllTime(activities)
  const lastFourWeeks = aggregateLastFourWeeks(activities)
  const streakWeeks = computeWeeklyStreak(activities)
  const { achievements, prs } = sumYtdAchievements(activities, year)
  const biggestClimbMeters = biggestClimb(activities)
  const longestRunMeters = longestBySport(activities, 'Run')
  const longestRideMeters = longestBySport(activities, 'Ride')

  const recentActivities = [...activities]
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
    .slice(0, 10)

  return {
    athlete,
    ytdBySport,
    ytdTotal,
    allTimeTotal,
    lastFourWeeks,
    streakWeeks,
    ytdPrCount: prs,
    ytdAchievementCount: achievements,
    biggestClimbEverFt: biggestClimbMeters,
    longestRunMi: longestRunMeters,
    longestRideMi: longestRideMeters,
    recentActivities,
    fetchedAt: new Date().toISOString(),
  }
}

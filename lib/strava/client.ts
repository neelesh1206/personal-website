import 'server-only'
import type {
  StravaActivity,
  StravaAthlete,
  StravaAthleteStats,
  StravaDashboardData,
} from './types'

const STRAVA_API = 'https://www.strava.com/api/v3'
const STRAVA_OAUTH = 'https://www.strava.com/api/v3/oauth/token'

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

export async function getStravaDashboard(): Promise<StravaDashboardData> {
  const accessToken = await getAccessToken()

  const athlete = await stravaFetch<StravaAthlete>('/athlete', accessToken)
  const [stats, recentActivities] = await Promise.all([
    stravaFetch<StravaAthleteStats>(`/athletes/${athlete.id}/stats`, accessToken),
    stravaFetch<StravaActivity[]>('/athlete/activities?per_page=10', accessToken),
  ])

  return {
    athlete,
    stats,
    recentActivities,
    fetchedAt: new Date().toISOString(),
  }
}

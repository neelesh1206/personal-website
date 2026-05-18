export type StravaAthlete = {
  id: number
  firstname: string
  lastname: string
  city: string | null
  state: string | null
  country: string | null
  profile: string
  profile_medium: string
}

export type StravaActivity = {
  id: number
  name: string
  type: string
  sport_type: string
  start_date: string
  start_date_local: string
  distance: number
  moving_time: number
  elapsed_time: number
  total_elevation_gain: number
  average_speed: number
  max_speed: number
  average_heartrate?: number
  max_heartrate?: number
  kudos_count: number
  achievement_count: number
  pr_count?: number
}

export type StravaTotals = {
  count: number
  distance: number
  moving_time: number
  elevation_gain: number
}

export type StravaAthleteStats = {
  biggest_ride_distance: number | null
  biggest_climb_elevation_gain: number | null
  recent_run_totals: StravaTotals
  recent_ride_totals: StravaTotals
  recent_swim_totals: StravaTotals
  ytd_run_totals: StravaTotals
  ytd_ride_totals: StravaTotals
  ytd_swim_totals: StravaTotals
  all_run_totals: StravaTotals
  all_ride_totals: StravaTotals
  all_swim_totals: StravaTotals
}

export type SportGroup = 'Run' | 'Hike' | 'Ride' | 'Swim' | 'Training' | 'Other'

export type SportTotals = StravaTotals & {
  sport: SportGroup
  longest_distance: number
  biggest_climb: number
}

export type LastFourWeeks = {
  count: number
  distance: number
  moving_time: number
  elevation_gain: number
  activitiesPerWeek: number
  avgDistancePerWeek: number
  avgElevationPerWeek: number
  avgTimePerWeek: number
}

export type StravaDashboardData = {
  athlete: StravaAthlete
  ytdBySport: SportTotals[]
  ytdTotal: StravaTotals
  allTimeTotal: StravaTotals
  lastFourWeeks: LastFourWeeks
  streakWeeks: number
  ytdPrCount: number
  ytdAchievementCount: number
  biggestClimbEverFt: number
  longestRunMi: number
  longestRideMi: number
  recentActivities: StravaActivity[]
  fetchedAt: string
}

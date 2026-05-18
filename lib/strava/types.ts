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

export type StravaActivityType =
  | 'Run'
  | 'Ride'
  | 'Hike'
  | 'Walk'
  | 'Swim'
  | 'WeightTraining'
  | 'Workout'
  | 'Yoga'
  | 'VirtualRide'
  | 'TrailRun'
  | string

export type StravaActivity = {
  id: number
  name: string
  type: StravaActivityType
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
}

export type StravaTotals = {
  count: number
  distance: number
  moving_time: number
  elevation_gain: number
}

export type StravaAthleteStats = {
  biggest_ride_distance: number
  biggest_climb_elevation_gain: number
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

export type StravaDashboardData = {
  athlete: StravaAthlete
  stats: StravaAthleteStats
  recentActivities: StravaActivity[]
  fetchedAt: string
}

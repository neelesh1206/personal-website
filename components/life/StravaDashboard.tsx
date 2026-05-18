import Image from 'next/image'
import { Activity, MapPin, Mountain, TrendingUp } from 'lucide-react'
import type { StravaActivity, StravaDashboardData } from '@/lib/strava/types'
import {
  formatActivityDate,
  formatDistance,
  formatDuration,
  formatElevation,
  formatPace,
  formatSpeed,
} from '@/lib/strava/format'
import { cn } from '@/lib/utils'

function StatCard({
  icon: Icon,
  label,
  primary,
  secondary,
}: {
  icon: typeof Activity
  label: string
  primary: string
  secondary?: string
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        <Icon size={14} />
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {primary}
      </div>
      {secondary ? (
        <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{secondary}</div>
      ) : null}
    </div>
  )
}

function activityAccent(type: string): string {
  if (type === 'Run' || type === 'TrailRun')
    return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
  if (type === 'Ride' || type === 'VirtualRide')
    return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
  if (type === 'Hike')
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
  if (type === 'WeightTraining' || type === 'Workout')
    return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
  if (type === 'Swim') return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
  return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
}

function ActivityRow({ activity }: { activity: StravaActivity }) {
  const isDistanceSport = activity.distance > 0
  const pace =
    activity.type === 'Run' || activity.type === 'TrailRun' || activity.type === 'Hike'
      ? formatPace(activity.average_speed)
      : formatSpeed(activity.average_speed)

  return (
    <li className="flex items-start justify-between gap-4 border-b border-zinc-100 py-4 last:border-b-0 dark:border-zinc-900">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              activityAccent(activity.type)
            )}
          >
            {activity.sport_type || activity.type}
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {formatActivityDate(activity.start_date_local)}
          </span>
        </div>
        <p className="mt-2 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {activity.name}
        </p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          {isDistanceSport ? <span>{formatDistance(activity.distance)}</span> : null}
          <span>{formatDuration(activity.moving_time)}</span>
          {isDistanceSport ? <span>{pace}</span> : null}
          {activity.total_elevation_gain > 0 ? (
            <span>↑ {formatElevation(activity.total_elevation_gain)}</span>
          ) : null}
        </div>
      </div>
    </li>
  )
}

export function StravaDashboard({ data }: { data: StravaDashboardData }) {
  const { athlete, stats, recentActivities, fetchedAt } = data

  return (
    <div className="space-y-8">
      {/* Athlete header */}
      <div className="flex items-center gap-4">
        <Image
          src={athlete.profile_medium}
          alt={`${athlete.firstname} ${athlete.lastname}`}
          width={56}
          height={56}
          className="rounded-full border border-zinc-200 dark:border-zinc-800"
          unoptimized
        />
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">
            {athlete.firstname} {athlete.lastname}
          </p>
          <p className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
            <MapPin size={12} />
            {[athlete.city, athlete.state].filter(Boolean).join(', ')}
          </p>
        </div>
        <a
          href={`https://www.strava.com/athletes/${athlete.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-orange-400 hover:text-orange-600 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-orange-600 dark:hover:text-orange-400"
        >
          View on Strava →
        </a>
      </div>

      {/* YTD stats */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Year to date · {new Date().getFullYear()}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={Activity}
            label="Run"
            primary={formatDistance(stats.ytd_run_totals.distance)}
            secondary={`${stats.ytd_run_totals.count} activities`}
          />
          <StatCard
            icon={TrendingUp}
            label="Ride"
            primary={formatDistance(stats.ytd_ride_totals.distance)}
            secondary={`${stats.ytd_ride_totals.count} activities`}
          />
          <StatCard
            icon={Mountain}
            label="Elevation"
            primary={formatElevation(
              stats.ytd_run_totals.elevation_gain + stats.ytd_ride_totals.elevation_gain
            )}
            secondary="climbed"
          />
          <StatCard
            icon={Activity}
            label="Moving time"
            primary={formatDuration(
              stats.ytd_run_totals.moving_time + stats.ytd_ride_totals.moving_time
            )}
          />
        </div>
      </div>

      {/* All-time stats */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          All time
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            icon={Activity}
            label="Total runs"
            primary={stats.all_run_totals.count.toLocaleString()}
            secondary={formatDistance(stats.all_run_totals.distance)}
          />
          <StatCard
            icon={TrendingUp}
            label="Total rides"
            primary={stats.all_ride_totals.count.toLocaleString()}
            secondary={formatDistance(stats.all_ride_totals.distance)}
          />
          <StatCard
            icon={Mountain}
            label="Biggest climb"
            primary={formatElevation(stats.biggest_climb_elevation_gain)}
            secondary={`Longest ride: ${formatDistance(stats.biggest_ride_distance)}`}
          />
        </div>
      </div>

      {/* Recent activities */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Recent activity
        </h3>
        {recentActivities.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No recent activities.</p>
        ) : (
          <ul className="rounded-lg border border-zinc-200 px-5 dark:border-zinc-800">
            {recentActivities.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        Data fetched from Strava API · cached server-side · updated{' '}
        {new Intl.DateTimeFormat('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(fetchedAt))}
      </p>
    </div>
  )
}

export function StravaDashboardError({ error }: { error: string }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm dark:border-amber-900/50 dark:bg-amber-950/20">
      <p className="font-medium text-amber-900 dark:text-amber-200">
        Strava data is taking a breather.
      </p>
      <p className="mt-1 text-amber-700 dark:text-amber-300/80">{error}</p>
    </div>
  )
}

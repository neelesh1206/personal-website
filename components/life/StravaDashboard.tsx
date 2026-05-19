import Image from 'next/image'
import { FetchedAt } from './FetchedAt'
import {
  Activity,
  Award,
  Calendar,
  Dumbbell,
  Flame,
  Footprints,
  MapPin,
  Mountain,
  TrendingUp,
  Trophy,
  Waves,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type {
  SportGroup,
  SportTotals,
  StravaActivity,
  StravaDashboardData,
} from '@/lib/strava/types'
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
  accent,
}: {
  icon: LucideIcon
  label: string
  primary: string
  secondary?: string
  accent?: string
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
      <div
        className={cn(
          'flex items-center gap-2 text-xs font-medium uppercase tracking-wider',
          accent ?? 'text-zinc-500 dark:text-zinc-400'
        )}
      >
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

const SPORT_META: Record<
  SportGroup,
  { icon: LucideIcon; label: string; accent: string; chip: string }
> = {
  Run: {
    icon: Footprints,
    label: 'Run',
    accent: 'text-orange-600 dark:text-orange-400',
    chip: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  Hike: {
    icon: Mountain,
    label: 'Hike',
    accent: 'text-emerald-600 dark:text-emerald-400',
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  Ride: {
    icon: TrendingUp,
    label: 'Ride',
    accent: 'text-sky-600 dark:text-sky-400',
    chip: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  },
  Swim: {
    icon: Waves,
    label: 'Swim',
    accent: 'text-cyan-600 dark:text-cyan-400',
    chip: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  },
  Training: {
    icon: Dumbbell,
    label: 'Training',
    accent: 'text-violet-600 dark:text-violet-400',
    chip: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  },
  Other: {
    icon: Activity,
    label: 'Other',
    accent: 'text-zinc-600 dark:text-zinc-400',
    chip: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  },
}

function SportCard({ totals }: { totals: SportTotals }) {
  const meta = SPORT_META[totals.sport]
  const isDistance = totals.distance > 0
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div
        className={cn(
          'flex items-center gap-2 text-xs font-semibold uppercase tracking-wider',
          meta.accent
        )}
      >
        <meta.icon size={14} />
        {meta.label}
      </div>
      <div className="mt-3 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {isDistance ? formatDistance(totals.distance) : formatDuration(totals.moving_time)}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        <span>{totals.count} activities</span>
        {totals.elevation_gain > 0 ? <span>↑ {formatElevation(totals.elevation_gain)}</span> : null}
        {isDistance ? <span>{formatDuration(totals.moving_time)}</span> : null}
      </div>
    </div>
  )
}

function ActivityRow({ activity }: { activity: StravaActivity }) {
  const isDistanceSport = activity.distance > 0
  const sport =
    SPORT_META[
      ((activity.sport_type as SportGroup) in SPORT_META
        ? (activity.sport_type as SportGroup)
        : 'Other') as SportGroup
    ]
  const pace =
    activity.type === 'Run' || activity.type === 'TrailRun' || activity.type === 'Hike'
      ? formatPace(activity.average_speed)
      : formatSpeed(activity.average_speed)

  return (
    <li className="flex items-start justify-between gap-4 border-b border-zinc-100 py-4 last:border-b-0 dark:border-zinc-900">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', sport.chip)}>
            {activity.sport_type || activity.type}
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {formatActivityDate(activity.start_date_local)}
          </span>
          {activity.achievement_count > 0 ? (
            <span className="flex items-center gap-0.5 text-xs text-amber-600 dark:text-amber-400">
              <Trophy size={11} />
              {activity.achievement_count}
            </span>
          ) : null}
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
  const {
    athlete,
    ytdBySport,
    ytdTotal,
    allTimeTotal,
    lastFourWeeks,
    streakWeeks,
    ytdAchievementCount,
    biggestClimbEverFt,
    longestRunMi,
    longestRideMi,
    recentActivities,
    fetchedAt,
  } = data

  const year = new Date().getFullYear()

  return (
    <div className="space-y-10">
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

      {/* Last 4 weeks */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Last 4 weeks
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={Calendar}
            label="Activities / wk"
            primary={lastFourWeeks.activitiesPerWeek.toFixed(1)}
            secondary={`${lastFourWeeks.count} total`}
          />
          <StatCard
            icon={Activity}
            label="Distance / wk"
            primary={formatDistance(lastFourWeeks.avgDistancePerWeek)}
          />
          <StatCard
            icon={Mountain}
            label="Elevation / wk"
            primary={formatElevation(lastFourWeeks.avgElevationPerWeek)}
          />
          <StatCard
            icon={Flame}
            label="Time / wk"
            primary={formatDuration(Math.round(lastFourWeeks.avgTimePerWeek))}
          />
        </div>
      </section>

      {/* Year to date — by sport */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Year to date · {year}
          </h3>
          <div className="flex gap-4 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
            <span>
              <strong className="text-zinc-900 dark:text-zinc-50">{ytdTotal.count}</strong>{' '}
              activities
            </span>
            <span>
              <strong className="text-zinc-900 dark:text-zinc-50">
                {formatDistance(ytdTotal.distance)}
              </strong>
            </span>
            <span>
              <strong className="text-zinc-900 dark:text-zinc-50">
                {formatElevation(ytdTotal.elevation_gain)}
              </strong>{' '}
              ↑
            </span>
          </div>
        </div>
        {ytdBySport.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No activities logged this year yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {ytdBySport.map((s) => (
              <SportCard key={s.sport} totals={s} />
            ))}
          </div>
        )}
      </section>

      {/* Streak + PRs + records */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Records & momentum
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={Flame}
            label="Active streak"
            primary={`${streakWeeks} wk`}
            secondary="consecutive weeks"
            accent="text-orange-600 dark:text-orange-400"
          />
          <StatCard
            icon={Award}
            label="Achievements YTD"
            primary={ytdAchievementCount.toLocaleString()}
            secondary="PRs + medals"
            accent="text-amber-600 dark:text-amber-400"
          />
          <StatCard
            icon={Mountain}
            label="Biggest climb"
            primary={formatElevation(biggestClimbEverFt)}
            secondary="single activity"
          />
          <StatCard
            icon={Footprints}
            label="Longest"
            primary={
              longestRunMi > 0
                ? formatDistance(longestRunMi)
                : longestRideMi > 0
                  ? formatDistance(longestRideMi)
                  : '—'
            }
            secondary={longestRunMi >= longestRideMi ? 'run' : 'ride'}
          />
        </div>
      </section>

      {/* All time */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          All time
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={Activity}
            label="Activities"
            primary={allTimeTotal.count.toLocaleString()}
          />
          <StatCard
            icon={TrendingUp}
            label="Distance"
            primary={formatDistance(allTimeTotal.distance)}
          />
          <StatCard
            icon={Mountain}
            label="Elevation"
            primary={formatElevation(allTimeTotal.elevation_gain)}
          />
          <StatCard
            icon={Flame}
            label="Moving time"
            primary={formatDuration(allTimeTotal.moving_time)}
          />
        </div>
      </section>

      {/* Recent activities */}
      <section>
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
      </section>

      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        Data fetched from Strava API · cached server-side · updated <FetchedAt iso={fetchedAt} />
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

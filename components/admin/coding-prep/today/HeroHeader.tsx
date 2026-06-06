'use client'

import { Flame, Calendar, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SettingsDialog } from './SettingsDialog'
import type { SettingsMap } from '@/lib/admin/prep/types'
import { cn } from '@/lib/utils'

export function HeroHeader({
  dateLabel,
  dayNum,
  totalDays,
  planTheme,
  studyStreak,
  trainStreak,
  evidenceLine,
  settings,
  onSettingsSaved,
}: {
  dateLabel: string
  dayNum: number | null
  totalDays: number
  planTheme?: string
  studyStreak: number
  trainStreak: number
  evidenceLine?: string
  settings: SettingsMap
  onSettingsSaved: (s: SettingsMap) => void
}) {
  const dayPct = dayNum ? Math.min(100, Math.round((dayNum / totalDays) * 100)) : 0
  const showProgram = dayNum !== null && dayNum >= 1 && dayNum <= totalDays

  return (
    <section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-indigo-50 via-white to-amber-50 px-6 py-7 sm:px-8 sm:py-9 dark:border-zinc-800 dark:from-indigo-950/30 dark:via-zinc-950/40 dark:to-amber-950/20">
      <div className="relative flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
            <Calendar className="h-3 w-3" /> {dateLabel}
          </p>

          {showProgram ? (
            <h2
              style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
              className="mt-2 text-4xl leading-tight text-zinc-900 sm:text-5xl dark:text-zinc-50"
            >
              Day <span className="font-semibold tabular-nums">{dayNum}</span>
              <span className="text-zinc-400 dark:text-zinc-600"> / {totalDays}</span>
            </h2>
          ) : (
            <h2
              style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
              className="mt-2 text-4xl leading-tight text-zinc-900 sm:text-5xl dark:text-zinc-50"
            >
              Free practice
            </h2>
          )}

          {planTheme ? (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{planTheme}</p>
          ) : null}

          {evidenceLine ? (
            <p
              style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
              className="mt-4 max-w-xl border-l-2 border-amber-400 pl-3 text-base italic text-zinc-700 sm:text-lg dark:border-amber-500 dark:text-zinc-300"
            >
              {evidenceLine}
            </p>
          ) : (
            <p className="mt-4 max-w-xl text-sm text-zinc-500 dark:text-zinc-500">
              Add your evidence line in Settings — one sentence reminding you of a hard thing you’ve
              already done.
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-3">
          <SettingsDialog
            initialSettings={settings}
            onSaved={onSettingsSaved}
            trigger={
              <Button variant="ghost" size="sm" className="-mr-1 -mt-1">
                <Settings className="mr-1.5 h-3.5 w-3.5" /> Settings
              </Button>
            }
          />
          <div className="flex gap-3">
            <StreakChip label="Study" value={studyStreak} active />
            <StreakChip label="Gym" value={trainStreak} />
          </div>
        </div>
      </div>

      {showProgram ? (
        <div className="relative mt-6">
          <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <span>Plan progress</span>
            <span>{dayPct}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-200/70 dark:bg-zinc-800/70">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-amber-500 transition-all duration-700"
              style={{ width: `${dayPct}%` }}
            />
          </div>
        </div>
      ) : null}
    </section>
  )
}

function StreakChip({ label, value, active }: { label: string; value: number; active?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
        active && value > 0
          ? 'border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-700 dark:bg-orange-950/40 dark:text-orange-200'
          : 'border-zinc-200 bg-white/60 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300'
      )}
    >
      <Flame
        className={cn(
          'h-3.5 w-3.5',
          active && value > 0 ? 'text-orange-500' : 'text-zinc-400 dark:text-zinc-600'
        )}
      />
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="font-semibold tabular-nums">{value}d</span>
    </div>
  )
}

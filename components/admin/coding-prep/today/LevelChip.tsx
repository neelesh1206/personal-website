'use client'

import { Star } from 'lucide-react'
import { computeLevel, type LevelName } from '@/lib/admin/prep/xp'
import { cn } from '@/lib/utils'

const LEVEL_STYLE: Record<LevelName, string> = {
  Apprentice: 'from-zinc-300 to-zinc-500 text-zinc-900',
  Practitioner: 'from-sky-400 to-indigo-500 text-white',
  Senior: 'from-violet-500 to-fuchsia-500 text-white',
  Staff: 'from-amber-400 via-yellow-500 to-amber-600 text-white',
}

export function LevelChip({ totalXp, compact = false }: { totalXp: number; compact?: boolean }) {
  const info = computeLevel(totalXp)
  const style = LEVEL_STYLE[info.level]

  if (compact) {
    return (
      <div
        title={`${info.level} · ${info.totalXp} XP`}
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-gradient-to-r px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm',
          style
        )}
      >
        <Star className="h-2.5 w-2.5" />
        {info.level}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold shadow-sm',
          style
        )}
      >
        <Star className="h-3 w-3" />
        <span>{info.level}</span>
        <span className="font-normal opacity-80">· {info.totalXp} XP</span>
      </div>
      {info.xpToNext !== null ? (
        <div className="w-32 sm:w-40">
          <div className="flex justify-between text-[9px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <span>{info.progressPct}%</span>
            <span>{info.xpToNext} to next</span>
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-zinc-200/70 dark:bg-zinc-800/70">
            <div
              className={cn(
                'h-full rounded-full bg-gradient-to-r transition-all duration-500',
                style
              )}
              style={{ width: `${Math.max(2, info.progressPct)}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
          Max tier reached
        </p>
      )}
    </div>
  )
}

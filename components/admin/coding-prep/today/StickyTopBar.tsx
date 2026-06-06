'use client'

import { useEffect, useState } from 'react'
import { Flame, Dumbbell } from 'lucide-react'
import { computeLevel } from '@/lib/admin/prep/xp'
import { cn } from '@/lib/utils'

/**
 * Slim sticky bar shown only after the user scrolls past the hero
 * header. Compresses Day N/10 · percentage · study + gym streak chips
 * into a single thumb-friendly row that survives any scroll position
 * on either mobile or desktop.
 */
export function StickyTopBar({
  dayNum,
  totalDays,
  percent,
  studyStreak,
  trainStreak,
  totalXp,
}: {
  dayNum: number | null
  totalDays: number
  percent: number
  studyStreak: number
  trainStreak: number
  totalXp: number
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const level = computeLevel(totalXp).level

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        'pointer-events-none fixed left-1/2 top-2 z-30 w-[min(960px,calc(100vw-1rem))] -translate-x-1/2 transition-all duration-200',
        visible ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
      )}
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-zinc-200 bg-white/85 px-3 py-1.5 shadow-md backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/85">
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
          {dayNum ? `Day ${dayNum}/${totalDays}` : 'Free'}
        </span>
        <span className="hidden text-xs font-medium text-zinc-600 sm:inline dark:text-zinc-300">
          {level}
        </span>
        <div className="ml-1 flex-1 overflow-hidden rounded-full bg-zinc-200/70 dark:bg-zinc-800/70">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-amber-500 transition-all"
            style={{ width: `${Math.max(2, percent)}%` }}
          />
        </div>
        <span className="text-[10px] font-semibold tabular-nums text-zinc-500 dark:text-zinc-400">
          {percent}%
        </span>
        <div className="flex items-center gap-1.5 border-l border-zinc-200 pl-2 dark:border-zinc-800">
          <span
            className={cn(
              'flex items-center gap-0.5 text-[11px] font-semibold tabular-nums',
              studyStreak > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-500'
            )}
          >
            <Flame className="h-3 w-3" /> {studyStreak}
          </span>
          <span
            className={cn(
              'flex items-center gap-0.5 text-[11px] font-semibold tabular-nums',
              trainStreak > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500'
            )}
          >
            <Dumbbell className="h-3 w-3" /> {trainStreak}
          </span>
        </div>
      </div>
    </div>
  )
}

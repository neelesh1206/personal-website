'use client'

import { motion } from 'framer-motion'
import {
  Lock,
  Target,
  Flame,
  Zap,
  Crown,
  Dumbbell,
  Shield,
  Send,
  Inbox,
  Rocket,
  Brain,
  RotateCcw,
  Sunrise,
  Flag,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Badge } from '@/lib/admin/prep/badges-data'

// Lookup table — keep in sync with the `icon` field on Badge. If a badge
// references an icon that isn't in this map, BadgeWall falls back to
// Trophy. Adding a new icon = add an import + an entry here.
const ICONS: Record<string, LucideIcon> = {
  Target,
  Flame,
  Zap,
  Crown,
  Dumbbell,
  Shield,
  Send,
  Inbox,
  Rocket,
  Brain,
  RotateCcw,
  Sunrise,
  Flag,
  Trophy,
}

type TierStyle = {
  /** Gradient on the circular icon medallion. */
  medallion: string
  /** Color of the icon glyph inside the medallion. */
  glyph: string
  /** Soft ring around the medallion (lifts it off the card). */
  ring: string
  /** Outer card border. */
  border: string
  /** Outer card background tint. */
  bg: string
  /** Color of the badge name. */
  nameText: string
}

const TIERS: Record<string, TierStyle> = {
  bronze: {
    medallion: 'bg-gradient-to-br from-amber-300 via-orange-400 to-amber-600',
    glyph: 'text-white',
    ring: 'ring-amber-200/60 dark:ring-amber-900/60',
    border: 'border-amber-200 dark:border-amber-900/60',
    bg: 'bg-gradient-to-b from-amber-50/70 to-white dark:from-amber-950/20 dark:to-zinc-900/40',
    nameText: 'text-amber-900 dark:text-amber-200',
  },
  silver: {
    medallion: 'bg-gradient-to-br from-slate-200 via-zinc-300 to-slate-500',
    glyph: 'text-white',
    ring: 'ring-zinc-200/60 dark:ring-zinc-700/60',
    border: 'border-zinc-200 dark:border-zinc-700/60',
    bg: 'bg-gradient-to-b from-zinc-50/70 to-white dark:from-zinc-900/40 dark:to-zinc-900/30',
    nameText: 'text-zinc-900 dark:text-zinc-100',
  },
  gold: {
    medallion: 'bg-gradient-to-br from-yellow-200 via-yellow-400 to-amber-500',
    glyph: 'text-white',
    ring: 'ring-yellow-200/60 dark:ring-yellow-900/60',
    border: 'border-yellow-200 dark:border-yellow-900/60',
    bg: 'bg-gradient-to-b from-yellow-50/70 to-white dark:from-yellow-950/20 dark:to-zinc-900/40',
    nameText: 'text-yellow-900 dark:text-yellow-200',
  },
  iron: {
    medallion: 'bg-gradient-to-br from-rose-400 via-red-500 to-rose-700',
    glyph: 'text-white',
    ring: 'ring-rose-200/60 dark:ring-rose-900/60',
    border: 'border-rose-200 dark:border-rose-900/60',
    bg: 'bg-gradient-to-b from-rose-50/70 to-white dark:from-rose-950/20 dark:to-zinc-900/40',
    nameText: 'text-rose-900 dark:text-rose-200',
  },
}

const LOCKED: TierStyle = {
  medallion: 'bg-zinc-100 dark:bg-zinc-800',
  glyph: 'text-zinc-400 dark:text-zinc-600',
  ring: 'ring-zinc-100/60 dark:ring-zinc-800/60',
  border: 'border-zinc-200/70 dark:border-zinc-800/70',
  bg: 'bg-zinc-50/40 dark:bg-zinc-900/30',
  nameText: 'text-zinc-500 dark:text-zinc-500',
}

export function BadgeWall({
  badges,
  unlockedIds,
  variant = 'admin',
}: {
  badges: Badge[]
  unlockedIds: Set<string>
  variant?: 'admin' | 'public'
}) {
  const showLocked = variant === 'admin'
  const list = showLocked ? badges : badges.filter((b) => unlockedIds.has(b.id))

  if (!showLocked && list.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Badges show up here as the work gets done.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {list.map((b, i) => {
        const unlocked = unlockedIds.has(b.id)
        const tier = b.tier ?? 'bronze'
        const style = unlocked ? TIERS[tier]! : LOCKED
        const Icon = ICONS[b.icon] ?? Trophy

        return (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card
              className={cn(
                'group relative flex h-full flex-col items-center gap-2 border p-4 text-center transition-all duration-300',
                style.border,
                style.bg,
                unlocked && 'hover:-translate-y-0.5 hover:shadow-md'
              )}
            >
              <div
                className={cn(
                  'relative grid h-14 w-14 place-items-center rounded-full shadow-sm ring-4 transition-transform duration-300',
                  style.medallion,
                  style.ring,
                  unlocked && 'group-hover:scale-110'
                )}
              >
                <Icon
                  className={cn('h-6 w-6 drop-shadow-sm', style.glyph)}
                  strokeWidth={2.2}
                  aria-hidden
                />
                {!unlocked ? (
                  <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-400 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500">
                    <Lock className="h-2.5 w-2.5" />
                  </span>
                ) : null}
              </div>
              <p
                className={cn('mt-1 text-xs font-semibold leading-tight', style.nameText)}
                title={b.description}
              >
                {b.name}
              </p>
              <p className="text-[10px] leading-snug text-zinc-500 dark:text-zinc-400">
                {b.tagline}
              </p>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

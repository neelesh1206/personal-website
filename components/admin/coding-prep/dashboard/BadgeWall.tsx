'use client'

import { motion } from 'framer-motion'
import { Lock, Trophy } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Badge } from '@/lib/admin/prep/badges-data'

const TIER_COLORS: Record<string, string> = {
  bronze:
    'text-amber-700 border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  silver:
    'text-zinc-700 border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-200',
  gold: 'text-yellow-700 border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-200',
  iron: 'text-rose-700 border-rose-300 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-200',
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
        return (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card
              className={cn(
                'flex h-full flex-col gap-1 border p-3',
                unlocked
                  ? TIER_COLORS[tier]
                  : 'border-zinc-200 bg-zinc-50/60 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-600'
              )}
            >
              <div className="flex items-center gap-1.5">
                {unlocked ? <Trophy className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                <p className="text-xs font-semibold leading-tight">{b.name}</p>
              </div>
              <p className="text-[11px] leading-snug opacity-80">{b.tagline}</p>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

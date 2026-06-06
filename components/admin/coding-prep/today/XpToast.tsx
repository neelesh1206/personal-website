'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export type XpToastItem = {
  id: string
  /** How much XP just credited. Always positive when shown. */
  xp: number
  /** If non-null, this grant just bumped the level. */
  levelUp?: string | null
}

export function XpToastStack({
  items,
  onDone,
}: {
  items: XpToastItem[]
  onDone: (id: string) => void
}) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-20 z-40 mx-auto flex max-w-md flex-col items-center gap-2 px-4 sm:top-24"
    >
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            onAnimationComplete={() => {
              window.setTimeout(() => onDone(t.id), t.levelUp ? 3200 : 1800)
            }}
            className={cn(
              'pointer-events-auto flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold shadow-lg backdrop-blur',
              t.levelUp
                ? 'border-amber-300 bg-amber-50/95 text-amber-900 dark:border-amber-700 dark:bg-amber-950/90 dark:text-amber-200'
                : 'border-indigo-200 bg-white/95 text-indigo-900 dark:border-indigo-800 dark:bg-zinc-900/90 dark:text-indigo-200'
            )}
          >
            {t.levelUp ? (
              <>
                <Star className="h-4 w-4 fill-amber-500 text-amber-600" />
                <span className="font-bold">Level up · {t.levelUp}</span>
                <span className="text-xs font-normal text-amber-700/90 dark:text-amber-300/80">
                  +{t.xp} XP
                </span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                <span>+{t.xp} XP</span>
              </>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

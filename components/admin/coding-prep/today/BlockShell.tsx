'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ChevronDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * Visual wrapper around a routine block. Two concerns:
 *
 * 1. **Done collapse** — when `isDone`, the block shrinks to a slim
 *    36-ish-px done-row (icon + label + check). Tapping the row
 *    re-expands the full block. Framer Motion `layout` animates the
 *    transition.
 *
 * 2. **Dominant next-action** — when `isDominant`, the card gets an
 *    accent ring + subtle glow + auto-scrolls into view on first paint
 *    of a session. Helps eliminate the "what do I do now" question.
 *
 * The user can override the done-collapse by tapping the row — that's
 * a temporary expand for review, doesn't change the underlying data.
 */
export function BlockShell({
  id,
  title,
  icon,
  isDone,
  isDominant,
  expandedOverride,
  onExpandedToggle,
  stripeClass,
  iconBgClass,
  iconTextClass,
  children,
}: {
  id: string
  title: string
  icon: React.ReactNode
  isDone: boolean
  isDominant: boolean
  /** User-controlled expand-when-done override (tap to peek). */
  expandedOverride: boolean
  onExpandedToggle: () => void
  stripeClass: string
  iconBgClass: string
  iconTextClass: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const didScrollRef = useRef(false)

  useEffect(() => {
    if (!isDominant || didScrollRef.current) return
    didScrollRef.current = true
    // Defer one tick so layout has settled before we scroll.
    window.requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }, [isDominant])

  // Collapsed = block is done AND user hasn't tapped to peek.
  const collapsed = isDone && !expandedOverride

  if (collapsed) {
    return (
      <motion.button
        layout
        type="button"
        onClick={onExpandedToggle}
        className="group flex w-full items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-left transition-colors hover:bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30"
        aria-label={`${title} — done, tap to expand`}
        id={`block-${id}`}
      >
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
        <span
          className={cn(
            'grid h-6 w-6 shrink-0 place-items-center rounded-md',
            iconBgClass,
            iconTextClass
          )}
        >
          {icon}
        </span>
        <span className="flex-1 truncate text-sm font-medium text-emerald-900 dark:text-emerald-200">
          {title}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          Done
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-emerald-500/70 transition-transform group-hover:translate-y-0.5" />
      </motion.button>
    )
  }

  return (
    <motion.div layout ref={ref} id={`block-${id}`} className="relative">
      <Card
        className={cn(
          'relative overflow-hidden border-zinc-200 bg-white transition-all dark:border-zinc-800 dark:bg-zinc-900/50',
          isDominant
            ? 'ring-2 ring-indigo-400/60 ring-offset-2 ring-offset-white dark:ring-indigo-400/40 dark:ring-offset-zinc-950'
            : 'hover:border-zinc-300 dark:hover:border-zinc-700'
        )}
      >
        <div className={cn('absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r', stripeClass)} />
        <AnimatePresence>
          {isDominant ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="pointer-events-none absolute inset-0 -z-10 rounded-xl bg-indigo-400/20 blur-2xl"
            />
          ) : null}
        </AnimatePresence>
        {children}
        {isDone ? (
          <button
            type="button"
            onClick={onExpandedToggle}
            className="absolute right-3 top-3 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 transition-colors hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            Collapse
          </button>
        ) : null}
      </Card>
    </motion.div>
  )
}

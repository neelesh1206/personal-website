'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Quote as QuoteIcon, RefreshCw } from 'lucide-react'
import type { Quote } from '@/lib/admin/prep/daily-quote'
import { cn } from '@/lib/utils'

const ACCENT: Record<Quote['category'], string> = {
  athlete: 'from-orange-500/15 via-amber-500/10 to-transparent',
  philosopher: 'from-violet-500/15 via-indigo-500/10 to-transparent',
  scientist: 'from-sky-500/15 via-cyan-500/10 to-transparent',
  builder: 'from-emerald-500/15 via-teal-500/10 to-transparent',
  writer: 'from-rose-500/15 via-pink-500/10 to-transparent',
  leader: 'from-yellow-500/15 via-amber-500/10 to-transparent',
}

const LABEL: Record<Quote['category'], string> = {
  athlete: 'Athlete',
  philosopher: 'Philosopher',
  scientist: 'Scientist',
  builder: 'Builder',
  writer: 'Writer',
  leader: 'Leader',
}

export function DailyQuoteCard({ quote, reflection }: { quote: Quote; reflection?: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [shuffling, setShuffling] = useState(false)

  function handleRefresh() {
    setShuffling(true)
    fetch('/api/admin/prep/daily-quote/refresh', { method: 'POST' })
      .then((r) => {
        if (!r.ok) throw new Error(`refresh failed: ${r.status}`)
        startTransition(() => router.refresh())
      })
      .catch((err) => {
        console.error(err)
        setShuffling(false)
      })
  }

  const busy = shuffling || isPending

  return (
    <motion.figure
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/40',
        ACCENT[quote.category]
      )}
    >
      <QuoteIcon
        className="pointer-events-none absolute -right-2 -top-2 h-24 w-24 text-zinc-900/[0.04] dark:text-white/[0.04]"
        strokeWidth={1.2}
        aria-hidden
      />
      <div className="relative">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            Daily anchor · {LABEL[quote.category]}
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={busy}
            aria-label="Get a different quote"
            title="Get a different quote"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/60 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-100"
          >
            <RefreshCw
              className={cn('h-4 w-4', busy && 'animate-spin')}
              strokeWidth={2}
              aria-hidden
            />
          </button>
        </div>
        <blockquote
          style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
          className="text-[1.35rem] leading-snug text-zinc-900 sm:text-2xl md:text-[1.7rem] dark:text-zinc-50"
        >
          <span className="text-zinc-400 dark:text-zinc-600">“</span>
          {quote.text}
          <span className="text-zinc-400 dark:text-zinc-600">”</span>
        </blockquote>
        <figcaption className="mt-4 flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">— {quote.author}</span>
          <span className="text-zinc-500 dark:text-zinc-400">· {quote.role}</span>
        </figcaption>
        {reflection ? (
          <div className="mt-5 rounded-lg border border-white/50 bg-white/40 px-3.5 py-2.5 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              Why this, today
            </p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
              {reflection}
            </p>
          </div>
        ) : null}
      </div>
    </motion.figure>
  )
}

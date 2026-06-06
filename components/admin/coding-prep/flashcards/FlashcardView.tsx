'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { DeckCard } from '@/lib/admin/prep/flashcard-deck'

const REASON_LABEL: Record<DeckCard['reason'], string> = {
  due: 'Due',
  weak: 'Weak — revisit',
  unseen: 'New',
  'mastered-refresh': 'Refresh',
}

const REASON_ACCENT: Record<DeckCard['reason'], string> = {
  due: 'border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200',
  weak: 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-200',
  unseen:
    'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200',
  'mastered-refresh':
    'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200',
}

export function FlashcardView({
  card,
  hint,
  hintShown,
  revealed,
  onShowHint,
  onReveal,
}: {
  card: DeckCard
  hint: string
  hintShown: boolean
  revealed: boolean
  onShowHint: () => void
  onReveal: () => void
}) {
  // Auto-resize is handled by the outer container. This card itself
  // sticks at ~280-px tall on phones (thumb-reachable) and grows on
  // desktop with the content. Body type stays at ≥16px to avoid iOS
  // zoom-on-focus when an input lives nearby.
  return (
    <Card className="relative overflow-hidden border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
      <CardContent className="space-y-5 px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.16em]">
          <span className="text-zinc-500 dark:text-zinc-400">{card.topicName}</span>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5',
              REASON_ACCENT[card.reason]
            )}
          >
            {REASON_LABEL[card.reason]}
          </span>
        </div>

        <h3
          style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
          className="text-2xl leading-snug text-zinc-900 sm:text-3xl dark:text-zinc-50"
        >
          {card.question}
        </h3>

        {!revealed ? (
          <div className="space-y-3">
            {hintShown && hint ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-amber-300 bg-amber-50/70 px-4 py-3 text-base text-amber-900 sm:text-[15px] dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200"
              >
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">
                  Hint
                </p>
                <p>{hint}</p>
              </motion.div>
            ) : (
              <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/40 px-4 py-6 text-center text-sm italic text-zinc-500 sm:text-base dark:border-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-400">
                Try to recall the answer before revealing.
                <br />
                Retrieval is the study; reading is not.
              </p>
            )}
            <div className="flex gap-2 sm:hidden">
              <button
                type="button"
                onClick={onShowHint}
                disabled={hintShown}
                className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 disabled:opacity-60 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
              >
                Show hint
              </button>
              <button
                type="button"
                onClick={onReveal}
                className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Reveal
              </button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, rotateX: 12, y: 12 }}
            animate={{ opacity: 1, rotateX: 0, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            <section>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
                Answer
              </p>
              <p className="whitespace-pre-line text-base leading-relaxed text-zinc-800 sm:text-[15px] dark:text-zinc-200">
                {card.answer}
              </p>
            </section>
            {card.projectUsage ? (
              <section className="rounded-lg border-l-2 border-emerald-500 bg-emerald-50/60 px-3 py-2 dark:border-emerald-400 dark:bg-emerald-950/30">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                  How I used it
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-emerald-900 dark:text-emerald-200">
                  {card.projectUsage}
                </p>
              </section>
            ) : null}
            {card.remember ? (
              <section className="flex items-start gap-2 rounded-lg border-l-2 border-amber-500 bg-amber-50/60 px-3 py-2 dark:border-amber-400 dark:bg-amber-950/30">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                    Remember
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-amber-900 dark:text-amber-200">
                    {card.remember}
                  </p>
                </div>
              </section>
            ) : null}
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}

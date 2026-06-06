'use client'

import { motion } from 'framer-motion'
import { Award, RotateCcw, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { DeckCard } from '@/lib/admin/prep/flashcard-deck'
import type { Grade } from '@/lib/admin/prep/flashcards'

export function SessionSummary({
  outcomes,
  deckSize,
  onRestart,
}: {
  outcomes: Array<{ card: DeckCard; grade: Grade }>
  deckSize: number
  onRestart: () => void
}) {
  const counts = {
    got: outcomes.filter((o) => o.grade === 'got-it').length,
    almost: outcomes.filter((o) => o.grade === 'almost').length,
    missed: outcomes.filter((o) => o.grade === 'missed').length,
  }
  const graded = outcomes.length
  const accuracy = graded === 0 ? 0 : Math.round((counts.got / graded) * 100)

  // Weakest topics — count missed + almost per topic.
  const weakByTopic = new Map<string, { name: string; weak: number }>()
  for (const o of outcomes) {
    if (o.grade === 'got-it') continue
    const entry = weakByTopic.get(o.card.topicId) ?? { name: o.card.topicName, weak: 0 }
    entry.weak += 1
    weakByTopic.set(o.card.topicId, entry)
  }
  const weakest = [...weakByTopic.values()].sort((a, b) => b.weak - a.weak).slice(0, 3)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <Card className="overflow-hidden border-zinc-200 bg-gradient-to-br from-indigo-50/60 via-white to-amber-50/40 dark:border-zinc-800 dark:from-indigo-950/30 dark:via-zinc-900/40 dark:to-amber-950/20">
        <CardContent className="space-y-5 px-4 py-6 sm:px-8 sm:py-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
              Session complete
            </p>
            <h2
              style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
              className="mt-1 text-3xl text-zinc-900 sm:text-4xl dark:text-zinc-50"
            >
              {accuracy}% accuracy
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {graded} of {deckSize} cards graded
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <Tally label="Got it" value={counts.got} accent="emerald" />
            <Tally label="Almost" value={counts.almost} accent="amber" />
            <Tally label="Missed" value={counts.missed} accent="rose" />
          </div>

          {weakest.length > 0 ? (
            <div className="rounded-lg border border-zinc-200 bg-white/70 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/60">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-rose-700 dark:text-rose-300">
                <TrendingUp className="h-3 w-3" /> Revisit
              </p>
              <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
                {weakest.map((w) => w.name).join(' · ')}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
              <Award className="h-4 w-4" /> Clean session — nothing flagged.
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={onRestart} className="min-h-11">
              <RotateCcw className="mr-1.5 h-4 w-4" /> Another set
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function Tally({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: 'emerald' | 'amber' | 'rose'
}) {
  const color =
    accent === 'emerald'
      ? 'text-emerald-600 dark:text-emerald-300'
      : accent === 'amber'
        ? 'text-amber-600 dark:text-amber-300'
        : 'text-rose-600 dark:text-rose-300'
  return (
    <div className="rounded-lg border border-zinc-200 bg-white/70 px-3 py-3 dark:border-zinc-700 dark:bg-zinc-900/60">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  )
}

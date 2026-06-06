'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Eye, Lightbulb, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  buildDeck,
  pickHint,
  type DeckCard,
  type CardStateMap,
} from '@/lib/admin/prep/flashcard-deck'
import { makeSessionId, type Grade } from '@/lib/admin/prep/flashcards'
import type { Library } from '@/lib/admin/prep/types'
import { FlashcardView } from './FlashcardView'
import { SessionSummary } from './SessionSummary'

export type FlashcardSessionProps = {
  library: Library
  initialStates: CardStateMap
  mode: 'due' | 'topic' | 'mixed'
  topicId?: string | null
  shuffle: boolean
  sessionSize: number
  onXp: (xp: number, levelUp: string | null) => void
}

type Outcome = { card: DeckCard; grade: Grade }

export function FlashcardSession({
  library,
  initialStates,
  mode,
  topicId,
  shuffle,
  sessionSize,
  onXp,
}: FlashcardSessionProps) {
  const sessionId = useMemo(() => makeSessionId(), [])
  const [states, setStates] = useState<CardStateMap>(initialStates)

  const deck = useMemo(() => {
    return buildDeck({
      itemsByTopic: library.topics.map((t) => ({
        topicId: t.id,
        topicName: t.name,
        items: t.items,
      })),
      states,
      mode,
      topicId,
      limit: sessionSize,
      shuffle,
      now: new Date(),
    })
    // We intentionally don't depend on `states` here — once the deck is
    // built, the order should stay fixed for the session even as the per-
    // card state updates after each grade.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [library, mode, topicId, sessionSize, shuffle])

  const [index, setIndex] = useState(0)
  const [hintShown, setHintShown] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [outcomes, setOutcomes] = useState<Outcome[]>([])
  const [grading, setGrading] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const card = deck[index] ?? null
  const sessionDone = index >= deck.length && deck.length > 0

  const reset = useCallback(() => {
    setHintShown(false)
    setRevealed(false)
  }, [])

  const next = useCallback(() => {
    setIndex((i) => Math.min(i + 1, deck.length))
    reset()
  }, [deck.length, reset])

  const prev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1))
    reset()
  }, [reset])

  const grade = useCallback(
    async (g: Grade) => {
      if (!card || grading) return
      setGrading(true)
      try {
        const res = await fetch('/api/admin/prep/flashcards/grade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId: card.id, grade: g, sessionId }),
        })
        if (res.ok) {
          const json = (await res.json()) as {
            xp?: number
            levelUp?: string | null
            state?: {
              intervalDays: number
              easeFactorX100: number
              streakCorrect: number
              timesSeen: number
              timesMissed: number
              timesCorrect: number
              lastGrade: Grade | null
            }
          }
          if (json.state) {
            setStates((m) => ({
              ...m,
              [card.id]: { ...json.state!, nextDueAt: null },
            }))
          }
          if (json.xp && json.xp > 0) onXp(json.xp, json.levelUp ?? null)
          setOutcomes((o) => [...o, { card, grade: g }])
          next()
        }
      } finally {
        setGrading(false)
      }
    },
    [card, grading, sessionId, onXp, next]
  )

  // Keyboard shortcuts (desktop). Mobile gets swipe + buttons.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (sessionDone || !card) return
      // Only react when the page is the focus target — don't interfere
      // with form inputs elsewhere.
      const tag = (e.target as HTMLElement | null)?.tagName ?? ''
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
      if (e.key === ' ') {
        e.preventDefault()
        if (!revealed) setRevealed(true)
        return
      }
      if (e.key === 'h' || e.key === 'H') {
        setHintShown(true)
        return
      }
      if (e.key === 'ArrowRight') {
        next()
        return
      }
      if (e.key === 'ArrowLeft') {
        prev()
        return
      }
      if (revealed) {
        if (e.key === '1') {
          void grade('got-it')
          return
        }
        if (e.key === '2') {
          void grade('almost')
          return
        }
        if (e.key === '3') {
          void grade('missed')
          return
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [card, grade, next, prev, revealed, sessionDone])

  // Mobile swipe — install only on the centered card container.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let startX = 0
    let startY = 0
    let active = false
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      const t = e.touches[0]!
      startX = t.clientX
      startY = t.clientY
      active = true
    }
    const onEnd = (e: TouchEvent) => {
      if (!active) return
      active = false
      const t = e.changedTouches[0]
      if (!t) return
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      const absX = Math.abs(dx)
      const absY = Math.abs(dy)
      if (absX > 60 && absX > absY) {
        if (dx < 0) next()
        else prev()
      } else if (-dy > 60 && absY > absX && !revealed) {
        setRevealed(true)
      }
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchend', onEnd)
    }
  }, [next, prev, revealed])

  if (deck.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 px-4 py-10 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300">
        Nothing in the deck right now — try a topic or “Mixed deck.”
      </div>
    )
  }

  if (sessionDone) {
    return (
      <SessionSummary
        outcomes={outcomes}
        deckSize={deck.length}
        onRestart={() => {
          setIndex(0)
          setOutcomes([])
          reset()
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          <span>
            Card {index + 1} / {deck.length}
          </span>
          <span className="capitalize">
            {card?.reason === 'mastered-refresh' ? 'refresh' : card?.reason}
          </span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-zinc-200/70 dark:bg-zinc-800/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-amber-500 transition-all"
            style={{ width: `${Math.round(((index + 1) / deck.length) * 100)}%` }}
          />
        </div>
      </div>

      <div ref={containerRef}>
        <AnimatePresence mode="wait">
          {card ? (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              <FlashcardView
                card={card}
                hint={pickHint(card)}
                hintShown={hintShown}
                revealed={revealed}
                onShowHint={() => setHintShown(true)}
                onReveal={() => setRevealed(true)}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div
        className="sticky bottom-2 z-10 mx-auto flex w-full max-w-2xl flex-wrap items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white/90 px-3 py-2 shadow-md backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90"
        aria-label="Card actions"
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={prev}
          disabled={index === 0}
          className="min-h-11 min-w-11"
          aria-label="Previous card"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {!revealed ? (
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setHintShown(true)}
              disabled={hintShown}
              className="min-h-11"
            >
              <Lightbulb className="mr-1.5 h-4 w-4" />
              {hintShown ? 'Hint shown' : 'Show hint'}
            </Button>
            <Button type="button" onClick={() => setRevealed(true)} className="min-h-11">
              <Eye className="mr-1.5 h-4 w-4" />
              Reveal answer
            </Button>
          </>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <GradeButton
              label="Got it"
              accent="emerald"
              shortcut="1"
              onClick={() => grade('got-it')}
              disabled={grading}
            />
            <GradeButton
              label="Almost"
              accent="amber"
              shortcut="2"
              onClick={() => grade('almost')}
              disabled={grading}
            />
            <GradeButton
              label="Missed it"
              accent="rose"
              shortcut="3"
              onClick={() => grade('missed')}
              disabled={grading}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRevealed(false)}
              className="min-h-11 text-zinc-500"
            >
              <RotateCcw className="mr-1.5 h-3 w-3" /> Hide
            </Button>
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={next}
          className="min-h-11 min-w-11"
          aria-label="Next card"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <p className="hidden text-center text-[11px] text-zinc-500 sm:block dark:text-zinc-400">
        Shortcuts: <kbd className="rounded border px-1">Space</kbd> reveal ·{' '}
        <kbd className="rounded border px-1">H</kbd> hint ·{' '}
        <kbd className="rounded border px-1">1/2/3</kbd> grade ·{' '}
        <kbd className="rounded border px-1">←/→</kbd> navigate
      </p>
      <p className="block text-center text-[11px] text-zinc-500 sm:hidden dark:text-zinc-400">
        Swipe left for next · swipe up to reveal · buttons always work
      </p>
    </div>
  )
}

function GradeButton({
  label,
  accent,
  shortcut,
  onClick,
  disabled,
}: {
  label: string
  accent: 'emerald' | 'amber' | 'rose'
  shortcut: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group relative flex min-h-14 min-w-[88px] items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-all disabled:opacity-50',
        accent === 'emerald' &&
          'border-emerald-300 bg-emerald-50 text-emerald-900 hover:-translate-y-0.5 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200',
        accent === 'amber' &&
          'border-amber-300 bg-amber-50 text-amber-900 hover:-translate-y-0.5 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200',
        accent === 'rose' &&
          'border-rose-300 bg-rose-50 text-rose-900 hover:-translate-y-0.5 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-200'
      )}
      aria-label={`${label} (shortcut ${shortcut})`}
    >
      <span>{label}</span>
      <span className="hidden text-[10px] opacity-60 sm:inline">[{shortcut}]</span>
    </button>
  )
}

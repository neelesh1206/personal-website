'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Shuffle, Layers, ListTree } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Library } from '@/lib/admin/prep/types'
import { FlashcardSession } from './FlashcardSession'
import type { CardStateMap } from '@/lib/admin/prep/flashcard-deck'

export type FlashcardsHomeProps = {
  library: Library
  sessionSize: number
  onXp: (xp: number, levelUp: string | null) => void
}

type Mode = 'due' | 'topic' | 'mixed'

export function FlashcardsHome({ library, sessionSize, onXp }: FlashcardsHomeProps) {
  const [states, setStates] = useState<CardStateMap>({})
  const [dueCount, setDueCount] = useState<number | null>(null)
  const [mode, setMode] = useState<Mode>('due')
  const [topicId, setTopicId] = useState<string | null>(null)
  const [shuffle, setShuffle] = useState(true)
  const [sessionKey, setSessionKey] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const [allRes, dueRes] = await Promise.all([
        fetch('/api/admin/prep/flashcards/all'),
        fetch('/api/admin/prep/flashcards/due-count'),
      ])
      if (allRes.ok) {
        const json = (await allRes.json()) as {
          states: Array<{
            cardId: string
            lastGrade: string | null
            lastSeenAt: string | null
            nextDueAt: string
            intervalDays: number
            easeFactorX100: number
            streakCorrect: number
            timesSeen: number
            timesMissed: number
            timesCorrect: number
          }>
        }
        const map: CardStateMap = {}
        for (const s of json.states) {
          map[s.cardId] = {
            intervalDays: s.intervalDays,
            easeFactorX100: s.easeFactorX100,
            streakCorrect: s.streakCorrect,
            timesSeen: s.timesSeen,
            timesMissed: s.timesMissed,
            timesCorrect: s.timesCorrect,
            lastGrade: (s.lastGrade as 'got-it' | 'almost' | 'missed' | null) ?? null,
            nextDueAt: s.nextDueAt,
          }
        }
        setStates(map)
      }
      if (dueRes.ok) {
        const json = (await dueRes.json()) as { due: number }
        setDueCount(json.due)
      }
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    // Mount-only initial fetch. Subsequent refreshes are explicit
    // after each card grade via the refresh() callback.
    const ctrl = new AbortController()
    ;(async () => {
      try {
        const [allRes, dueRes] = await Promise.all([
          fetch('/api/admin/prep/flashcards/all', { signal: ctrl.signal }),
          fetch('/api/admin/prep/flashcards/due-count', { signal: ctrl.signal }),
        ])
        if (allRes.ok) {
          const json = (await allRes.json()) as {
            states: Array<{
              cardId: string
              lastGrade: string | null
              nextDueAt: string
              intervalDays: number
              easeFactorX100: number
              streakCorrect: number
              timesSeen: number
              timesMissed: number
              timesCorrect: number
            }>
          }
          const map: CardStateMap = {}
          for (const s of json.states) {
            map[s.cardId] = {
              intervalDays: s.intervalDays,
              easeFactorX100: s.easeFactorX100,
              streakCorrect: s.streakCorrect,
              timesSeen: s.timesSeen,
              timesMissed: s.timesMissed,
              timesCorrect: s.timesCorrect,
              lastGrade: (s.lastGrade as 'got-it' | 'almost' | 'missed' | null) ?? null,
              nextDueAt: s.nextDueAt,
            }
          }
          setStates(map)
        }
        if (dueRes.ok) {
          const json = (await dueRes.json()) as { due: number }
          setDueCount(json.due)
        }
      } catch (err) {
        if ((err as { name?: string }).name !== 'AbortError') console.error(err)
      }
    })()
    return () => ctrl.abort()
  }, [])

  const topics = useMemo(() => library.topics.map((t) => ({ id: t.id, name: t.name })), [library])
  const unseenCount = useMemo(() => {
    let total = 0
    for (const t of library.topics) {
      for (const item of t.items) {
        if (!states[item.id]) total += 1
      }
    }
    return total
  }, [library, states])

  const startSession = useCallback(() => setSessionKey((k) => k + 1), [])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/30">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            Active recall
          </p>
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-200">
            {dueCount === null ? (
              <>Loading deck…</>
            ) : (
              <>
                <strong>{dueCount}</strong> due ·{' '}
                <span className="text-zinc-500 dark:text-zinc-400">{unseenCount} unseen</span>
              </>
            )}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShuffle((v) => !v)}
          className="min-h-11"
          aria-pressed={shuffle}
        >
          <Shuffle className={cn('mr-1.5 h-4 w-4', shuffle && 'text-indigo-600')} />
          Shuffle {shuffle ? 'on' : 'off'}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ModeButton
          active={mode === 'due'}
          onClick={() => {
            setMode('due')
            setTopicId(null)
            startSession()
          }}
        >
          <Layers className="mr-1.5 h-3.5 w-3.5" /> Due / weak
        </ModeButton>
        <ModeButton
          active={mode === 'mixed'}
          onClick={() => {
            setMode('mixed')
            setTopicId(null)
            startSession()
          }}
        >
          <Shuffle className="mr-1.5 h-3.5 w-3.5" /> Mixed deck
        </ModeButton>
        <ModeButton
          active={mode === 'topic'}
          onClick={() => {
            setMode('topic')
            if (!topicId) setTopicId(topics[0]?.id ?? null)
            startSession()
          }}
        >
          <ListTree className="mr-1.5 h-3.5 w-3.5" /> By topic
        </ModeButton>
      </div>

      {mode === 'topic' ? (
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {topics.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTopicId(t.id)
                startSession()
              }}
              className={cn(
                'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                topicId === t.id
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-900 dark:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-200'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
              )}
              aria-pressed={topicId === t.id}
            >
              {t.name}
            </button>
          ))}
        </div>
      ) : null}

      <FlashcardSession
        key={sessionKey}
        library={library}
        initialStates={states}
        mode={mode}
        topicId={topicId}
        shuffle={shuffle}
        sessionSize={sessionSize}
        onXp={(xp, lvl) => {
          onXp(xp, lvl)
          void refresh()
        }}
      />
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex min-h-11 items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm dark:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-200'
          : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
      )}
      aria-pressed={active}
    >
      {children}
    </button>
  )
}

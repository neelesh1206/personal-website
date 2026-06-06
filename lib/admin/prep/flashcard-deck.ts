/**
 * Pure deck-building from library content + per-card progress state.
 * No DB, no I/O — server hands us the full progress map, this module
 * decides what to study.
 */

import type { LibraryItem } from './types'
import { isMastered, type CardState } from './flashcards'

export type CardStateMap = Record<string, CardState & { nextDueAt?: string | null }>

export type DeckMode = 'due' | 'topic' | 'mixed'

export type BuildDeckArgs = {
  itemsByTopic: Array<{ topicId: string; topicName: string; items: LibraryItem[] }>
  states: CardStateMap
  mode: DeckMode
  topicId?: string | null
  limit: number
  shuffle: boolean
  now: Date
}

export type DeckCardReason = 'due' | 'weak' | 'unseen' | 'mastered-refresh'

export type DeckCard = LibraryItem & {
  topicId: string
  topicName: string
  state: CardState
  reason: DeckCardReason
}

export function buildDeck(args: BuildDeckArgs): DeckCard[] {
  const flat: DeckCard[] = []
  for (const t of args.itemsByTopic) {
    if (args.mode === 'topic' && args.topicId && t.topicId !== args.topicId) continue
    for (const item of t.items) {
      const s = args.states[item.id]
      const state: CardState = s ?? {
        intervalDays: 0,
        easeFactorX100: 250,
        streakCorrect: 0,
        timesSeen: 0,
        timesMissed: 0,
        timesCorrect: 0,
        lastGrade: null,
      }
      flat.push({
        ...item,
        topicId: t.topicId,
        topicName: t.topicName,
        state,
        reason: classify(state, s?.nextDueAt ?? null, args.now),
      })
    }
  }

  let pool = flat
  if (args.mode === 'due') {
    pool = flat.filter((c) => c.reason === 'due' || c.reason === 'weak' || c.reason === 'unseen')
    pool.sort((a, b) => weightForDeck(a) - weightForDeck(b))
  } else {
    pool.sort((a, b) => (a.topicName + a.id).localeCompare(b.topicName + b.id))
  }

  if (args.shuffle) pool = shuffleInPlace([...pool])
  if (pool.length > args.limit) pool = pool.slice(0, args.limit)
  return pool
}

function classify(
  state: CardState,
  nextDueAtIso: string | null | undefined,
  now: Date
): DeckCardReason {
  if (state.timesSeen === 0) return 'unseen'
  if (isMastered(state)) return 'mastered-refresh'
  const dueNow = nextDueAtIso ? new Date(nextDueAtIso) <= now : true
  if (state.lastGrade === 'missed' || state.lastGrade === 'almost') return 'weak'
  return dueNow ? 'due' : 'weak'
}

function weightForDeck(c: DeckCard): number {
  // Lower comes first.
  if (c.reason === 'weak' && c.state.lastGrade === 'missed') return 0
  if (c.reason === 'due') return 10
  if (c.reason === 'weak') return 20 // almost
  if (c.reason === 'unseen') return 30
  return 40 // mastered-refresh — shouldn't usually appear here
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

export const STUDIED_TODAY_THRESHOLD = 5

/**
 * Hint = the shorter of the answer's first sentence and the remember
 * hook. Bounded at ~110 chars so it's directional, not the full answer.
 */
export function pickHint(item: LibraryItem): string {
  const firstSentence = (item.answer ?? '').split(/(?<=[.!?])\s+/)[0] ?? ''
  const remember = (item.remember ?? '').trim()
  const candidates = [firstSentence, remember].filter((s) => s.length > 0)
  if (candidates.length === 0) return ''
  const shortest = candidates.reduce((a, b) => (a.length <= b.length ? a : b))
  return shortest.length <= 110 ? shortest : shortest.slice(0, 109).trimEnd() + '…'
}

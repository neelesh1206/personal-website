'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, Code2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Phase = 'focus' | 'break' | 'idle'

const FOCUS_MS = 25 * 60 * 1000
const BREAK_MS = 5 * 60 * 1000

/**
 * Persisted timer state. The anchor is `startedAtMs` (epoch ms) — we
 * never store a decrementing counter, so background-tab throttling and
 * full-page refreshes both compute the correct remaining time on the
 * next render from Date.now().
 *
 * When paused, `startedAtMs` is null and `pausedRemainingMs` holds the
 * frozen remaining. Resume = anchor `startedAtMs = now`, set
 * `durationMs = pausedRemainingMs`.
 *
 * Bumping `LS_VERSION` invalidates any old shape if we ever change the
 * field set.
 */
const LS_KEY = 'prep-pomodoro-state'
const LS_VERSION = 1

type PomodoroPersisted = {
  v: number
  phase: Phase
  startedAtMs: number | null
  durationMs: number
  pausedRemainingMs: number | null
  sprintsDone: number
  serverSessionId: number | null
}

const INITIAL: PomodoroPersisted = {
  v: LS_VERSION,
  phase: 'idle',
  startedAtMs: null,
  durationMs: FOCUS_MS,
  pausedRemainingMs: null,
  sprintsDone: 0,
  serverSessionId: null,
}

function computeRemainingMs(s: PomodoroPersisted, now: number): number {
  if (s.phase === 'idle') return FOCUS_MS
  if (s.pausedRemainingMs !== null) return s.pausedRemainingMs
  if (s.startedAtMs === null) return s.durationMs
  return Math.max(0, s.durationMs - (now - s.startedAtMs))
}

function loadPersisted(): PomodoroPersisted | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PomodoroPersisted
    if (!parsed || parsed.v !== LS_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

function savePersisted(s: PomodoroPersisted): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(s))
  } catch {
    // storage full / private mode — silently skip
  }
}

export function PomodoroBlock({
  rule,
  duration,
  onIncrementProblemsSolved,
}: {
  rule?: string
  duration: string
  onIncrementProblemsSolved: () => void
}) {
  const [state, setState] = useState<PomodoroPersisted>(INITIAL)
  // Wall-clock-derived. Recomputed from Date.now() in the tick effect
  // below, so the render stays pure (no Date.now() during render).
  const [remainingMs, setRemainingMs] = useState<number>(FOCUS_MS)

  const running = state.startedAtMs !== null && state.pausedRemainingMs === null

  // Hydrate from localStorage once on mount. The setState/recompute is
  // intentional — this is a "subscribe to external store" pattern, not
  // a render-cascade — so we suppress the lint rule inline.
  useEffect(() => {
    const stored = loadPersisted()
    if (!stored) return
    const now = Date.now()
    queueMicrotask(() => {
      setState(stored)
      setRemainingMs(computeRemainingMs(stored, now))
    })
  }, [])

  // Persist on every state change + recompute remaining against the
  // wall clock the moment state shifts (phase transition, pause,
  // resume).
  useEffect(() => {
    savePersisted(state)
    // queueMicrotask so the state mutation lands on the next tick —
    // avoids cascading-render warning while keeping the recompute
    // immediate from the user's perspective.
    const now = Date.now()
    queueMicrotask(() => setRemainingMs(computeRemainingMs(state, now)))
  }, [state])

  // Tick + visibilitychange recompute. Reading Date.now() lives here,
  // not in render, so the component is referentially transparent for
  // its rendered output given (state, remainingMs).
  useEffect(() => {
    if (!running) return
    const recompute = () => setRemainingMs(computeRemainingMs(state, Date.now()))
    const id = window.setInterval(recompute, 250)
    const onVis = () => recompute()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [running, state])

  // Server-side pomodoro row id is tracked alongside the timer so a
  // refresh while running doesn't orphan the db session. We still
  // pessimistically PATCH-complete the row on phase transition.
  const startServerSession = useCallback(
    async (kind: 'focus' | 'break', seconds: number): Promise<number | null> => {
      try {
        const res = await fetch('/api/admin/prep/pomodoros', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ durationSeconds: seconds, kind }),
        })
        if (!res.ok) return null
        const json = (await res.json()) as { pomodoro?: { id: number } }
        return json.pomodoro?.id ?? null
      } catch (err) {
        console.error(err)
        return null
      }
    },
    []
  )

  const completeServerSession = useCallback(async (id: number | null) => {
    if (id === null) return
    try {
      await fetch('/api/admin/prep/pomodoros', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    } catch (err) {
      console.error(err)
    }
  }, [])

  // Phase-transition gate: each (phase, startedAtMs) pair fires at most
  // one transition once it expires. Reset whenever the anchor changes.
  const transitionedRef = useRef<string | null>(null)

  useEffect(() => {
    if (state.phase === 'idle') return
    if (remainingMs > 0) {
      // Reset gate when a new phase is anchored.
      const key = `${state.phase}:${state.startedAtMs ?? 'paused'}`
      if (transitionedRef.current !== null && transitionedRef.current !== key) {
        transitionedRef.current = null
      }
      return
    }
    const key = `${state.phase}:${state.startedAtMs ?? 'paused'}`
    if (transitionedRef.current === key) return
    transitionedRef.current = key

    const expiredPhase = state.phase
    const expiredServerId = state.serverSessionId

    queueMicrotask(() => {
      if (expiredPhase === 'focus') {
        void completeServerSession(expiredServerId)
        onIncrementProblemsSolved()
        ;(async () => {
          const newId = await startServerSession('break', BREAK_MS / 1000)
          setState((prev) => ({
            ...prev,
            phase: 'break',
            startedAtMs: Date.now(),
            durationMs: BREAK_MS,
            pausedRemainingMs: null,
            sprintsDone: prev.sprintsDone + 1,
            serverSessionId: newId,
          }))
        })()
      } else if (expiredPhase === 'break') {
        void completeServerSession(expiredServerId)
        setState((prev) => ({
          ...INITIAL,
          sprintsDone: prev.sprintsDone,
        }))
      }
    })
  }, [
    remainingMs,
    state.phase,
    state.startedAtMs,
    state.serverSessionId,
    completeServerSession,
    onIncrementProblemsSolved,
    startServerSession,
  ])

  async function handleStart() {
    if (state.phase === 'idle') {
      const id = await startServerSession('focus', FOCUS_MS / 1000)
      setState({
        v: LS_VERSION,
        phase: 'focus',
        startedAtMs: Date.now(),
        durationMs: FOCUS_MS,
        pausedRemainingMs: null,
        sprintsDone: state.sprintsDone,
        serverSessionId: id,
      })
      return
    }
    // Resume from pause: re-anchor at now with the frozen remaining
    // as the new duration window so the math comes out the same.
    if (state.pausedRemainingMs !== null) {
      setState((prev) => ({
        ...prev,
        startedAtMs: Date.now(),
        durationMs: prev.pausedRemainingMs ?? prev.durationMs,
        pausedRemainingMs: null,
      }))
    }
  }

  function handlePause() {
    if (!running) return
    setState((prev) => ({
      ...prev,
      pausedRemainingMs: computeRemainingMs(prev, Date.now()),
      startedAtMs: null,
    }))
  }

  function handleReset() {
    void completeServerSession(state.serverSessionId)
    setState((prev) => ({ ...INITIAL, sprintsDone: prev.sprintsDone }))
    transitionedRef.current = null
  }

  const total = state.phase === 'break' ? BREAK_MS : FOCUS_MS
  const pct = Math.round(((total - remainingMs) / total) * 100)
  const remSec = Math.ceil(remainingMs / 1000)
  const mm = String(Math.floor(remSec / 60)).padStart(2, '0')
  const ss = String(remSec % 60).padStart(2, '0')

  const phaseLabel =
    state.phase === 'focus' ? 'Focus sprint' : state.phase === 'break' ? 'Break' : 'Ready'

  const ringColor =
    state.phase === 'break' ? 'stroke-emerald-500' : 'stroke-indigo-500 dark:stroke-indigo-400'

  return (
    <Card className="relative overflow-hidden border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              <Code2 className="h-3.5 w-3.5" />
            </span>
            Coding sprints
          </CardTitle>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{duration}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Sprints today
          </p>
          <p className="text-2xl font-semibold tabular-nums">{state.sprintsDone}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {rule ? (
          <p
            style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
            className="rounded-md border-l-2 border-indigo-500 bg-indigo-50/70 px-3 py-2 text-sm italic text-indigo-900 dark:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-200"
          >
            {rule}
          </p>
        ) : null}
        <div className="flex flex-col items-center gap-4 py-3">
          <p
            className={cn(
              'text-[10px] font-semibold uppercase tracking-[0.22em]',
              state.phase === 'focus' && 'text-indigo-600 dark:text-indigo-400',
              state.phase === 'break' && 'text-emerald-600 dark:text-emerald-400',
              state.phase === 'idle' && 'text-zinc-500 dark:text-zinc-400'
            )}
          >
            {phaseLabel}
            {state.pausedRemainingMs !== null && state.phase !== 'idle' ? ' · paused' : ''}
          </p>

          <ProgressRing
            size={196}
            stroke={6}
            percent={pct}
            colorClass={state.phase === 'idle' ? 'stroke-zinc-300 dark:stroke-zinc-700' : ringColor}
          >
            <div className="flex flex-col items-center">
              <p className="font-mono text-5xl font-semibold tabular-nums tracking-tighter text-zinc-900 dark:text-zinc-50">
                {mm}:{ss}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                {state.phase === 'break' ? '5-min reset' : '25-min focus'}
              </p>
            </div>
          </ProgressRing>

          <div className="flex gap-2">
            {!running ? (
              <Button size="sm" onClick={handleStart} className="min-h-11">
                <Play className="mr-1.5 h-3.5 w-3.5" />
                {state.phase === 'idle' ? 'Start sprint' : 'Resume'}
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={handlePause} className="min-h-11">
                <Pause className="mr-1.5 h-3.5 w-3.5" /> Pause
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={handleReset} className="min-h-11">
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProgressRing({
  size,
  stroke,
  percent,
  colorClass,
  children,
}: {
  size: number
  stroke: number
  percent: number
  colorClass: string
  children: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-zinc-100 dark:stroke-zinc-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={cn(colorClass, 'transition-[stroke-dashoffset] duration-500')}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, Code2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Phase = 'focus' | 'break' | 'idle'

const FOCUS_S = 25 * 60
const BREAK_S = 5 * 60

export function PomodoroBlock({
  rule,
  duration,
  onIncrementProblemsSolved,
}: {
  rule?: string
  duration: string
  onIncrementProblemsSolved: () => void
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [remaining, setRemaining] = useState(FOCUS_S)
  const [running, setRunning] = useState(false)
  const [sprintsDone, setSprintsDone] = useState(0)
  const sessionIdRef = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startSession = useCallback(async (kind: 'focus' | 'break', seconds: number) => {
    try {
      const res = await fetch('/api/admin/prep/pomodoros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationSeconds: seconds, kind }),
      })
      if (!res.ok) return
      const json = (await res.json()) as { pomodoro?: { id: number } }
      sessionIdRef.current = json.pomodoro?.id ?? null
    } catch (err) {
      console.error(err)
    }
  }, [])

  const completeSession = useCallback(async () => {
    if (sessionIdRef.current === null) return
    try {
      await fetch('/api/admin/prep/pomodoros', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sessionIdRef.current }),
      })
    } catch (err) {
      console.error(err)
    }
    sessionIdRef.current = null
  }, [])

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0))
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running])

  const transitionedRef = useRef<string | null>(null)
  useEffect(() => {
    if (remaining > 0) {
      transitionedRef.current = null
      return
    }
    const key = `${phase}:0`
    if (transitionedRef.current === key) return
    transitionedRef.current = key
    queueMicrotask(() => {
      if (phase === 'focus') {
        void completeSession()
        onIncrementProblemsSolved()
        setSprintsDone((n) => n + 1)
        setPhase('break')
        setRemaining(BREAK_S)
        void startSession('break', BREAK_S)
      } else if (phase === 'break') {
        void completeSession()
        setPhase('idle')
        setRunning(false)
        setRemaining(FOCUS_S)
      }
    })
  }, [remaining, phase, completeSession, onIncrementProblemsSolved, startSession])

  function handleStart() {
    if (phase === 'idle') {
      setPhase('focus')
      setRemaining(FOCUS_S)
      void startSession('focus', FOCUS_S)
    }
    setRunning(true)
  }

  function handleReset() {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    setPhase('idle')
    setRemaining(FOCUS_S)
    sessionIdRef.current = null
  }

  const total = phase === 'break' ? BREAK_S : FOCUS_S
  const pct = Math.round(((total - remaining) / total) * 100)
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')

  const phaseLabel = phase === 'focus' ? 'Focus sprint' : phase === 'break' ? 'Break' : 'Ready'

  const ringColor =
    phase === 'break' ? 'stroke-emerald-500' : 'stroke-indigo-500 dark:stroke-indigo-400'

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
          <p className="text-2xl font-semibold tabular-nums">{sprintsDone}</p>
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
              phase === 'focus' && 'text-indigo-600 dark:text-indigo-400',
              phase === 'break' && 'text-emerald-600 dark:text-emerald-400',
              phase === 'idle' && 'text-zinc-500 dark:text-zinc-400'
            )}
          >
            {phaseLabel}
          </p>

          <ProgressRing
            size={196}
            stroke={6}
            percent={pct}
            colorClass={phase === 'idle' ? 'stroke-zinc-300 dark:stroke-zinc-700' : ringColor}
          >
            <div className="flex flex-col items-center">
              <p className="font-mono text-5xl font-semibold tabular-nums tracking-tighter text-zinc-900 dark:text-zinc-50">
                {mm}:{ss}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                {phase === 'break' ? '5-min reset' : '25-min focus'}
              </p>
            </div>
          </ProgressRing>

          <div className="flex gap-2">
            {!running ? (
              <Button size="sm" onClick={handleStart}>
                <Play className="mr-1.5 h-3.5 w-3.5" />
                {phase === 'idle' ? 'Start sprint' : 'Resume'}
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setRunning(false)}>
                <Pause className="mr-1.5 h-3.5 w-3.5" /> Pause
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={handleReset}>
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

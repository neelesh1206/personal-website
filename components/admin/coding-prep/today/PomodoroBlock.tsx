'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, Code2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
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

  return (
    <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Code2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Coding sprints
          </CardTitle>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{duration}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Sprints today
          </p>
          <p className="text-xl font-semibold tabular-nums">{sprintsDone}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {rule ? (
          <p className="rounded-md border-l-2 border-indigo-500 bg-indigo-50 px-3 py-2 text-xs text-indigo-900 dark:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-200">
            {rule}
          </p>
        ) : null}
        <div className="flex flex-col items-center gap-3 py-2">
          <p
            className={cn(
              'text-xs font-semibold uppercase tracking-widest',
              phase === 'focus' && 'text-indigo-600 dark:text-indigo-400',
              phase === 'break' && 'text-emerald-600 dark:text-emerald-400',
              phase === 'idle' && 'text-zinc-500 dark:text-zinc-400'
            )}
          >
            {phaseLabel}
          </p>
          <p className="font-mono text-5xl font-semibold tabular-nums tracking-tighter text-zinc-900 dark:text-zinc-50">
            {mm}:{ss}
          </p>
          <Progress value={pct} className="h-1.5 w-full max-w-xs" />
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

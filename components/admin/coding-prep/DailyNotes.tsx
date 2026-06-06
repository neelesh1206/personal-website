'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Status = 'idle' | 'saving' | 'saved' | 'error'

const DEBOUNCE_MS = 800

export function DailyNotes({
  dayPadded,
  initialBody,
  onSave,
}: {
  dayPadded: string
  initialBody: string
  onSave: (body: string) => Promise<'saved' | 'error'>
}) {
  const [body, setBody] = useState(initialBody)
  const [status, setStatus] = useState<Status>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef(initialBody)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  function scheduleSave(next: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      if (next === lastSavedRef.current) {
        setStatus('idle')
        return
      }
      setStatus('saving')
      const result = await onSave(next)
      if (result === 'saved') {
        lastSavedRef.current = next
        setStatus('saved')
        // Drop the "saved" indicator after a couple of seconds so it doesn't
        // sit forever once you've stopped typing.
        timerRef.current = setTimeout(() => setStatus('idle'), 2000)
      } else {
        setStatus('error')
      }
    }, DEBOUNCE_MS)
  }

  return (
    <div className="mt-3">
      <textarea
        value={body}
        onChange={(e) => {
          setBody(e.target.value)
          scheduleSave(e.target.value)
        }}
        placeholder={`Day ${dayPadded.replace(/^0/, '')} notes — what clicked, what didn't, which failures to revisit.`}
        rows={5}
        maxLength={20_000}
        className="block w-full resize-y rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-indigo-600 dark:focus:ring-indigo-900/50"
      />
      <div
        className={cn(
          'mt-1.5 flex items-center gap-1.5 text-[11px]',
          status === 'error'
            ? 'text-rose-600 dark:text-rose-400'
            : 'text-zinc-400 dark:text-zinc-500'
        )}
        aria-live="polite"
      >
        {status === 'saving' ? (
          <>
            <Loader2 size={11} className="animate-spin" /> Saving…
          </>
        ) : status === 'saved' ? (
          <>
            <CheckCircle2 size={11} className="text-emerald-500" /> Saved
          </>
        ) : status === 'error' ? (
          <span>Couldn&apos;t save — retrying on next change.</span>
        ) : (
          <span>Autosaves on pause.</span>
        )}
      </div>
    </div>
  )
}

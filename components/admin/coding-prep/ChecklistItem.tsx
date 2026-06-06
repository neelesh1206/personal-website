'use client'

import { useState } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import type { PlanTask } from '@/lib/admin/prep/types'
import { cn } from '@/lib/utils'

/**
 * Per-task row on the 15-Day Plan tab.
 *
 * Coding tasks (educative-coding + neetcode-reps blocks — caller passes
 * `isCodingTask={true}`) gain a secondary "re-solved from blank" button
 * next to the label. Tapping it POSTs to /api/admin/prep/resolves,
 * grants +25 XP (the premium rep), and increments the The Re-Solver
 * badge counter. Idempotent per resolve row, never per task — re-
 * solving the same problem in different sessions each grants once.
 */
export function ChecklistItem({
  task,
  checked,
  isCodingTask = false,
  onChange,
}: {
  task: PlanTask
  checked: boolean
  isCodingTask?: boolean
  onChange: (next: boolean) => void
}) {
  const [resolving, setResolving] = useState(false)
  const [resolvedJustNow, setResolvedJustNow] = useState(false)

  async function resolveFromBlank(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (resolving) return
    setResolving(true)
    try {
      const res = await fetch('/api/admin/prep/resolves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemLabel: task.label }),
      })
      if (res.ok) {
        setResolvedJustNow(true)
        window.setTimeout(() => setResolvedJustNow(false), 2200)
      }
    } finally {
      setResolving(false)
    }
  }

  return (
    <li>
      <label
        className={cn(
          'group flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60',
          checked && 'opacity-60'
        )}
      >
        <span
          className={cn(
            'mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded border transition-colors',
            checked
              ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500'
              : 'border-zinc-300 bg-white group-hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:group-hover:border-zinc-600'
          )}
        >
          {checked ? <Check size={11} strokeWidth={3} /> : null}
        </span>
        <span
          className={cn(
            'flex-1 text-sm leading-snug text-zinc-700 dark:text-zinc-300',
            checked && 'line-through decoration-zinc-400 dark:decoration-zinc-600'
          )}
        >
          {task.label}
        </span>
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={task.label}
        />
        {isCodingTask ? (
          <button
            type="button"
            onClick={resolveFromBlank}
            disabled={resolving}
            title="I re-solved this from blank (no AI / no hints)"
            className={cn(
              'ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-all',
              resolvedJustNow
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-zinc-200 bg-white text-zinc-500 opacity-60 group-hover:opacity-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'
            )}
          >
            <RotateCcw className="h-2.5 w-2.5" />
            {resolvedJustNow ? '+25 XP' : 're-solved'}
          </button>
        ) : null}
      </label>
    </li>
  )
}

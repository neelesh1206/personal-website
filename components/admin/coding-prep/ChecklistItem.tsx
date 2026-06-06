'use client'

import { Check } from 'lucide-react'
import type { PlanTask } from '@/lib/admin/prep/types'
import { cn } from '@/lib/utils'

export function ChecklistItem({
  task,
  checked,
  onChange,
}: {
  task: PlanTask
  checked: boolean
  onChange: (next: boolean) => void
}) {
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
            'text-sm leading-snug text-zinc-700 dark:text-zinc-300',
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
      </label>
    </li>
  )
}

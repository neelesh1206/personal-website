'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Code2, Network } from 'lucide-react'
import { ChecklistItem } from './ChecklistItem'
import { DailyNotes } from './DailyNotes'
import { ProgressBar } from './ProgressBar'
import type { PlanDay } from '@/lib/admin/prep/types'
import { cn } from '@/lib/utils'

export function DayCard({
  day,
  completed,
  note,
  onToggleTask,
  onSaveNote,
}: {
  day: PlanDay
  completed: Set<string>
  note: string
  onToggleTask: (taskId: string, completed: boolean) => void
  onSaveNote: (dayPadded: string, body: string) => Promise<'saved' | 'error'>
}) {
  const [open, setOpen] = useState(false)
  const dayPadded = String(day.day).padStart(2, '0')

  const allTasks = useMemo(
    () => [...day.coding.tasks, ...day.systemDesign.tasks, ...day.wrapup],
    [day]
  )
  const completedHere = allTasks.filter((t) => completed.has(t.id)).length
  const totalHere = allTasks.length
  const allDone = completedHere === totalHere

  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border bg-white transition-colors dark:bg-zinc-950',
        allDone
          ? 'border-emerald-300 dark:border-emerald-800'
          : 'border-zinc-200 dark:border-zinc-800'
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid w-full grid-cols-[auto_1fr_140px_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
        aria-expanded={open}
      >
        <div
          className={cn(
            'flex h-10 w-10 flex-none items-center justify-center rounded-full font-semibold tabular-nums',
            allDone
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
          )}
        >
          {day.day}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Day {day.day}
          </p>
          <h3 className="mt-0.5 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {day.title}
          </h3>
        </div>
        <div className="hidden sm:block">
          <ProgressBar
            completed={completedHere}
            total={totalHere}
            tone={allDone ? 'emerald' : 'indigo'}
          />
        </div>
        <span className="flex-none text-zinc-400">
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </span>
      </button>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-6 border-t border-zinc-100 px-5 py-5 dark:border-zinc-900">
            {/* Coding block */}
            <div>
              <div className="flex items-center gap-2">
                <Code2
                  size={14}
                  className="text-orange-600 dark:text-orange-400"
                  aria-hidden="true"
                />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Coding · {day.coding.pattern}
                </h4>
              </div>
              {day.coding.guidance ? (
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {day.coding.guidance}
                </p>
              ) : null}
              <ul className="mt-3 space-y-1.5">
                {day.coding.tasks.map((t) => (
                  <ChecklistItem
                    key={t.id}
                    task={t}
                    checked={completed.has(t.id)}
                    onChange={(next) => onToggleTask(t.id, next)}
                  />
                ))}
              </ul>
            </div>

            {/* System design block */}
            <div>
              <div className="flex items-center gap-2">
                <Network size={14} className="text-sky-600 dark:text-sky-400" aria-hidden="true" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  System Design · {day.systemDesign.topic}
                </h4>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {day.systemDesign.concepts}
              </p>
              <p className="mt-2 rounded-md bg-indigo-50 p-3 text-xs leading-relaxed text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">
                <span className="font-semibold">Anchor:</span> {day.systemDesign.anchor}
              </p>
              <ul className="mt-3 space-y-1.5">
                {day.systemDesign.tasks.map((t) => (
                  <ChecklistItem
                    key={t.id}
                    task={t}
                    checked={completed.has(t.id)}
                    onChange={(next) => onToggleTask(t.id, next)}
                  />
                ))}
              </ul>
            </div>

            {/* Wrap-up */}
            {day.wrapup.length > 0 ? (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Wrap-up
                </h4>
                <ul className="mt-3 space-y-1.5">
                  {day.wrapup.map((t) => (
                    <ChecklistItem
                      key={t.id}
                      task={t}
                      checked={completed.has(t.id)}
                      onChange={(next) => onToggleTask(t.id, next)}
                    />
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Daily notes */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Daily notes
              </h4>
              <DailyNotes
                dayPadded={dayPadded}
                initialBody={note}
                onSave={(body) => onSaveNote(dayPadded, body)}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

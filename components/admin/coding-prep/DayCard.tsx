'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Code2, Network, Repeat, NotebookPen } from 'lucide-react'
import { ChecklistItem } from './ChecklistItem'
import { DailyNotes } from './DailyNotes'
import { ProgressBar } from './ProgressBar'
import type { PlanBlock, PlanBlockType, PlanDay } from '@/lib/admin/prep/types'
import { allItems } from '@/lib/admin/prep/plan-helpers'
import { cn } from '@/lib/utils'

type BlockMeta = {
  label: string
  icon: React.ReactNode
  accent: string
  isCoding: boolean
}

const BLOCK_META: Record<PlanBlockType, BlockMeta> = {
  'educative-coding': {
    label: 'Educative · Coding',
    icon: <Code2 size={14} className="text-orange-600 dark:text-orange-400" aria-hidden="true" />,
    accent: 'text-orange-600 dark:text-orange-400',
    isCoding: true,
  },
  'neetcode-reps': {
    label: 'NeetCode reps',
    icon: (
      <Repeat size={14} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
    ),
    accent: 'text-emerald-600 dark:text-emerald-400',
    isCoding: true,
  },
  'educative-sysdesign': {
    label: 'Educative · System Design',
    icon: <Network size={14} className="text-sky-600 dark:text-sky-400" aria-hidden="true" />,
    accent: 'text-sky-600 dark:text-sky-400',
    isCoding: false,
  },
  wrapup: {
    label: 'Wrap-up',
    icon: <NotebookPen size={14} className="text-zinc-500 dark:text-zinc-400" aria-hidden="true" />,
    accent: 'text-zinc-500 dark:text-zinc-400',
    isCoding: false,
  },
}

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

  const tasks = useMemo(() => allItems(day), [day])
  const completedHere = tasks.filter((t) => completed.has(t.id)).length
  const totalHere = tasks.length
  const allDone = totalHere > 0 && completedHere === totalHere

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
        className="grid w-full grid-cols-[auto_1fr_140px_auto] items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-zinc-50 sm:gap-4 sm:px-5 dark:hover:bg-zinc-900/60"
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
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <span>Day {day.day}</span>
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {day.badge}
            </span>
          </p>
          <h3 className="mt-0.5 truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
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
          <div className="space-y-6 border-t border-zinc-100 px-4 py-5 sm:px-5 dark:border-zinc-900">
            {day.blocks.map((block, idx) => (
              <BlockSection
                key={`${block.type}-${idx}`}
                block={block}
                completed={completed}
                onToggleTask={onToggleTask}
              />
            ))}

            <div className="rounded-md border-l-2 border-emerald-400 bg-emerald-50/60 px-3 py-2 text-sm italic text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/30 dark:text-emerald-200">
              <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 not-italic dark:text-emerald-400">
                Success
              </span>
              {day.successCheck}
            </div>

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

function BlockSection({
  block,
  completed,
  onToggleTask,
}: {
  block: PlanBlock
  completed: Set<string>
  onToggleTask: (taskId: string, completed: boolean) => void
}) {
  const meta = BLOCK_META[block.type]
  return (
    <div>
      <div className="flex items-center gap-2">
        {meta.icon}
        <h4 className={cn('text-xs font-semibold uppercase tracking-wider', meta.accent)}>
          {block.title ? `${meta.label} · ${block.title}` : meta.label}
        </h4>
      </div>
      <ul className="mt-3 space-y-1.5">
        {block.items.map((t) => (
          <ChecklistItem
            key={t.id}
            task={t}
            checked={completed.has(t.id)}
            isCodingTask={meta.isCoding}
            onChange={(next) => onToggleTask(t.id, next)}
          />
        ))}
      </ul>
    </div>
  )
}

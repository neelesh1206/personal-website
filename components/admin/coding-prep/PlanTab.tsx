'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Info } from 'lucide-react'
import { DayCard } from './DayCard'
import type { Plan } from '@/lib/admin/prep/types'
import { cn } from '@/lib/utils'

export function PlanTab({
  plan,
  completed,
  notes,
  onToggleTask,
  onSaveNote,
}: {
  plan: Plan
  completed: Set<string>
  notes: Record<string, string>
  onToggleTask: (taskId: string, completed: boolean) => void
  onSaveNote: (dayPadded: string, body: string) => Promise<'saved' | 'error'>
}) {
  const [rulesOpen, setRulesOpen] = useState(false)
  const [structureOpen, setStructureOpen] = useState(false)
  const [patternsOpen, setPatternsOpen] = useState(false)
  const [frameworkOpen, setFrameworkOpen] = useState(false)

  return (
    <div className="space-y-4">
      {/* Reference cards (foldable) */}
      <ReferenceCard
        open={rulesOpen}
        onToggle={() => setRulesOpen((v) => !v)}
        title="The 7 Rules (read before Day 1)"
        subtitle="Break these and the plan won't work."
      >
        <ol className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {plan.rules.map((r, i) => (
            <li key={r.id} className="flex gap-3">
              <span className="flex-none font-semibold text-zinc-400 dark:text-zinc-500">
                {i + 1}.
              </span>
              <div>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{r.title}</span>{' '}
                <span>{r.body}</span>
              </div>
            </li>
          ))}
        </ol>
      </ReferenceCard>

      <ReferenceCard
        open={structureOpen}
        onToggle={() => setStructureOpen((v) => !v)}
        title="Daily Structure"
        subtitle={`${plan.meta.timePerDay} — ${plan.meta.split}`}
      >
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {plan.dailyStructure.map((b) => (
            <li key={b.block}>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{b.block}.</span>{' '}
              {b.body}
            </li>
          ))}
        </ul>
      </ReferenceCard>

      <ReferenceCard
        open={patternsOpen}
        onToggle={() => setPatternsOpen((v) => !v)}
        title="The ~11 Patterns That Cover Most Interviews"
        subtitle="Your first job on every problem is to NAME the pattern."
      >
        <ul className="mt-3 divide-y divide-zinc-100 text-sm dark:divide-zinc-900">
          {plan.patterns.map((p) => (
            <li
              key={p.name}
              className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[180px_1fr] sm:gap-3"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{p.name}</span>
              <span className="text-zinc-600 dark:text-zinc-400">{p.when}</span>
            </li>
          ))}
        </ul>
      </ReferenceCard>

      <ReferenceCard
        open={frameworkOpen}
        onToggle={() => setFrameworkOpen((v) => !v)}
        title={plan.framework.title}
        subtitle={plan.framework.tagline}
      >
        <ol className="mt-3 space-y-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {plan.framework.steps.map((s) => (
            <li key={s.step} className="flex gap-3">
              <span className="flex-none font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {s.step}.
              </span>
              <div>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{s.title}</span>{' '}
                <span>{s.body}</span>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 rounded-md bg-indigo-50 p-3 text-xs leading-relaxed text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">
          <Info size={12} className="mr-1 inline" /> {plan.framework.advantage}
        </p>
      </ReferenceCard>

      {/* The 10 days */}
      <div className="mt-6 space-y-4">
        {plan.days.map((day) => (
          <DayCard
            key={day.day}
            day={day}
            completed={completed}
            note={notes[String(day.day).padStart(2, '0')] ?? ''}
            onToggleTask={onToggleTask}
            onSaveNote={onSaveNote}
          />
        ))}
      </div>
    </div>
  )
}

function ReferenceCard({
  open,
  onToggle,
  title,
  subtitle,
  children,
}: {
  open: boolean
  onToggle: () => void
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
        aria-expanded={open}
      >
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
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
          <div className="border-t border-zinc-100 px-5 pb-5 dark:border-zinc-900">{children}</div>
        </div>
      </div>
    </section>
  )
}

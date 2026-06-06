'use client'

import { useMemo, useState } from 'react'
import { PlanTab } from './PlanTab'
import { LibraryTab } from './LibraryTab'
import { ResetDialog } from './ResetDialog'
import { ProgressBar } from './ProgressBar'
import type { Library, Plan } from '@/lib/admin/prep/types'
import { cn } from '@/lib/utils'

type Tab = 'plan' | 'library'

export function CodingPrepClient({
  plan,
  library,
  initialCompleted,
  initialNotes,
}: {
  plan: Plan
  library: Library
  initialCompleted: string[]
  initialNotes: Record<string, string>
}) {
  const [tab, setTab] = useState<Tab>('plan')
  const [completed, setCompleted] = useState<Set<string>>(new Set(initialCompleted))
  const [notes, setNotes] = useState<Record<string, string>>(initialNotes)
  const [resetOpen, setResetOpen] = useState(false)

  const totalTasks = useMemo(() => {
    let n = 0
    for (const d of plan.days) {
      n += d.coding.tasks.length + d.systemDesign.tasks.length + d.wrapup.length
    }
    return n
  }, [plan])

  const completedCount = completed.size

  async function toggleTask(taskId: string, next: boolean) {
    // Optimistic
    setCompleted((prev) => {
      const s = new Set(prev)
      if (next) s.add(taskId)
      else s.delete(taskId)
      return s
    })
    try {
      const res = await fetch('/api/admin/prep/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, completed: next }),
      })
      if (!res.ok) throw new Error(`progress save failed: ${res.status}`)
    } catch (err) {
      console.error(err)
      // Rollback
      setCompleted((prev) => {
        const s = new Set(prev)
        if (next) s.delete(taskId)
        else s.add(taskId)
        return s
      })
    }
  }

  async function saveNote(dayPadded: string, body: string): Promise<'saved' | 'error'> {
    try {
      const res = await fetch('/api/admin/prep/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: dayPadded, body }),
      })
      if (!res.ok) throw new Error(`note save failed: ${res.status}`)
      setNotes((prev) => ({ ...prev, [dayPadded]: body }))
      return 'saved'
    } catch (err) {
      console.error(err)
      return 'error'
    }
  }

  async function resetAll() {
    try {
      const res = await fetch('/api/admin/prep/reset', { method: 'POST' })
      if (!res.ok) throw new Error(`reset failed: ${res.status}`)
      setCompleted(new Set())
      setNotes({})
      setResetOpen(false)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      {/* Top progress summary */}
      <section className="mb-6 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Overall progress
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {completedCount}{' '}
              <span className="text-base font-normal text-zinc-500 dark:text-zinc-400">
                / {totalTasks} tasks
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-rose-300 hover:text-rose-700 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-rose-700 dark:hover:text-rose-400"
          >
            Reset progress
          </button>
        </div>
        <ProgressBar completed={completedCount} total={totalTasks} className="mt-3" tone="indigo" />
      </section>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-zinc-200 dark:border-zinc-800" role="tablist">
        <TabButton active={tab === 'plan'} onClick={() => setTab('plan')}>
          10-Day Plan
        </TabButton>
        <TabButton active={tab === 'library'} onClick={() => setTab('library')}>
          Reference Library
        </TabButton>
      </div>

      {tab === 'plan' ? (
        <PlanTab
          plan={plan}
          completed={completed}
          notes={notes}
          onToggleTask={toggleTask}
          onSaveNote={saveNote}
        />
      ) : (
        <LibraryTab library={library} />
      )}

      <ResetDialog open={resetOpen} onCancel={() => setResetOpen(false)} onConfirm={resetAll} />
    </>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        '-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'border-indigo-600 text-zinc-900 dark:border-indigo-400 dark:text-zinc-50'
          : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
      )}
    >
      {children}
    </button>
  )
}

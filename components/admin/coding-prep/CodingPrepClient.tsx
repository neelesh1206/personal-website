'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { XpToastStack, type XpToastItem } from './today/XpToast'
import { fireConfetti, playTone } from '@/lib/admin/prep/celebrate'
import { PlanTab } from './PlanTab'
import { LibraryTab } from './LibraryTab'
import { ResetDialog } from './ResetDialog'
import { ProgressBar } from './ProgressBar'
import { TodayTab } from './today/TodayTab'
import { DashboardTab } from './dashboard/DashboardTab'
import type {
  BadgeRecord,
  DailyLog,
  Library,
  Plan,
  Routine,
  SettingsMap,
} from '@/lib/admin/prep/types'
import type { Quote } from '@/lib/admin/prep/daily-quote'
import type { LoadProfile } from '@/lib/admin/prep/plan-adjust'
import { cn } from '@/lib/utils'

type Tab = 'today' | 'plan' | 'library' | 'dashboard'

type Stats = {
  studyStreak: number
  trainStreak: number
  longestStreak: number
  totalProblems: number
  totalResolves: number
  totalApplications: number
}

export function CodingPrepClient({
  plan,
  library,
  routine,
  quote,
  quoteReflection,
  initialCompleted,
  initialNotes,
  todayKey,
  initialLog,
  initialTodayTaskIds,
  initialSettings,
  initialLogs,
  initialBadges,
  initialStats,
  initialTotalXp,
  slidePlanDay,
  isMaintenance,
  loadProfile,
  initialDailyXp,
}: {
  plan: Plan
  library: Library
  routine: Routine
  quote: Quote
  quoteReflection: string
  initialCompleted: string[]
  initialNotes: Record<string, string>
  todayKey: string
  initialLog: DailyLog
  initialTodayTaskIds: string[]
  initialSettings: SettingsMap
  initialLogs: DailyLog[]
  initialBadges: BadgeRecord[]
  initialStats: Stats
  initialTotalXp: number
  slidePlanDay: number | null
  isMaintenance: boolean
  loadProfile: LoadProfile
  initialDailyXp: Array<{ date: string; xp: number }>
}) {
  const [tab, setTab] = useState<Tab>('today')
  const [completed, setCompleted] = useState<Set<string>>(new Set(initialCompleted))
  const [notes, setNotes] = useState<Record<string, string>>(initialNotes)
  const [resetOpen, setResetOpen] = useState(false)
  const [log, setLog] = useState(initialLog)
  const [badges, setBadges] = useState(initialBadges)
  const [settings, setSettings] = useState(initialSettings)
  const [totalXp, setTotalXp] = useState(initialTotalXp)
  const [xpToasts, setXpToasts] = useState<XpToastItem[]>([])

  /** Push a +XP / level-up notification onto the stack. */
  const pushXp = useCallback(
    (xp: number, levelUp?: string | null) => {
      if (!xp || xp <= 0) return
      setTotalXp((t) => t + xp)
      setXpToasts((items) => [
        ...items,
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, xp, levelUp },
      ])
      const soundOn = !!settings.sound_enabled
      if (levelUp) {
        fireConfetti()
        void playTone('levelup', soundOn)
      } else {
        void playTone('tick', soundOn)
      }
    },
    [settings.sound_enabled]
  )
  const dismissXp = useCallback((id: string) => {
    setXpToasts((items) => items.filter((t) => t.id !== id))
  }, [])

  // Day-complete celebration — when the reward gets earned (= coding +
  // applications both done). Plays once per page life; refreshing won't
  // re-celebrate (the log is already saved).
  const celebratedRef = useRef(false)
  useEffect(() => {
    if (celebratedRef.current) return
    if (!log.rewardEarned) return
    celebratedRef.current = true
    fireConfetti()
    void playTone('block-complete', !!settings.sound_enabled)
  }, [log.rewardEarned, settings.sound_enabled])

  const totalTasks = useMemo(() => {
    let n = 0
    for (const d of plan.days) {
      n += d.coding.tasks.length + d.systemDesign.tasks.length + d.wrapup.length
    }
    return n
  }, [plan])

  const completedCount = completed.size

  async function toggleTask(taskId: string, next: boolean) {
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
      const json = (await res.json()) as { xp?: number; levelUp?: string | null }
      if (json.xp && json.xp > 0) pushXp(json.xp, json.levelUp)
    } catch (err) {
      console.error(err)
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
      setBadges([])
      setTotalXp(0)
      setResetOpen(false)
    } catch (err) {
      console.error(err)
    }
  }

  async function patchDailyLog(patch: Partial<DailyLog>) {
    setLog((l) => ({ ...l, ...patch }))
    try {
      const res = await fetch('/api/admin/prep/daily-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: todayKey, ...patch }),
      })
      if (res.ok) {
        const json = (await res.json()) as { xp?: number; levelUp?: string | null }
        if (json.xp && json.xp > 0) pushXp(json.xp, json.levelUp)
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function toggleRoutineTask(taskId: string, c: boolean): Promise<string[]> {
    try {
      const res = await fetch('/api/admin/prep/today', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, completed: c }),
      })
      if (!res.ok) return []
      const json = (await res.json()) as {
        newBadges?: string[]
        xp?: number
        levelUp?: string | null
      }
      if (json.xp && json.xp > 0) pushXp(json.xp, json.levelUp)
      return json.newBadges ?? []
    } catch (err) {
      console.error(err)
      return []
    }
  }

  async function addApplication(company: string, role: string): Promise<string[]> {
    try {
      const res = await fetch('/api/admin/prep/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, role }),
      })
      if (!res.ok) return []
      const json = (await res.json()) as {
        newBadges?: string[]
        xp?: number
        levelUp?: string | null
      }
      if (json.xp && json.xp > 0) pushXp(json.xp, json.levelUp)
      return json.newBadges ?? []
    } catch (err) {
      console.error(err)
      return []
    }
  }

  return (
    <>
      <XpToastStack items={xpToasts} onDone={dismissXp} />
      {tab !== 'today' ? (
        <section className="mb-6 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/30">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                10-day plan progress
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
              Reset all
            </button>
          </div>
          <ProgressBar
            completed={completedCount}
            total={totalTasks}
            className="mt-3"
            tone="indigo"
          />
        </section>
      ) : null}

      <div
        className="mb-6 flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800"
        role="tablist"
      >
        <TabButton active={tab === 'today'} onClick={() => setTab('today')}>
          Today
        </TabButton>
        <TabButton active={tab === 'plan'} onClick={() => setTab('plan')}>
          10-Day Plan
        </TabButton>
        <TabButton active={tab === 'library'} onClick={() => setTab('library')}>
          Reference Library
        </TabButton>
        <TabButton active={tab === 'dashboard'} onClick={() => setTab('dashboard')}>
          Dashboard
        </TabButton>
      </div>

      {tab === 'today' ? (
        <TodayTab
          routine={routine}
          plan={plan}
          todayKey={todayKey}
          quote={quote}
          quoteReflection={quoteReflection}
          initialLog={log}
          initialTodayTaskIds={initialTodayTaskIds}
          initialSettings={settings}
          initialStudyStreak={initialStats.studyStreak}
          initialTrainStreak={initialStats.trainStreak}
          totalXp={totalXp}
          slidePlanDay={slidePlanDay}
          isMaintenance={isMaintenance}
          loadProfile={loadProfile}
          onPatchLog={patchDailyLog}
          onToggleRoutineTask={async (id, c) => {
            const fresh = await toggleRoutineTask(id, c)
            if (fresh.length) {
              setBadges((b) => [
                ...fresh.map((bid) => ({ badgeId: bid, unlockedAt: new Date().toISOString() })),
                ...b,
              ])
            }
            return fresh
          }}
          onAddApplication={async (company, role) => {
            const fresh = await addApplication(company, role)
            if (fresh.length) {
              setBadges((b) => [
                ...fresh.map((bid) => ({ badgeId: bid, unlockedAt: new Date().toISOString() })),
                ...b,
              ])
            }
            return fresh
          }}
          onSettingsSaved={setSettings}
        />
      ) : tab === 'plan' ? (
        <PlanTab
          plan={plan}
          completed={completed}
          notes={notes}
          onToggleTask={toggleTask}
          onSaveNote={saveNote}
        />
      ) : tab === 'library' ? (
        <LibraryTab
          library={library}
          sessionSize={settings.cards_per_session ?? 15}
          onXp={(xp, lvl) => pushXp(xp, lvl)}
        />
      ) : (
        <DashboardTab
          logs={initialLogs}
          badges={badges}
          stats={initialStats}
          dailyXp={initialDailyXp}
        />
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
        '-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'border-indigo-600 text-zinc-900 dark:border-indigo-400 dark:text-zinc-50'
          : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
      )}
    >
      {children}
    </button>
  )
}

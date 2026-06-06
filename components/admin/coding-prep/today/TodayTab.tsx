'use client'

import { useCallback, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sun,
  Send,
  Network,
  Dumbbell,
  BookOpen,
  Trophy,
  CheckCircle2,
  Sparkles,
  Plus,
  Code2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import type { DailyLog, Plan, Routine, RoutineBlock, SettingsMap } from '@/lib/admin/prep/types'
import type { Quote } from '@/lib/admin/prep/daily-quote'
import type { LoadProfile } from '@/lib/admin/prep/plan-adjust'
import { cn } from '@/lib/utils'
import { PomodoroBlock } from './PomodoroBlock'
import { JournalCard } from './JournalCard'
import { DailyQuoteCard } from './DailyQuoteCard'
import { HeroHeader } from './HeroHeader'
import { SettingsDialog } from './SettingsDialog'
import { StickyTopBar } from './StickyTopBar'
import { BlockShell } from './BlockShell'

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Sun,
  Send,
  Network,
  Dumbbell,
  BookOpen,
  Trophy,
  Code2,
  Sparkles,
}

// Per-block accent colors — top stripe + icon background. Picked from
// Tailwind's saturated mid-range so they show clearly in both modes.
const BLOCK_ACCENT: Record<string, { stripe: string; iconBg: string; iconText: string }> = {
  anchor: {
    stripe: 'from-amber-400 via-orange-400 to-rose-400',
    iconBg: 'bg-amber-100 dark:bg-amber-950/60',
    iconText: 'text-amber-700 dark:text-amber-300',
  },
  applications: {
    stripe: 'from-sky-500 via-blue-500 to-indigo-500',
    iconBg: 'bg-sky-100 dark:bg-sky-950/60',
    iconText: 'text-sky-700 dark:text-sky-300',
  },
  coding: {
    stripe: 'from-indigo-500 via-violet-500 to-fuchsia-500',
    iconBg: 'bg-indigo-100 dark:bg-indigo-950/60',
    iconText: 'text-indigo-700 dark:text-indigo-300',
  },
  'system-design': {
    stripe: 'from-violet-500 via-purple-500 to-fuchsia-500',
    iconBg: 'bg-violet-100 dark:bg-violet-950/60',
    iconText: 'text-violet-700 dark:text-violet-300',
  },
  crossfit: {
    stripe: 'from-rose-500 via-red-500 to-orange-500',
    iconBg: 'bg-rose-100 dark:bg-rose-950/60',
    iconText: 'text-rose-700 dark:text-rose-300',
  },
  english: {
    stripe: 'from-teal-500 via-emerald-500 to-green-500',
    iconBg: 'bg-teal-100 dark:bg-teal-950/60',
    iconText: 'text-teal-700 dark:text-teal-300',
  },
  reward: {
    stripe: 'from-amber-400 via-yellow-400 to-amber-500',
    iconBg: 'bg-amber-100 dark:bg-amber-950/60',
    iconText: 'text-amber-700 dark:text-amber-300',
  },
}

function blockAccent(id: string) {
  return (
    BLOCK_ACCENT[id] ?? {
      stripe: 'from-zinc-400 to-zinc-500',
      iconBg: 'bg-zinc-100 dark:bg-zinc-900',
      iconText: 'text-zinc-700 dark:text-zinc-300',
    }
  )
}

function getCurrentPlanDayNum(planStartDate?: string, today = new Date()): number | null {
  if (!planStartDate) return null
  const start = new Date(planStartDate)
  start.setUTCHours(0, 0, 0, 0)
  const t = new Date(today.toISOString().slice(0, 10))
  const diffDays = Math.floor((t.getTime() - start.getTime()) / (24 * 3600 * 1000))
  return diffDays + 1
}

function prettyDate(key: string): string {
  // YYYY-MM-DD → "Friday, June 5"
  const [y, m, d] = key.split('-').map((n) => Number.parseInt(n, 10))
  const dt = new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1))
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(dt)
}

export function TodayTab({
  routine,
  plan,
  todayKey,
  quote,
  quoteReflection,
  initialLog,
  initialTodayTaskIds,
  initialSettings,
  initialStudyStreak,
  initialTrainStreak,
  totalXp,
  slidePlanDay,
  isMaintenance,
  loadProfile,
  onPatchLog,
  onToggleRoutineTask,
  onAddApplication,
  onSettingsSaved,
}: {
  routine: Routine
  plan: Plan
  todayKey: string
  quote: Quote
  quoteReflection: string
  initialLog: DailyLog
  initialTodayTaskIds: string[]
  initialSettings: SettingsMap
  initialStudyStreak: number
  initialTrainStreak: number
  totalXp: number
  slidePlanDay: number | null
  isMaintenance: boolean
  loadProfile: LoadProfile
  onPatchLog: (patch: Partial<DailyLog>) => Promise<void>
  onToggleRoutineTask: (taskId: string, completed: boolean) => Promise<string[]>
  onAddApplication: (company: string, role: string) => Promise<string[]>
  onSettingsSaved: (s: SettingsMap) => void
}) {
  const [log, setLog] = useState(initialLog)
  const [taskIds, setTaskIds] = useState<Set<string>>(new Set(initialTodayTaskIds))
  const [settings, setSettings] = useState(initialSettings)
  const [unlockedToast, setUnlockedToast] = useState<string[]>([])
  const [appCompany, setAppCompany] = useState('')
  const [appRole, setAppRole] = useState('')

  // Prefer the slid plan day from the server (lowest day not fully
  // completed) so the user sees the curriculum they should be on, not
  // necessarily the calendar-day count. Fall back to the calendar calc
  // only when the slide is missing (no plan_start_date set yet).
  const dayNum = useMemo(
    () => slidePlanDay ?? getCurrentPlanDayNum(settings.plan_start_date),
    [slidePlanDay, settings.plan_start_date]
  )
  const planDay = useMemo(() => {
    if (!dayNum) return null
    return plan.days.find((d) => d.day === dayNum) ?? null
  }, [dayNum, plan])

  // Carry-forward chip — calendar day is past slide day → we're behind
  // but the plan is honoring it. Calm, descriptive copy only.
  const calendarDay = useMemo(
    () => getCurrentPlanDayNum(settings.plan_start_date),
    [settings.plan_start_date]
  )
  const isCarryingForward =
    calendarDay !== null && dayNum !== null && calendarDay > dayNum && !isMaintenance

  function showBadgeToast(ids: string[]) {
    if (!ids.length) return
    setUnlockedToast(ids)
    setTimeout(() => setUnlockedToast([]), 4000)
  }

  async function patchLog(patch: Partial<DailyLog>) {
    setLog((l) => ({ ...l, ...patch }))
    await onPatchLog(patch)
  }

  const handleToggleTask = useCallback(
    async (taskId: string, completed: boolean) => {
      setTaskIds((s) => {
        const next = new Set(s)
        if (completed) next.add(taskId)
        else next.delete(taskId)
        return next
      })
      const newBadges = await onToggleRoutineTask(taskId, completed)
      showBadgeToast(newBadges)
    },
    [onToggleRoutineTask]
  )

  async function addApp() {
    const c = appCompany.trim()
    if (!c) return
    const newBadges = await onAddApplication(c, appRole.trim())
    setAppCompany('')
    setAppRole('')
    setLog((l) => ({ ...l, applicationsCount: l.applicationsCount + 1 }))
    showBadgeToast(newBadges)
  }

  const applicationsCompleted = useMemo(() => {
    const ids = routine.blocks.find((b) => b.id === 'applications')?.tasks ?? []
    return ids.every((t) => taskIds.has(`${todayKey}:applications:${t.id}`))
  }, [routine, taskIds, todayKey])

  const codingCompleted = log.problemsSolved >= Math.max(1, loadProfile.sprints)
  const rewardUnlocked = codingCompleted && applicationsCompleted

  // Per-block completion — what counts as "done" so the block can collapse
  // into a slim done-row. Targets respect today's load profile so a
  // re-entry day's expectations are realistic, but XP / streaks are
  // still computed off real counts (untouched).
  const doneById = useMemo<Record<string, boolean>>(() => {
    return {
      anchor: log.morningAnchorRead,
      applications: applicationsCompleted || log.applicationsCount >= loadProfile.appTarget,
      coding: codingCompleted,
      'system-design':
        loadProfile.systemDesign === 'hidden' ||
        (loadProfile.systemDesign === 'collapsed' && false), // user expands manually
      crossfit: log.trainedToday,
      english: log.readAloud,
      reward: log.rewardEarned,
    }
  }, [
    log.morningAnchorRead,
    applicationsCompleted,
    log.applicationsCount,
    loadProfile.appTarget,
    loadProfile.systemDesign,
    codingCompleted,
    log.trainedToday,
    log.readAloud,
    log.rewardEarned,
  ])

  // Dominant next-action: first uncompleted block in render order that's
  // actually required today. Reward is excluded — it's a follow-up to
  // the core blocks, not a "next action."
  const dominantId = useMemo(() => {
    for (const block of routine.blocks) {
      if (block.id === 'reward') continue
      if (block.id === 'system-design' && loadProfile.systemDesign === 'collapsed') continue
      if (!doneById[block.id]) return block.id
    }
    return null
  }, [routine.blocks, doneById, loadProfile.systemDesign])

  // Today percentage — drives the sticky top bar's progress.
  const percentComplete = useMemo(() => {
    const required = routine.blocks.filter((b) => b.id !== 'reward')
    if (required.length === 0) return 0
    const done = required.filter((b) => doneById[b.id]).length
    return Math.round((done / required.length) * 100)
  }, [routine.blocks, doneById])

  // User-controlled "peek" expand for done blocks.
  const [expandedDone, setExpandedDone] = useState<Set<string>>(new Set())
  const toggleExpanded = useCallback((id: string) => {
    setExpandedDone((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  return (
    <div className="space-y-6">
      <StickyTopBar
        dayNum={dayNum}
        totalDays={plan.days.length}
        percent={percentComplete}
        studyStreak={initialStudyStreak}
        trainStreak={initialTrainStreak}
        totalXp={totalXp}
      />
      <AnimatePresence>
        {unlockedToast.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 shadow-lg dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
          >
            🏅 Badge unlocked: {unlockedToast.join(', ')}
          </motion.div>
        )}
      </AnimatePresence>

      <HeroHeader
        dateLabel={prettyDate(todayKey)}
        dayNum={dayNum}
        totalDays={plan.days.length}
        planTheme={planDay?.title}
        studyStreak={initialStudyStreak}
        trainStreak={initialTrainStreak}
        totalXp={totalXp}
        evidenceLine={settings.evidence_line}
        settings={settings}
        onSettingsSaved={(s) => {
          setSettings(s)
          onSettingsSaved(s)
        }}
      />

      <DailyQuoteCard quote={quote} reflection={quoteReflection} />

      <LoadModeStrip
        loadProfile={loadProfile}
        isCarryingForward={isCarryingForward}
        isMaintenance={isMaintenance}
        slidePlanDay={dayNum}
      />

      {routine.blocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          log={log}
          taskIds={taskIds}
          todayKey={todayKey}
          planDay={planDay}
          rewardUnlocked={rewardUnlocked}
          rewardMinutes={settings.reward_minutes ?? 30}
          loadProfile={loadProfile}
          isDone={doneById[block.id] ?? false}
          isDominant={dominantId === block.id}
          isExpanded={expandedDone.has(block.id)}
          onToggleExpanded={() => toggleExpanded(block.id)}
          settings={settings}
          onSettingsSaved={(s) => {
            setSettings(s)
            onSettingsSaved(s)
          }}
          appCompany={appCompany}
          appRole={appRole}
          setAppCompany={setAppCompany}
          setAppRole={setAppRole}
          addApp={addApp}
          onPatchLog={patchLog}
          onToggleTask={handleToggleTask}
        />
      ))}

      <Separator />
      <JournalCard log={log} prompts={routine.journalPrompts} onPatch={patchLog} />
    </div>
  )
}

function LoadModeStrip({
  loadProfile,
  isCarryingForward,
  isMaintenance,
  slidePlanDay,
}: {
  loadProfile: LoadProfile
  isCarryingForward: boolean
  isMaintenance: boolean
  slidePlanDay: number | null
}) {
  if (loadProfile.mode === 'full' && !isCarryingForward && !isMaintenance) return null
  const accent = isMaintenance
    ? 'border-emerald-300/70 bg-emerald-50/60 text-emerald-900 dark:border-emerald-700/60 dark:bg-emerald-950/30 dark:text-emerald-200'
    : loadProfile.mode === 're-entry'
      ? 'border-sky-300/70 bg-sky-50/60 text-sky-900 dark:border-sky-700/60 dark:bg-sky-950/30 dark:text-sky-200'
      : loadProfile.mode === 'core'
        ? 'border-amber-300/70 bg-amber-50/60 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-200'
        : 'border-zinc-300/70 bg-zinc-50/70 text-zinc-700 dark:border-zinc-700/60 dark:bg-zinc-900/50 dark:text-zinc-200'
  const label = isMaintenance
    ? 'Maintenance mode'
    : loadProfile.mode === 're-entry'
      ? 'Lighter today'
      : loadProfile.mode === 'core'
        ? 'Core today'
        : 'Today'
  return (
    <div className={cn('rounded-lg border px-3.5 py-2.5 text-sm', accent)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em]">{label}</p>
        {isCarryingForward && slidePlanDay !== null ? (
          <p className="text-[10px] font-medium uppercase tracking-wider opacity-80">
            Carrying forward Day {slidePlanDay}
          </p>
        ) : null}
      </div>
      <p className="mt-1 italic" style={{ fontFamily: 'var(--font-display), Georgia, serif' }}>
        {loadProfile.toneLine}
      </p>
    </div>
  )
}

function BlockRenderer(props: {
  block: RoutineBlock
  log: DailyLog
  taskIds: Set<string>
  todayKey: string
  planDay: Plan['days'][number] | null
  rewardUnlocked: boolean
  rewardMinutes: number
  loadProfile: LoadProfile
  isDone: boolean
  isDominant: boolean
  isExpanded: boolean
  onToggleExpanded: () => void
  settings: SettingsMap
  onSettingsSaved: (s: SettingsMap) => void
  appCompany: string
  appRole: string
  setAppCompany: (v: string) => void
  setAppRole: (v: string) => void
  addApp: () => void
  onPatchLog: (p: Partial<DailyLog>) => Promise<void>
  onToggleTask: (taskId: string, completed: boolean) => Promise<void>
}) {
  const {
    block,
    log,
    taskIds,
    todayKey,
    planDay,
    rewardUnlocked,
    rewardMinutes,
    loadProfile,
    isDone,
    isDominant,
    isExpanded,
    onToggleExpanded,
    settings,
    onSettingsSaved,
    appCompany,
    appRole,
    setAppCompany,
    setAppRole,
    addApp,
    onPatchLog,
    onToggleTask,
  } = props
  const Icon = ICONS[block.icon] ?? Sparkles
  const accent = blockAccent(block.id)

  if (block.kind === 'pomodoro') {
    return (
      <PomodoroBlock
        rule={block.rule}
        duration={block.duration}
        onIncrementProblemsSolved={() => onPatchLog({ problemsSolved: log.problemsSolved + 1 })}
      />
    )
  }

  if (block.kind === 'reward') {
    return (
      <Card
        className={cn(
          'relative overflow-hidden border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50',
          rewardUnlocked && 'border-amber-300 dark:border-amber-700'
        )}
      >
        <div className={cn('absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r', accent.stripe)} />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span
              className={cn(
                'grid h-7 w-7 place-items-center rounded-md',
                accent.iconBg,
                accent.iconText
              )}
            >
              <Trophy className="h-3.5 w-3.5" />
            </span>
            {block.title}
            <span className="text-xs font-normal text-zinc-500">({rewardMinutes} min)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rewardUnlocked ? (
            <div className="flex items-center justify-between gap-3">
              <p
                style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
                className="text-base italic text-amber-900 dark:text-amber-200"
              >
                Earned. Time-boxed: {rewardMinutes} min.
              </p>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="reward-earned"
                  checked={log.rewardEarned}
                  onCheckedChange={(v) =>
                    onPatchLog({
                      rewardEarned: v === true,
                      rewardStartedAt: v === true ? new Date().toISOString() : null,
                    })
                  }
                />
                <label htmlFor="reward-earned" className="text-sm">
                  Start timer
                </label>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{block.body}</p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <BlockShell
      id={block.id}
      title={block.title}
      icon={<Icon className="h-3.5 w-3.5" />}
      isDone={isDone}
      isDominant={isDominant}
      expandedOverride={isExpanded}
      onExpandedToggle={onToggleExpanded}
      stripeClass={accent.stripe}
      iconBgClass={accent.iconBg}
      iconTextClass={accent.iconText}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span
            className={cn(
              'grid h-7 w-7 place-items-center rounded-md',
              accent.iconBg,
              accent.iconText
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
          {block.title}
          <span className="ml-auto text-xs font-normal text-zinc-500">{block.duration}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {block.rule ? (
          <p
            style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
            className="rounded-md border-l-2 border-indigo-500 bg-indigo-50/70 px-3 py-2 text-sm italic text-indigo-900 dark:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-200"
          >
            {block.rule}
          </p>
        ) : null}

        {block.id === 'anchor' ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="anchor-read"
                checked={log.morningAnchorRead}
                onCheckedChange={(v) => onPatchLog({ morningAnchorRead: v === true })}
              />
              <label htmlFor="anchor-read" className="text-sm">
                Read it. Start.
              </label>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{block.body}</p>
          </div>
        ) : null}

        {block.kind === 'checklist' ? (
          <ul className="space-y-2">
            {(block.tasks ?? []).map((t) => {
              const id = `${todayKey}:${block.id}:${t.id}`
              const checked = taskIds.has(id)
              return (
                <li key={t.id} className="flex items-center gap-2">
                  <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={(v) => onToggleTask(id, v === true)}
                  />
                  <label
                    htmlFor={id}
                    className={cn('text-sm', checked && 'line-through opacity-60')}
                  >
                    {t.label}
                  </label>
                </li>
              )
            })}
          </ul>
        ) : null}

        {block.id === 'applications' ? (
          <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Log an application ·{' '}
              <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                {log.applicationsCount} today
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              <Input
                value={appCompany}
                onChange={(e) => setAppCompany(e.target.value)}
                placeholder="Company"
                className="h-9 min-w-[140px] flex-1"
              />
              <Input
                value={appRole}
                onChange={(e) => setAppRole(e.target.value)}
                placeholder="Role"
                className="h-9 min-w-[140px] flex-1"
              />
              <Button size="sm" onClick={addApp}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Log
              </Button>
            </div>
          </div>
        ) : null}

        {block.id === 'system-design' ? (
          loadProfile.systemDesign === 'collapsed' && planDay ? (
            <details className="rounded-md border border-zinc-200 bg-zinc-50/70 text-sm open:p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
              <summary className="cursor-pointer list-none p-3 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                Stretch when ready — open today&apos;s design topic
              </summary>
              <div className="px-3 pb-3">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {planDay.systemDesign.topic}
                </p>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  {planDay.systemDesign.anchor}
                </p>
              </div>
            </details>
          ) : (
            <div className="rounded-md border border-zinc-200 bg-zinc-50/70 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/40">
              {planDay ? (
                <>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {planDay.systemDesign.topic}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    {planDay.systemDesign.anchor}
                  </p>
                </>
              ) : (
                <p className="text-xs text-zinc-500">
                  Set plan start date in{' '}
                  <SettingsDialog
                    initialSettings={settings}
                    onSaved={onSettingsSaved}
                    trigger={
                      <button
                        type="button"
                        className="font-medium text-indigo-600 underline decoration-dotted underline-offset-2 transition-colors hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Settings
                      </button>
                    }
                  />{' '}
                  to pull today&apos;s topic.
                </p>
              )}
            </div>
          )
        ) : null}

        {block.id === 'crossfit' ? (
          <div className="flex items-center gap-2">
            <Checkbox
              id="trained-today"
              checked={log.trainedToday}
              onCheckedChange={(v) => onPatchLog({ trainedToday: v === true })}
            />
            <label htmlFor="trained-today" className="text-sm">
              Trained today
            </label>
            {log.trainedToday ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : null}
          </div>
        ) : null}

        {block.id === 'english' ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="read-aloud"
                checked={log.readAloud}
                onCheckedChange={(v) => onPatchLog({ readAloud: v === true })}
              />
              <label htmlFor="read-aloud" className="text-sm">
                Read aloud 10 min
              </label>
            </div>
            {block.body ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{block.body}</p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </BlockShell>
  )
}

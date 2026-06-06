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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import type { DailyLog, Plan, Routine, RoutineBlock, SettingsMap } from '@/lib/admin/prep/types'
import { cn } from '@/lib/utils'
import { PomodoroBlock } from './PomodoroBlock'
import { JournalCard } from './JournalCard'
import { SettingsDialog } from './SettingsDialog'

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Sun,
  Send,
  Network,
  Dumbbell,
  BookOpen,
  Trophy,
  Code2: Sparkles,
}

function getCurrentPlanDayNum(planStartDate?: string, today = new Date()): number | null {
  if (!planStartDate) return null
  const start = new Date(planStartDate)
  start.setUTCHours(0, 0, 0, 0)
  const t = new Date(today.toISOString().slice(0, 10))
  const diffDays = Math.floor((t.getTime() - start.getTime()) / (24 * 3600 * 1000))
  return diffDays + 1
}

export function TodayTab({
  routine,
  plan,
  todayKey,
  initialLog,
  initialTodayTaskIds,
  initialSettings,
  onPatchLog,
  onToggleRoutineTask,
  onAddApplication,
  onSettingsSaved,
}: {
  routine: Routine
  plan: Plan
  todayKey: string
  initialLog: DailyLog
  initialTodayTaskIds: string[]
  initialSettings: SettingsMap
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

  const dayNum = useMemo(
    () => getCurrentPlanDayNum(settings.plan_start_date),
    [settings.plan_start_date]
  )
  const planDay = useMemo(() => {
    if (!dayNum) return null
    return plan.days.find((d) => d.day === dayNum) ?? null
  }, [dayNum, plan])

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

  const codingCompleted = log.problemsSolved >= 2
  const rewardUnlocked = codingCompleted && applicationsCompleted

  return (
    <div className="space-y-5">
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

      <Card className="border-zinc-200 bg-gradient-to-br from-indigo-50 to-white dark:border-zinc-800 dark:from-indigo-950/40 dark:to-zinc-900/40">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              {dayNum ? `Day ${dayNum}` : 'Today'} · {todayKey}
            </p>
            <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-300">
              {planDay ? planDay.title : routine.meta.tagline}
            </p>
          </div>
          <SettingsDialog
            initialSettings={settings}
            onSaved={(s) => {
              setSettings(s)
              onSettingsSaved(s)
            }}
          />
        </CardContent>
      </Card>

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
          evidenceLine={settings.evidence_line}
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

function BlockRenderer(props: {
  block: RoutineBlock
  log: DailyLog
  taskIds: Set<string>
  todayKey: string
  planDay: Plan['days'][number] | null
  rewardUnlocked: boolean
  rewardMinutes: number
  evidenceLine?: string
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
    evidenceLine,
    appCompany,
    appRole,
    setAppCompany,
    setAppRole,
    addApp,
    onPatchLog,
    onToggleTask,
  } = props
  const Icon = ICONS[block.icon] ?? Sparkles

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
          'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50',
          rewardUnlocked && 'border-amber-300 dark:border-amber-700'
        )}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            {block.title}
            <span className="text-xs font-normal text-zinc-500">({rewardMinutes} min)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rewardUnlocked ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
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
    <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          {block.title}
          <span className="text-xs font-normal text-zinc-500">{block.duration}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {block.rule ? (
          <p className="rounded-md border-l-2 border-indigo-500 bg-indigo-50 px-3 py-2 text-xs text-indigo-900 dark:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-200">
            {block.rule}
          </p>
        ) : null}

        {block.id === 'anchor' ? (
          <div className="space-y-2">
            {evidenceLine ? (
              <blockquote className="border-l-2 border-amber-400 pl-3 text-sm italic text-zinc-700 dark:text-zinc-300">
                {evidenceLine}
              </blockquote>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Add your evidence line in Settings — one sentence reminding you of a hard thing
                you’ve already done.
              </p>
            )}
            <div className="flex items-center gap-2">
              <Checkbox
                id="anchor-read"
                checked={log.morningAnchorRead}
                onCheckedChange={(v) => onPatchLog({ morningAnchorRead: v === true })}
              />
              <label htmlFor="anchor-read" className="text-sm">
                Read it
              </label>
            </div>
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
                  <label htmlFor={id} className="text-sm">
                    {t.label}
                  </label>
                </li>
              )
            })}
          </ul>
        ) : null}

        {block.id === 'applications' ? (
          <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/30">
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Log an application ({log.applicationsCount} today)
            </p>
            <div className="flex flex-wrap gap-2">
              <Input
                value={appCompany}
                onChange={(e) => setAppCompany(e.target.value)}
                placeholder="Company"
                className="h-9 flex-1 min-w-[140px]"
              />
              <Input
                value={appRole}
                onChange={(e) => setAppRole(e.target.value)}
                placeholder="Role"
                className="h-9 flex-1 min-w-[140px]"
              />
              <Button size="sm" onClick={addApp}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Log
              </Button>
            </div>
          </div>
        ) : null}

        {block.id === 'system-design' ? (
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/30">
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
                Set plan start date in Settings to pull today&apos;s topic.
              </p>
            )}
          </div>
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
    </Card>
  )
}

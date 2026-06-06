'use client'

import { useRef, useState } from 'react'
import { BookHeart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import type { DailyLog, JournalPrompt } from '@/lib/admin/prep/types'

export function JournalCard({
  log,
  prompts,
  onPatch,
}: {
  log: DailyLog
  prompts: JournalPrompt[]
  onPatch: (patch: Partial<DailyLog>) => Promise<void>
}) {
  const [local, setLocal] = useState(log)
  const [prevDate, setPrevDate] = useState(log.logDate)
  const [savedAt, setSavedAt] = useState<string>('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  if (prevDate !== log.logDate) {
    setPrevDate(log.logDate)
    setLocal(log)
  }

  function queueSave(patch: Partial<DailyLog>) {
    setLocal((l) => ({ ...l, ...patch }))
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      await onPatch(patch)
      setSavedAt(new Date().toLocaleTimeString())
    }, 600)
  }

  return (
    <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookHeart className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          End-of-session journal
        </CardTitle>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Autosaved. No judgment — just honesty.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {prompts.map((p) => (
          <div key={p.id}>
            <label
              htmlFor={`journal-${p.id}`}
              className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
            >
              {p.label}
            </label>
            <Textarea
              id={`journal-${p.id}`}
              value={(local[p.field] as string) ?? ''}
              onChange={(e) => queueSave({ [p.field]: e.target.value } as Partial<DailyLog>)}
              rows={2}
              className="resize-none text-sm"
              placeholder="…"
            />
          </div>
        ))}

        <div className="flex items-center gap-3">
          <Checkbox
            id="no-deviation"
            checked={local.noDeviation}
            onCheckedChange={(v) => queueSave({ noDeviation: v === true })}
          />
          <label htmlFor="no-deviation" className="text-sm text-zinc-700 dark:text-zinc-300">
            No deviation today (unlocks Cold Turkey)
          </label>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Mood: {local.mood ?? '—'}/5
          </p>
          <Slider
            min={1}
            max={5}
            step={1}
            value={[local.mood ?? 3]}
            onValueChange={(v) => queueSave({ mood: Array.isArray(v) ? (v[0] ?? null) : v })}
          />
        </div>

        {savedAt ? (
          <p className="text-right text-[10px] uppercase tracking-wider text-zinc-400">
            Saved {savedAt}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

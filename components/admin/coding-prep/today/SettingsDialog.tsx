'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { SettingsMap } from '@/lib/admin/prep/types'

export function SettingsDialog({
  initialSettings,
  onSaved,
  trigger,
}: {
  initialSettings: SettingsMap
  onSaved: (s: SettingsMap) => void
  trigger?: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [planStart, setPlanStart] = useState(initialSettings.plan_start_date ?? '')
  const [emailTime, setEmailTime] = useState(initialSettings.email_time ?? '21:00')
  const [evidence, setEvidence] = useState(initialSettings.evidence_line ?? '')
  const [reward, setReward] = useState(String(initialSettings.reward_minutes ?? 30))
  const [soundEnabled, setSoundEnabled] = useState(initialSettings.sound_enabled ?? false)
  const [myWins, setMyWins] = useState((initialSettings.my_wins ?? []).join('\n'))
  const [cardsPerSession, setCardsPerSession] = useState(
    String(initialSettings.cards_per_session ?? 15)
  )
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/prep/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_start_date: planStart || null,
          email_time: emailTime || null,
          evidence_line: evidence,
          reward_minutes: Number.parseInt(reward, 10) || 30,
          sound_enabled: soundEnabled,
          my_wins: myWins
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean),
          cards_per_session: Math.max(5, Math.min(50, Number.parseInt(cardsPerSession, 10) || 15)),
        }),
      })
      if (res.ok) {
        const json = (await res.json()) as { settings: SettingsMap }
        onSaved(json.settings)
        setOpen(false)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button variant="ghost" size="sm">
              <Settings className="mr-1.5 h-3.5 w-3.5" /> Settings
            </Button>
          )
        }
      />

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Routine settings</DialogTitle>
          <DialogDescription>Configure the structure once, then stop deciding.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="mb-1 block text-xs font-medium">Plan start date</label>
            <Input type="date" value={planStart} onChange={(e) => setPlanStart(e.target.value)} />
            <p className="mt-1 text-[11px] text-zinc-500">Day 1 of the 10-day plan.</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Daily summary time</label>
            <Input type="time" value={emailTime} onChange={(e) => setEmailTime(e.target.value)} />
            <p className="mt-1 text-[11px] text-zinc-500">
              Sent to ADMIN_EMAIL + Slack at this local time.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Evidence line (morning anchor)</label>
            <Textarea
              rows={2}
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="One sentence reminding you what you've already done."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Reward duration (minutes)</label>
            <Input
              type="number"
              min={5}
              max={120}
              value={reward}
              onChange={(e) => setReward(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800">
            <div>
              <p className="text-xs font-medium">Sound effects</p>
              <p className="text-[11px] text-zinc-500">
                Soft chimes on block + level-up. Off by default.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={soundEnabled}
              onClick={() => setSoundEnabled((v) => !v)}
              className={
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors ' +
                (soundEnabled ? 'bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-700')
              }
            >
              <span
                className={
                  'inline-block h-4 w-4 translate-y-px transform rounded-full bg-white shadow transition-transform ' +
                  (soundEnabled ? 'translate-x-[18px]' : 'translate-x-[2px]')
                }
              />
            </button>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">My wins (one per line)</label>
            <Textarea
              rows={3}
              value={myWins}
              onChange={(e) => setMyWins(e.target.value)}
              placeholder="150x scale at Walmart&#10;38 storefronts shipped&#10;consistent CrossFit"
            />
            <p className="mt-1 text-[11px] text-zinc-500">
              Surfaced in the AI encouragement line when you&apos;ve missed a day.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Flashcards per session</label>
            <Input
              type="number"
              min={5}
              max={50}
              value={cardsPerSession}
              onChange={(e) => setCardsPerSession(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-zinc-500">
              Default 15. The deck still picks due / weak first.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

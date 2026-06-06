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
}: {
  initialSettings: SettingsMap
  onSaved: (s: SettingsMap) => void
}) {
  const [open, setOpen] = useState(false)
  const [planStart, setPlanStart] = useState(initialSettings.plan_start_date ?? '')
  const [emailTime, setEmailTime] = useState(initialSettings.email_time ?? '21:00')
  const [evidence, setEvidence] = useState(initialSettings.evidence_line ?? '')
  const [reward, setReward] = useState(String(initialSettings.reward_minutes ?? 30))
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
          <Button variant="ghost" size="sm">
            <Settings className="mr-1.5 h-3.5 w-3.5" /> Settings
          </Button>
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

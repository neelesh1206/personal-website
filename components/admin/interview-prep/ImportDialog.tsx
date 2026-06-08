'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

type Props = {
  open: boolean
  onClose: () => void
  onImported: () => void
}

const SHAPE_EXAMPLE = `{
  "mode": "merge",
  "deliveryRules": ["…"],
  "questions": [
    {
      "id": "q1-about-you",
      "question": "Tell me about yourself…",
      "cues": ["…"],
      "answer": "…",
      "followUps": [],
      "cueLine": "…"
    }
  ]
}`

export function ImportDialog({ open, onClose, onImported }: Props) {
  const [text, setText] = useState('')
  const [mode, setMode] = useState<'merge' | 'replace'>('merge')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function submit() {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch (err) {
        throw new Error('Not valid JSON: ' + (err as Error).message)
      }
      const body =
        parsed && typeof parsed === 'object' && 'questions' in parsed
          ? { mode, ...(parsed as Record<string, unknown>) }
          : { mode, questions: parsed }
      const res = await fetch('/api/admin/prep/interview-questions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? `Import failed (${res.status})`)
      }
      const j = (await res.json()) as { inserted: number }
      setSuccess(`Imported ${j.inserted} question${j.inserted === 1 ? '' : 's'}.`)
      onImported()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-h-[90vh] w-[min(96vw,720px)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import questions from JSON</DialogTitle>
          <DialogDescription>
            Paste the JSON shape below.{' '}
            <strong>This stays in your browser until you click Import</strong> — no file commits, no
            logs. Use{' '}
            <code className="rounded bg-zinc-100 px-1 text-[12px] dark:bg-zinc-800">replace</code>{' '}
            to wipe + re-seed, or{' '}
            <code className="rounded bg-zinc-100 px-1 text-[12px] dark:bg-zinc-800">merge</code> to
            upsert.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <ModePill active={mode === 'merge'} onClick={() => setMode('merge')}>
              Merge (upsert by id)
            </ModePill>
            <ModePill active={mode === 'replace'} onClick={() => setMode('replace')}>
              Replace all
            </ModePill>
          </div>
          <Textarea
            rows={16}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={SHAPE_EXAMPLE}
            className="font-mono text-[12px]"
            spellCheck={false}
          />
          {error ? (
            <p className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-700 dark:bg-rose-950/30 dark:text-rose-200">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
              {success}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="min-h-11">
            Close
          </Button>
          <Button onClick={submit} disabled={saving || !text.trim()} className="min-h-11">
            <Upload className="mr-1.5 h-4 w-4" />
            {saving ? 'Importing…' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ModePill({
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
      onClick={onClick}
      aria-pressed={active}
      className={
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors ' +
        (active
          ? 'border-indigo-500 bg-indigo-50 text-indigo-900 dark:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-200'
          : 'border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300')
      }
    >
      {children}
    </button>
  )
}

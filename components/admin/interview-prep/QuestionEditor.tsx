'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { InterviewQuestion } from '@/lib/admin/prep/interview-queries'
import { MarkdownAnswer } from './MarkdownAnswer'

export type EditorMode =
  | { kind: 'closed' }
  | { kind: 'new' }
  | { kind: 'edit'; q: InterviewQuestion }

/**
 * Mounts a fresh EditorForm per (open, key) pair so React handles the
 * "reset state on mode change" via the natural unmount→remount path,
 * not via an effect that calls setState (which would trip the
 * react-hooks/set-state-in-effect rule).
 */
export function QuestionEditor({
  mode,
  onClose,
  onSaved,
}: {
  mode: EditorMode
  onClose: () => void
  onSaved: () => void
}) {
  const open = mode.kind !== 'closed'
  const editing = mode.kind === 'edit' ? mode.q : null
  const formKey =
    mode.kind === 'edit' ? `edit:${mode.q.id}` : mode.kind === 'new' ? 'new' : 'closed'

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-h-[90vh] w-[min(96vw,820px)] overflow-y-auto">
        {open ? (
          <EditorForm key={formKey} editing={editing} onClose={onClose} onSaved={onSaved} />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function EditorForm({
  editing,
  onClose,
  onSaved,
}: {
  editing: InterviewQuestion | null
  onClose: () => void
  onSaved: () => void
}) {
  const [id, setId] = useState(editing?.id ?? '')
  const [question, setQuestion] = useState(editing?.question ?? '')
  const [cuesText, setCuesText] = useState((editing?.cues ?? []).join('\n'))
  const [answer, setAnswer] = useState(editing?.answer ?? '')
  const [followUpsText, setFollowUpsText] = useState((editing?.followUps ?? []).join('\n\n'))
  const [cueLine, setCueLine] = useState(editing?.cueLine ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const cues = cuesText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
      const followUps = followUpsText
        .split(/\n{2,}/)
        .map((l) => l.trim())
        .filter(Boolean)
      const payload = { id, question, cues, answer, followUps, cueLine }

      const url = editing
        ? `/api/admin/prep/interview-questions/${editing.id}`
        : '/api/admin/prep/interview-questions'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `Save failed (${res.status})`)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editing ? 'Edit question' : 'New question'}</DialogTitle>
        <DialogDescription>
          Cues = ordered nudges. Answer accepts a tiny Markdown subset: **bold**, *italic*,
          *(pause)*, and &ldquo;- &rdquo; bullets. Paragraphs separated by blank lines.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-1">
        <Field label="Id (slug — lowercase, hyphens)" hint="e.g. q3-toughest-challenge">
          <Input
            value={id}
            onChange={(e) => setId(e.target.value.toLowerCase())}
            disabled={!!editing}
            placeholder="q1-about-you"
            className="font-mono text-[15px]"
          />
        </Field>
        <Field label="Question (the prompt the recruiter asks)">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Tell me about yourself…"
            className="text-[15px]"
          />
        </Field>
        <Field label="Cues (one per line, in order)">
          <Textarea
            rows={6}
            value={cuesText}
            onChange={(e) => setCuesText(e.target.value)}
            placeholder={'Neel → full-stack, ~8 yrs Walmart\nreorg, looking\n…'}
            className="font-mono text-[13px]"
          />
        </Field>
        <Field label="Answer (Markdown — paragraphs / bold / italic / *(pause)* / - bullets)">
          <Textarea
            rows={12}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="The toughest recent challenge was…&#10;&#10;*(pause)*&#10;&#10;So I led the response…"
            className="text-[14px]"
          />
          <div className="mt-1 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="text-[11px] font-medium text-indigo-600 underline decoration-dotted underline-offset-2 hover:text-indigo-800 dark:text-indigo-400"
            >
              {showPreview ? 'Hide preview' : 'Preview rendering'}
            </button>
          </div>
          {showPreview ? (
            <div className="mt-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
              <MarkdownAnswer markdown={answer || '_(empty)_'} />
            </div>
          ) : null}
        </Field>
        <Field label="Follow-ups (one per blank-line block)">
          <Textarea
            rows={5}
            value={followUpsText}
            onChange={(e) => setFollowUpsText(e.target.value)}
            placeholder={
              '**"How did you find the root cause?"** → traced the spike to the script.\n\n**"Was there pushback?"** → I laid out the tradeoffs.'
            }
            className="text-[14px]"
          />
        </Field>
        <Field label="Cue line (one-liner for last-minute glance)">
          <Input
            value={cueLine}
            onChange={(e) => setCueLine(e.target.value)}
            placeholder="Neel · 8 yrs Walmart · React + Java …"
            className="font-mono text-[12px]"
          />
        </Field>
      </div>

      {error ? (
        <p className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-700 dark:bg-rose-950/30 dark:text-rose-200">
          {error}
        </p>
      ) : null}

      <DialogFooter>
        <Button variant="ghost" onClick={onClose} className="min-h-11">
          Cancel
        </Button>
        <Button
          onClick={save}
          disabled={saving || !id.trim() || !question.trim()}
          className="min-h-11"
        >
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create question'}
        </Button>
      </DialogFooter>
    </>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">{hint}</p> : null}
    </div>
  )
}

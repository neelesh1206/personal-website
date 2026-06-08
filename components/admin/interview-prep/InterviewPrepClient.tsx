'use client'

import { useCallback, useMemo, useState } from 'react'
import { Plus, Search, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { InterviewQuestion } from '@/lib/admin/prep/interview-queries'
import { QuestionCard } from './QuestionCard'
import { QuestionEditor, type EditorMode } from './QuestionEditor'
import { ImportDialog } from './ImportDialog'
import { DeliveryRulesCard } from './DeliveryRulesCard'

export function InterviewPrepClient({
  initialQuestions,
  initialDeliveryRules,
}: {
  initialQuestions: InterviewQuestion[]
  initialDeliveryRules: string[]
}) {
  const [questions, setQuestions] = useState<InterviewQuestion[]>(initialQuestions)
  const [deliveryRules, setDeliveryRules] = useState<string[]>(initialDeliveryRules)
  const [query, setQuery] = useState('')
  const [editor, setEditor] = useState<EditorMode>({ kind: 'closed' })
  const [importOpen, setImportOpen] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/prep/interview-questions')
      if (!res.ok) return
      const json = (await res.json()) as { questions: InterviewQuestion[] }
      setQuestions(json.questions)
    } catch (err) {
      console.error(err)
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return questions
    return questions.filter((row) => {
      const blob = [
        row.question,
        row.cueLine,
        row.cues.join(' '),
        row.answer,
        row.followUps.join(' '),
      ]
        .join(' ')
        .toLowerCase()
      return blob.includes(q)
    })
  }, [questions, query])

  async function handleDelete(id: string) {
    if (!confirm('Delete this question? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/admin/prep/interview-questions/${id}`, { method: 'DELETE' })
      if (res.ok) setQuestions((rows) => rows.filter((r) => r.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
          Admin · Reference
        </p>
        <h1
          style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
          className="mt-2 text-3xl leading-tight text-zinc-900 sm:text-4xl dark:text-zinc-50"
        >
          Recruiter screen prep
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          Read this once before a call. Cues are nudges, not a script. Answers are how I&apos;d
          actually say it out loud.
        </p>
      </header>

      <div className="mb-4">
        <DeliveryRulesCard initialRules={deliveryRules} onSaved={setDeliveryRules} />
      </div>

      <div className="sticky top-[7.5rem] z-30 -mx-4 mb-4 bg-white px-4 py-2 sm:-mx-6 sm:px-6 dark:bg-zinc-950">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="Search questions, cues, answers…"
              className="h-11 pl-9 text-[15px]"
              aria-label="Search prep"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setImportOpen(true)}
            className="h-11"
          >
            <Upload className="mr-1.5 h-4 w-4" /> Import
          </Button>
          <Button type="button" onClick={() => setEditor({ kind: 'new' })} className="h-11">
            <Plus className="mr-1.5 h-4 w-4" /> Add
          </Button>
        </div>
        {query && filtered.length === 0 ? (
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            No matches for &ldquo;{query}&rdquo;.
          </p>
        ) : null}
      </div>

      {questions.length === 0 ? (
        <EmptyState onNew={() => setEditor({ kind: 'new' })} onImport={() => setImportOpen(true)} />
      ) : (
        <div className="space-y-3">
          {filtered.map((q, i) => (
            <QuestionCard
              key={q.id}
              q={q}
              index={i}
              onEdit={(qq) => setEditor({ kind: 'edit', q: qq })}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <QuestionEditor
        mode={editor}
        onClose={() => setEditor({ kind: 'closed' })}
        onSaved={() => void refresh()}
      />
      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => void refresh()}
      />
    </main>
  )
}

function EmptyState({ onNew, onImport }: { onNew: () => void; onImport: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/40 px-5 py-10 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
      <p className="text-base font-medium text-zinc-700 dark:text-zinc-200">No questions yet</p>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Add one manually, or paste a JSON export to seed your starter set. Nothing leaves your
        browser until you save.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Button onClick={onImport} variant="secondary" className="min-h-11">
          <Upload className="mr-1.5 h-4 w-4" /> Import JSON
        </Button>
        <Button onClick={onNew} className="min-h-11">
          <Plus className="mr-1.5 h-4 w-4" /> Add manually
        </Button>
      </div>
    </div>
  )
}

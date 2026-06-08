'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Pencil, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MarkdownAnswer } from './MarkdownAnswer'
import type { InterviewQuestion } from '@/lib/admin/prep/interview-queries'

export function QuestionCard({
  q,
  index,
  defaultOpen = false,
  onEdit,
  onDelete,
}: {
  q: InterviewQuestion
  index: number
  defaultOpen?: boolean
  onEdit: (q: InterviewQuestion) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Card className="overflow-hidden border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-zinc-50 sm:px-5 dark:hover:bg-zinc-900/60"
      >
        <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-full bg-indigo-100 text-sm font-semibold tabular-nums text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
          {index + 1}
        </span>
        <span className="flex-1 text-base font-medium text-zinc-900 sm:text-lg dark:text-zinc-50">
          {q.question}
        </span>
        <ChevronDown
          className={cn(
            'mt-1 h-5 w-5 flex-none text-zinc-400 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-6 border-t border-zinc-100 px-4 py-5 sm:px-6 dark:border-zinc-900">
              <section>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
                  Cues (in order)
                </p>
                <ol className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-1.5">
                  {q.cues.map((cue, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-1.5 rounded-md bg-zinc-100 px-2 py-1 font-mono text-[12px] leading-snug text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                    >
                      <span className="mt-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        {i + 1}.
                      </span>
                      <span>{cue}</span>
                    </li>
                  ))}
                </ol>
                {q.cueLine ? (
                  <p className="mt-2 rounded-md border-l-2 border-amber-400 bg-amber-50/60 px-3 py-1.5 font-mono text-[12px] text-amber-900 dark:border-amber-500 dark:bg-amber-950/30 dark:text-amber-200">
                    {q.cueLine}
                  </p>
                ) : null}
              </section>

              <section>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                  Answer
                </p>
                <MarkdownAnswer markdown={q.answer} />
              </section>

              {q.followUps.length > 0 ? (
                <section>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
                    Likely follow-ups
                  </p>
                  <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-zinc-700 marker:text-violet-400 sm:text-base dark:text-zinc-300">
                    {q.followUps.map((f, i) => (
                      <li key={i}>
                        <MarkdownAnswer markdown={f} className="space-y-2" />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-900">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(q)}
                  className="min-h-11"
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(q.id)}
                  className="min-h-11 text-rose-600 hover:text-rose-700 dark:text-rose-400"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  )
}

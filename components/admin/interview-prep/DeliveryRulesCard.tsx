'use client'

import { useState } from 'react'
import { ChevronDown, Pencil, Save, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export function DeliveryRulesCard({
  initialRules,
  onSaved,
}: {
  initialRules: string[]
  onSaved: (next: string[]) => void
}) {
  const [open, setOpen] = useState(true)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialRules.join('\n'))
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const next = draft
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
      const res = await fetch('/api/admin/prep/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interview_delivery_rules: next }),
      })
      if (res.ok) {
        onSaved(next)
        setEditing(false)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="overflow-hidden border-amber-200 bg-gradient-to-br from-amber-50/70 via-white to-white dark:border-amber-900/60 dark:from-amber-950/20 dark:via-zinc-900/40 dark:to-zinc-900/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-amber-50/40 sm:px-5 dark:hover:bg-amber-950/30"
        aria-expanded={open}
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
          Delivery rules — read first
        </span>
        <span className="ml-auto flex items-center gap-2">
          {!editing && initialRules.length > 0 ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                setEditing(true)
                setOpen(true)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setEditing(true)
                  setOpen(true)
                }
              }}
              className="inline-flex items-center rounded-md px-2 py-1 text-[11px] text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Pencil className="mr-1 h-3 w-3" /> Edit
            </span>
          ) : null}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-amber-700 transition-transform dark:text-amber-400',
              open && 'rotate-180'
            )}
          />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 sm:px-5">
              {editing ? (
                <div className="space-y-2">
                  <Textarea
                    rows={6}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="One rule per line."
                    className="text-[14px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-h-11"
                      onClick={() => {
                        setEditing(false)
                        setDraft(initialRules.join('\n'))
                      }}
                    >
                      <X className="mr-1 h-3.5 w-3.5" /> Cancel
                    </Button>
                    <Button size="sm" onClick={save} disabled={saving} className="min-h-11">
                      <Save className="mr-1 h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save'}
                    </Button>
                  </div>
                </div>
              ) : initialRules.length === 0 ? (
                <div className="space-y-2 text-[14px] text-zinc-600 dark:text-zinc-400">
                  <p>No delivery rules set yet.</p>
                  <Button size="sm" onClick={() => setEditing(true)} className="min-h-11">
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Add rules
                  </Button>
                </div>
              ) : (
                <ol className="list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed text-zinc-700 marker:text-amber-600 sm:text-base dark:text-zinc-200">
                  {initialRules.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ol>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  )
}

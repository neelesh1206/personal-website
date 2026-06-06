'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export function ResetDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-sm dark:bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-dialog-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h2
              id="reset-dialog-title"
              className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Reset all progress?
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              This clears every checked task and every daily note. The content (plan + library)
              stays. There&apos;s no undo.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-rose-500"
          >
            Yes, reset everything
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Loader2, Mail } from 'lucide-react'
import { contactInputSchema, type ContactInput } from '@/lib/validation/contact'
import { cn } from '@/lib/utils'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export function ContactForm({ referrer }: { referrer?: string }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactInput>({
    resolver: zodResolver(contactInputSchema),
    defaultValues: { referrer },
  })
  const [status, setStatus] = useState<Status>('idle')
  const [serverError, setServerError] = useState<string | null>(null)

  async function onSubmit(values: ContactInput) {
    setStatus('submitting')
    setServerError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? 'Submission failed')
      }
      setStatus('success')
      reset()
    } catch (err) {
      setStatus('error')
      setServerError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-900/50 dark:bg-emerald-950/30">
        <CheckCircle2
          className="mx-auto text-emerald-600 dark:text-emerald-400"
          size={36}
          aria-hidden="true"
        />
        <h2 className="mt-3 text-lg font-semibold text-emerald-900 dark:text-emerald-100">
          Got it — check your inbox.
        </h2>
        <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">
          Your resume copy is on the way. I&apos;ll personally follow up within 24 hours.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-5 text-xs font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
        >
          Send another →
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <input type="hidden" {...register('referrer')} />
      {/* Honeypot */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
        </label>
      </div>

      <Field
        label="Name"
        error={errors.name?.message}
        input={
          <input
            type="text"
            autoComplete="name"
            placeholder="Jane Recruiter"
            disabled={status === 'submitting'}
            {...register('name')}
            className={inputClass(!!errors.name)}
          />
        }
      />

      <Field
        label="Email"
        error={errors.email?.message}
        hint="I'll send your resume here automatically."
        input={
          <input
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            disabled={status === 'submitting'}
            {...register('email')}
            className={inputClass(!!errors.email)}
          />
        }
      />

      <Field
        label="Message"
        optional
        error={errors.message?.message}
        input={
          <textarea
            rows={5}
            placeholder="What's the role / problem / question?"
            disabled={status === 'submitting'}
            {...register('message')}
            className={inputClass(!!errors.message, 'resize-y')}
          />
        }
      />

      {serverError ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {serverError}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-indigo-600 disabled:hover:shadow-none sm:w-auto"
      >
        {status === 'submitting' ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Sending…
          </>
        ) : (
          <>
            <Mail size={16} /> Send and get my resume
          </>
        )}
      </button>
    </form>
  )
}

function Field({
  label,
  optional,
  hint,
  error,
  input,
}: {
  label: string
  optional?: boolean
  hint?: string
  error?: string
  input: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {label}
        {optional ? (
          <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">Optional</span>
        ) : null}
      </span>
      {input}
      {error ? (
        <span className="mt-1 block text-xs text-rose-600 dark:text-rose-400">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>
      ) : null}
    </label>
  )
}

function inputClass(hasError: boolean, extra?: string) {
  return cn(
    'block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500',
    hasError
      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200 dark:border-rose-800/70 dark:focus:ring-rose-900/50'
      : 'border-zinc-200 focus:border-indigo-400 focus:ring-indigo-200 dark:border-zinc-800 dark:focus:border-indigo-600 dark:focus:ring-indigo-900/50',
    extra
  )
}

import Link from 'next/link'
import { ArrowLeft, ArrowRight, ExternalLink, Users } from 'lucide-react'
import type { CaseStudy } from '@/lib/case-studies/types'
import { cn } from '@/lib/utils'

export function CaseStudyContent({
  caseStudy,
  prev,
  next,
}: {
  caseStudy: CaseStudy
  prev?: CaseStudy
  next?: CaseStudy
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link
        href="/work"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} /> All case studies
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={cn('font-semibold uppercase tracking-wider', caseStudy.accent.text)}>
            {caseStudy.platformLabel}
          </span>
          <span className="text-zinc-400 dark:text-zinc-500">·</span>
          <span className="text-zinc-500 dark:text-zinc-400">{caseStudy.role}</span>
          <span className="text-zinc-400 dark:text-zinc-500">·</span>
          <span className="text-zinc-500 dark:text-zinc-400">{caseStudy.period}</span>
          <span className="text-zinc-400 dark:text-zinc-500">·</span>
          <span className="text-zinc-500 dark:text-zinc-400">{caseStudy.status}</span>
          {caseStudy.customerFacing ? (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
              <Users size={11} /> Customer hot path
            </span>
          ) : null}
        </div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          {caseStudy.title}
        </h1>
        <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-300">{caseStudy.tagline}</p>
      </header>

      {/* Metrics grid */}
      <section className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {caseStudy.metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30"
          >
            <div className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {m.value}
            </div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {m.label}
            </div>
            {m.context ? (
              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{m.context}</div>
            ) : null}
          </div>
        ))}
      </section>

      {/* Summary */}
      <section className="mt-10">
        <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
          {caseStudy.summary}
        </p>
      </section>

      {/* Problem */}
      <section className="mt-10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          The problem
        </h2>
        <p className="mt-3 leading-relaxed text-zinc-700 dark:text-zinc-300">{caseStudy.problem}</p>
      </section>

      {/* Sections */}
      <div className="mt-10 space-y-10">
        {caseStudy.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {s.heading}
            </h2>
            <div className="mt-3 space-y-3 leading-relaxed text-zinc-700 dark:text-zinc-300">
              {s.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            {s.bullets && s.bullets.length > 0 ? (
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-zinc-700 dark:text-zinc-300">
                {s.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      {/* What I shipped */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          What I shipped
        </h2>
        <ul className="mt-4 space-y-3">
          {caseStudy.shipped.map((s, i) => (
            <li key={i} className="flex gap-3 text-zinc-700 dark:text-zinc-300">
              <span
                className={cn(
                  'mt-2 h-1.5 w-1.5 flex-none rounded-full',
                  caseStudy.accent.text.replace('text-', 'bg-')
                )}
                aria-hidden="true"
              />
              <span className="leading-relaxed">{s}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Stack */}
      <section className="mt-12">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Stack
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {caseStudy.stack.map((s) => (
            <span
              key={s}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      {caseStudy.links && caseStudy.links.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Links
          </h2>
          <ul className="mt-3 space-y-1">
            {caseStudy.links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                >
                  {l.label} <ExternalLink size={12} />
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Prev / next */}
      <nav className="mt-16 grid grid-cols-1 gap-4 border-t border-zinc-200 pt-8 sm:grid-cols-2 dark:border-zinc-800">
        {prev ? (
          <Link
            href={`/work/${prev.slug}`}
            className="group rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
          >
            <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
              <ArrowLeft size={12} /> Previous
            </div>
            <div className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">{prev.title}</div>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={`/work/${next.slug}`}
            className="group rounded-lg border border-zinc-200 p-4 text-right transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
          >
            <div className="flex items-center justify-end gap-1 text-xs text-zinc-500 dark:text-zinc-400">
              Next <ArrowRight size={12} />
            </div>
            <div className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">{next.title}</div>
          </Link>
        ) : null}
      </nav>
    </article>
  )
}

import Link from 'next/link'
import { ArrowRight, Users } from 'lucide-react'
import type { CaseStudy } from '@/lib/case-studies/types'
import { cn } from '@/lib/utils'

export function CaseStudyCard({ caseStudy }: { caseStudy: CaseStudy }) {
  return (
    <Link
      href={`/work/${caseStudy.slug}`}
      className={cn(
        'group relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br p-6 transition-all dark:border-zinc-800',
        caseStudy.accent.gradient,
        caseStudy.accent.border
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn('text-xs font-semibold uppercase tracking-wider', caseStudy.accent.text)}
        >
          {caseStudy.platformLabel}
        </span>
        <span className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          {caseStudy.customerFacing ? (
            <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
              <Users size={11} /> Customer hot path
            </span>
          ) : null}
          {caseStudy.status}
        </span>
      </div>

      <div>
        <h3 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {caseStudy.title}
        </h3>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{caseStudy.tagline}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {caseStudy.metrics.slice(0, 4).map((m) => (
          <div
            key={m.label}
            className="rounded-md border border-zinc-200 bg-white/60 px-2.5 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900/60"
          >
            <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {m.value}
            </span>{' '}
            <span className="text-zinc-500 dark:text-zinc-400">{m.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto flex flex-wrap gap-1.5">
        {caseStudy.stack.map((s) => (
          <span
            key={s}
            className="rounded-full bg-zinc-100/80 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300"
          >
            {s}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-900 transition-transform group-hover:translate-x-1 dark:text-zinc-50">
        Read case study <ArrowRight size={14} />
      </div>
    </Link>
  )
}

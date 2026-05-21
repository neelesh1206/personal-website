import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'
import type { Project, ProjectStatus } from '@/lib/projects/types'
import { cn } from '@/lib/utils'

const STATUS_STYLE: Record<ProjectStatus, string> = {
  Live: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Building: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Planned: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  Sunset: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
}

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {project.tag}
        </span>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-medium',
            STATUS_STYLE[project.status]
          )}
        >
          {project.status}
        </span>
      </div>

      <div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{project.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          {project.tagline}
        </p>
      </div>

      {project.metrics && project.metrics.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {project.metrics.slice(0, 3).map((m) => (
            <span
              key={m.label}
              className="rounded-md bg-zinc-50 px-2 py-1 text-xs ring-1 ring-zinc-200 dark:bg-zinc-900/60 dark:ring-zinc-700"
            >
              <strong className="tabular-nums text-zinc-900 dark:text-zinc-50">{m.value}</strong>{' '}
              <span className="text-zinc-500 dark:text-zinc-400">{m.label}</span>
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {project.stack.map((s) => (
          <span
            key={s}
            className="rounded px-2 py-0.5 text-[11px] text-zinc-500 ring-1 ring-zinc-200 dark:text-zinc-400 dark:ring-zinc-700"
          >
            {s}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between text-sm font-medium">
        <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
          Learn more
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </span>
        {project.liveUrl ? (
          <span className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            Live <ExternalLink size={11} />
          </span>
        ) : null}
      </div>
    </Link>
  )
}

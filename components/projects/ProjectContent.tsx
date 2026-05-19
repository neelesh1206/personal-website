import Link from 'next/link'
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react'
import type { Project, ProjectStatus } from '@/lib/projects/types'
import { cn } from '@/lib/utils'

const STATUS_STYLE: Record<ProjectStatus, string> = {
  Live: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Building: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Planned: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  Sunset: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
}

export function ProjectContent({ project }: { project: Project }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} /> All projects
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {project.tag}
          </span>
          <span className="text-zinc-400 dark:text-zinc-500">·</span>
          <span className="text-zinc-500 dark:text-zinc-400">{project.period}</span>
          <span
            className={cn(
              'ml-1 rounded-full px-2 py-0.5 text-xs font-medium',
              STATUS_STYLE[project.status]
            )}
          >
            {project.status}
          </span>
        </div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          {project.title}
        </h1>
        <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-300">{project.tagline}</p>

        {project.liveUrl ? (
          <div className="mt-5">
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25"
            >
              Visit live site
              <ExternalLink size={14} />
            </a>
          </div>
        ) : null}
      </header>

      {project.metrics && project.metrics.length > 0 ? (
        <section className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {project.metrics.map((m) => (
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
      ) : null}

      <section className="mt-10">
        <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
          {project.summary}
        </p>
      </section>

      {project.problem ? (
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            The problem
          </h2>
          <p className="mt-3 leading-relaxed text-zinc-700 dark:text-zinc-300">{project.problem}</p>
        </section>
      ) : null}

      {project.sections && project.sections.length > 0 ? (
        <div className="mt-10 space-y-10">
          {project.sections.map((s) => (
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
      ) : null}

      {project.shipped && project.shipped.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            What I shipped
          </h2>
          <ul className="mt-4 space-y-3">
            {project.shipped.map((s, i) => (
              <li key={i} className="flex gap-3 text-zinc-700 dark:text-zinc-300">
                <span
                  className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-indigo-500"
                  aria-hidden="true"
                />
                <span className="leading-relaxed">{s}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Stack
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {project.stack.map((s) => (
            <span
              key={s}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      {project.links && project.links.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Links
          </h2>
          <ul className="mt-3 space-y-1">
            {project.links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'inline-flex items-center gap-1 text-sm',
                    l.primary
                      ? 'font-medium text-indigo-600 dark:text-indigo-400'
                      : 'text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50'
                  )}
                >
                  {l.label} <ExternalLink size={12} />
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav className="mt-16 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
        >
          <ArrowLeft size={14} /> Back to all projects
        </Link>
        <Link
          href="/connect"
          className="float-right inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          Get in touch <ArrowRight size={14} />
        </Link>
      </nav>
    </article>
  )
}

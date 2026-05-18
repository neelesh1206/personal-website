import { ExternalLink, FileText } from 'lucide-react'
import { createMetadata } from '@/lib/metadata'
import { formatPublishedOn, publications } from '@/lib/writing/data'

export const metadata = createMetadata({
  title: 'Writing',
  description:
    'Peer-reviewed papers and articles on generative AI, MLOps orchestration, and content-management architecture.',
})

export default function WritingPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <header className="mb-12">
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Writing</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Published papers.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          Peer-reviewed articles on generative AI, MLOps orchestration, and content-management
          architecture — patterns I&apos;ve worked with at scale at Walmart, written up for a wider
          audience.
        </p>
      </header>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Peer-reviewed publications · {publications.length}
        </h2>
        <ul className="space-y-4">
          {publications.map((p) => (
            <li key={p.slug}>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-indigo-700"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400">
                    <FileText size={12} />
                    Paper
                  </span>
                  <span>·</span>
                  <span>{p.journal}</span>
                  <span>·</span>
                  <span className="tabular-nums">{formatPublishedOn(p.publishedOn)}</span>
                </div>

                <h3 className="mt-2 text-lg font-semibold leading-snug text-zinc-900 group-hover:text-indigo-600 dark:text-zinc-50 dark:group-hover:text-indigo-400">
                  {p.title}
                </h3>

                <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {p.abstract}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-50">
                    Read on {new URL(p.url).hostname.replace(/^www\./, '')}
                    <ExternalLink size={12} />
                  </span>
                </div>

                {p.doi ? (
                  <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">DOI: {p.doi}</p>
                ) : null}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

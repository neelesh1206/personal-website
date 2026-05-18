import { CaseStudyCard } from '@/components/work/CaseStudyCard'
import { PLATFORMS, caseStudies, getCaseStudiesByPlatform } from '@/lib/case-studies/data'
import { createMetadata } from '@/lib/metadata'
import type { PlatformId } from '@/lib/case-studies/types'

export const metadata = createMetadata({
  title: 'Case Studies',
  description:
    'Production case studies from 8+ years at Walmart Global Tech — PRISM (the content platform that scaled Walmart homepages 150×) and Tempo (the CMS behind 38 storefronts).',
})

const PLATFORM_ORDER: PlatformId[] = ['prism', 'tempo']

export default function WorkPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <header className="mb-14">
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Case Studies</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Work that ships to 38 storefronts.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          Six interlocking systems at Walmart Global Tech — two platforms, ~$11/day to ~$767/day of
          cloud spend, sub-50ms customer reads, and a 150× homepage scaling story. Pick a card to
          read the architecture and what I shipped.
        </p>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-500 dark:text-zinc-400">
          <span>
            <strong className="text-zinc-900 dark:text-zinc-50">{caseStudies.length}</strong> case
            studies
          </span>
          <span>
            <strong className="text-zinc-900 dark:text-zinc-50">2</strong> platforms (PRISM, Tempo)
          </span>
          <span>
            <strong className="text-zinc-900 dark:text-zinc-50">38</strong> storefronts
          </span>
          <span>
            <strong className="text-zinc-900 dark:text-zinc-50">150×</strong> homepage scale
          </span>
        </div>
      </header>

      <div className="space-y-16">
        {PLATFORM_ORDER.map((platformId) => {
          const platform = PLATFORMS[platformId]
          const studies = getCaseStudiesByPlatform(platformId)
          return (
            <section key={platformId}>
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {platform.label}
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
                    {platform.description}
                  </p>
                </div>
                <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                  {studies.length} case stud{studies.length === 1 ? 'y' : 'ies'}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {studies.map((cs) => (
                  <CaseStudyCard key={cs.slug} caseStudy={cs} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}

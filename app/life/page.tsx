import { Suspense } from 'react'
import { createMetadata } from '@/lib/metadata'
import { getStravaDashboard } from '@/lib/strava/client'
import { StravaDashboard, StravaDashboardError } from '@/components/life/StravaDashboard'

export const metadata = createMetadata({
  title: 'Life',
  description:
    'Beyond the keyboard — running, hiking, travel, books, F1, NFL, tennis, cricket, astronomy. Live activity stats pulled from Strava.',
})

export const revalidate = 3600

async function loadStravaData() {
  try {
    return { ok: true as const, data: await getStravaDashboard() }
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

async function StravaSection() {
  const result = await loadStravaData()
  return result.ok ? (
    <StravaDashboard data={result.data} />
  ) : (
    <StravaDashboardError error={result.error} />
  )
}

export default function LifePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <header className="mb-12">
        <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Life</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Beyond the keyboard.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          CrossFit, trail runs, hikes around the PNW, F1 race weekends, books I&apos;m working
          through, and the occasional clear night with the telescope. The activity stats below are
          live from Strava — refreshed hourly.
        </p>
      </header>

      <section aria-label="Strava activity dashboard">
        <Suspense
          fallback={
            <div className="h-64 animate-pulse rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50" />
          }
        >
          <StravaSection />
        </Suspense>
      </section>
    </main>
  )
}

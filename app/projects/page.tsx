import { ProjectCard } from '@/components/projects/ProjectCard'
import { projects } from '@/lib/projects/data'
import { createMetadata } from '@/lib/metadata'

export const metadata = createMetadata({
  title: 'Projects',
  description:
    'Side projects — products and libraries built outside of work hours. Includes MarketMind, a gamified stock-prediction app shipped in 5 days, and supporting open-source work.',
})

export default function ProjectsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <header className="mb-12">
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Projects</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Things I&apos;m building.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          Products and libraries built outside of work hours — usually to scratch an itch or to
          extract a pattern from production work into something reusable.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {projects.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>
    </main>
  )
}

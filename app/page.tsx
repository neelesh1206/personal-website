import Link from 'next/link'
import { ArrowRight, MapPin, Hammer, BookOpen, Compass } from 'lucide-react'
import { defaultMetadata } from '@/lib/metadata'
import { caseStudies } from '@/lib/case-studies/data'
import { HomePageJsonLd } from '@/components/seo/JsonLd'

export const metadata = defaultMetadata

const FEATURED_SLUGS = ['prism-backend', 'tempo-v3-ui', 'tempo-runtime']
const featuredWork = FEATURED_SLUGS.map((slug) => caseStudies.find((c) => c.slug === slug)!).filter(
  Boolean
)

const featuredProjects = [
  {
    slug: 'outbox-kit',
    tag: 'Open Source',
    title: 'outbox-kit',
    description:
      'TypeScript + Java library implementing the transactional outbox pattern — the same reliability primitive that runs Walmart homepages at 150× scale.',
    stack: ['TypeScript', 'Java', 'Kafka', 'PostgreSQL'],
    status: 'Building',
    statusColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  {
    slug: 'pr-reviewer',
    tag: 'AI Tool',
    title: 'PR Reviewer',
    description:
      'Claude-powered GitHub App that reviews pull requests with structured outputs, inline comments, and acceptance rate tracking.',
    stack: ['Claude API', 'Next.js', 'GitHub App', 'Postgres'],
    status: 'Planned',
    statusColor: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  },
]

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <HomePageJsonLd />
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="flex min-h-[calc(100vh-4rem)] flex-col justify-center py-20">
        {/* Availability badge */}
        <div className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 dark:border-green-800/50 dark:bg-green-950/30 dark:text-green-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          Open to Staff SWE roles · Seattle &amp; Bay Area
        </div>

        {/* Name */}
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl lg:text-7xl">
          Neelesh
          <br />
          <span className="text-indigo-600 dark:text-indigo-400">Kakaraparthi.</span>
        </h1>

        {/* Title */}
        <p className="mt-4 text-xl font-medium text-zinc-500 dark:text-zinc-400 sm:text-2xl">
          Senior Full-Stack Software Engineer
        </p>

        {/* Description */}
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
          8+ years at Walmart Global Tech building full-stack systems at scale. Led the platform
          that grew Walmart homepages from{' '}
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">20 → 3,500+</span> and
          modernised the authoring tool used by merchants across{' '}
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">38 storefronts</span>{' '}
          daily.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/work"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25"
          >
            View My Work
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/connect"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            Get Resume
          </Link>
        </div>

        {/* Location */}
        <div className="mt-6 flex items-center gap-1.5 text-sm text-zinc-400 dark:text-zinc-500">
          <MapPin size={14} />
          <span>Redmond, WA</span>
        </div>
      </section>

      {/* ── Currently ──────────────────────────────────────────────── */}
      <section className="mb-20 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          <span className="font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-xs">
            Currently
          </span>
          <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
            <Hammer size={14} className="text-indigo-500" />
            <span>Building this portfolio</span>
          </div>
          <div className="hidden h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-600 sm:block" />
          <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
            <BookOpen size={14} className="text-indigo-500" />
            <span>Reading Designing Data-Intensive Applications</span>
          </div>
          <div className="hidden h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-600 sm:block" />
          <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
            <Compass size={14} className="text-indigo-500" />
            <span>Exploring Staff SWE opportunities</span>
          </div>
        </div>
      </section>

      {/* ── Featured Work ──────────────────────────────────────────── */}
      <section className="mb-20">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Selected Work
          </h2>
          <Link
            href="/work"
            className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            All case studies <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {featuredWork.map((item) => (
            <Link
              key={item.slug}
              href={`/work/${item.slug}`}
              className={`group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:hover:shadow-zinc-900/50 ${item.accent.gradient} ${item.accent.border}`}
            >
              <span
                className={`text-xs font-semibold uppercase tracking-wider ${item.accent.text}`}
              >
                {item.platformLabel}
              </span>

              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {item.tagline}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {item.metrics.slice(0, 3).map((m) => (
                  <span
                    key={m.label}
                    className="rounded-md bg-white/70 px-2 py-1 text-xs ring-1 ring-zinc-200 dark:bg-zinc-900/60 dark:ring-zinc-700"
                  >
                    <strong className="tabular-nums text-zinc-900 dark:text-zinc-50">
                      {m.value}
                    </strong>{' '}
                    <span className="text-zinc-500 dark:text-zinc-400">{m.label}</span>
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {item.stack.slice(0, 4).map((s) => (
                  <span
                    key={s}
                    className="rounded px-2 py-0.5 text-[11px] text-zinc-500 ring-1 ring-zinc-200 dark:text-zinc-400 dark:ring-zinc-700"
                  >
                    {s}
                  </span>
                ))}
              </div>

              <div className="mt-auto flex items-center gap-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Read case study
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Platform Map ───────────────────────────────────────────── */}
      <section className="mb-20">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Platform map
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Two platforms, six interlocking services. PRISM owns the content model; Tempo owns the
            rendering model. They meet at the storefront.
          </p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 hidden md:table-cell">Hot path</th>
                <th className="px-4 py-3 hidden sm:table-cell">Stack</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {caseStudies.map((cs) => (
                <tr
                  key={cs.slug}
                  className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/work/${cs.slug}`}
                      className="font-medium text-zinc-900 hover:text-indigo-600 dark:text-zinc-50 dark:hover:text-indigo-400"
                    >
                      {cs.title}
                    </Link>
                  </td>
                  <td className={`px-4 py-3 font-medium ${cs.accent.text}`}>{cs.platformLabel}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{cs.role}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-zinc-500 dark:text-zinc-400">
                    {cs.customerFacing ? 'Customer-facing' : 'Authoring'}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-zinc-500 dark:text-zinc-400">
                    {cs.stack.slice(0, 3).join(' · ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Featured Projects ──────────────────────────────────────── */}
      <section className="mb-20">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Side Projects
          </h2>
          <Link
            href="/projects"
            className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            All projects <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {featuredProjects.map((item) => (
            <Link
              key={item.slug}
              href={`/projects/${item.slug}`}
              className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:shadow-zinc-900/50"
            >
              {/* Tag + Status */}
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {item.tag}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${item.statusColor}`}
                >
                  {item.status}
                </span>
              </div>

              {/* Title */}
              <h3 className="mb-2 font-mono text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {item.title}
              </h3>

              {/* Description */}
              <p className="mb-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {item.description}
              </p>

              {/* Stack */}
              <div className="flex flex-wrap gap-1.5">
                {item.stack.map((s) => (
                  <span
                    key={s}
                    className="rounded px-2 py-0.5 text-xs text-zinc-500 ring-1 ring-zinc-200 dark:text-zinc-500 dark:ring-zinc-700"
                  >
                    {s}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                Learn more
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Connect CTA ────────────────────────────────────────────── */}
      <section className="mb-20 rounded-2xl bg-indigo-600 px-8 py-12 text-center dark:bg-indigo-600/90">
        <h2 className="mb-2 text-2xl font-bold text-white">Want to reach out?</h2>
        <p className="mb-6 text-indigo-200">
          Leave your email and I&apos;ll send you my resume directly.
        </p>
        <Link
          href="/connect"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50"
        >
          Get in touch <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  )
}

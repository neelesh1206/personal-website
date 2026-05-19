import type { Project } from './types'

export const projects: Project[] = [
  {
    slug: 'marketmind',
    title: 'MarketMind',
    tagline: 'Multi-source stock-intelligence platform with a daily prediction mechanic',
    tag: 'Product',
    status: 'Live',
    period: '2026 · shipped in 5 days',
    liveUrl: 'https://marketmind.neeleshkakaraparthi.dev',
    summary:
      'A gamified prediction layer over 50 curated stocks. Aggregates 10+ financial data sources (prices, news, analyst ratings, insider activity, social sentiment) into a transparent per-stock signal breakdown, runs each daily insight through a FinBERT + Llama-3 NLP pipeline, and ships polished gamification (streaks, badges, animated result reveals, shareable cards) on top of an enterprise-grade architecture — RLS, type safety end-to-end, observability from day one.',
    metrics: [
      { value: '50', label: 'Curated stocks', context: 'hand-picked, not the full market' },
      { value: '10+', label: 'Data sources', context: 'prices, news, ratings, insider, social' },
      { value: '5 days', label: 'Time to MVP', context: '~40-50 focused hours' },
      { value: '~$38/mo', label: 'Cloud spend', context: 'Massive + HuggingFace Pro + Upstash' },
      { value: '~15 min', label: 'Daily pipeline', context: 'GitHub Actions cron, 8 PM ET' },
      { value: '<150 KB', label: 'JS bundle', context: 'gzipped on the prediction page' },
    ],
    stack: [
      'Next.js 15 (App Router)',
      'TypeScript strict',
      'Tailwind + shadcn/ui',
      'Framer Motion',
      '@vercel/og',
      'Supabase (Postgres + Auth + RLS)',
      'Upstash Redis',
      'Python + pandas + ta-lib',
      'HuggingFace Pro',
      'FinBERT',
      'Llama-3',
      'GitHub Actions',
      'Sentry + PostHog',
      'Vercel',
      'Zod',
    ],
    problem:
      'Prediction markets are having a moment (Polymarket, Kalshi). Stock-tracking apps are commodity. The gap: a trustworthy, social, gamified prediction layer for stocks that doesn’t require real money and doesn’t masquerade as investment advice. Audience: friends + portfolio reviewers. Constraints: 5-day build, $40/mo cloud cap, must showcase frontend taste, insights must feel valuable. These constraints created the product — they didn’t just bound it.',
    sections: [
      {
        heading: 'No aggregate UP/DOWN verdict, only signal breakdown',
        paragraphs: [
          'The instinct is to combine all signals into one "UP, HIGH confidence" recommendation. I chose not to. A verdict homogenizes user behavior (everyone bets the same direction → no game), looks like investment advice (legal risk), feels like a black box (reduces perceived value of the data), and a breakdown forces users to interpret — which makes the insights feel valuable, the stated product goal.',
          'This single choice unlocked the trust UI patterns (cross-source agreement counters, source attribution, methodology page) — none of which would have made sense alongside a one-line verdict.',
        ],
      },
      {
        heading: 'Supabase over Neon — using two stacks is fine when each is the right tool',
        paragraphs: [
          'This portfolio runs on Neon. Consistency would say "use Neon here too." I picked Supabase anyway. Multi-tenant data with hard isolation needs (user A must never see user B’s bets), database-level RLS beats app-layer security (fewer footguns), Auth + DB sharing a JWT trust boundary saves real time, and on a day-1 budget Supabase saved 3–4 hours on auth + RLS plumbing.',
          'The lesson worth carrying: using one stack everywhere is a junior heuristic. Stack choice is per-project, per-constraint.',
        ],
      },
      {
        heading: 'GitHub Actions for the pipeline, not a Python service',
        paragraphs: [
          'Conventional wisdom for a Python data pipeline: stand up FastAPI on Fly.io. Rejected. The pipeline is a batch job that runs ~15 minutes per day. An always-on service for a daily cron is operational waste. GitHub Actions gives me 2k free minutes/month, version-controlled workflows, secrets management built in, and zero additional infrastructure to monitor.',
          'Architecture should match access patterns. A cron job is not a service.',
        ],
      },
      {
        heading: 'Massive as the single paid data source, free APIs fill the rest',
        paragraphs: [
          'Picked one paid data API ($29 Massive Stocks Starter — prices + news + technicals in one) over a fan-out of cheaper sources. Reliability of core data beats quantity. Free APIs (Finnhub, SEC EDGAR, StockTwits, Reddit, ApeWisdom, FRED) fill the rest. 10+ sources total, but one is the reliable foundation. The "boring tech" principle: one professional API beats five flaky scrapers.',
        ],
      },
      {
        heading: 'Gamification got a dedicated day, not scattered polish',
        paragraphs: [
          'I initially planned to sprinkle gamification across the build. Cut that. Day 4 was reserved for nothing but gamification + animation polish. The difference between "yeah, streaks" and "Duolingo moment" is hours of polish. Polish doesn’t survive context-switching with backend work. The result-reveal animation is the most portable showcase artifact in the whole project — it needed focused, uninterrupted time.',
          'Showcase moments need protected time. Treating them as polish-at-the-end is how they become forgettable.',
        ],
      },
      {
        heading: 'Enterprise-grade engineering practices from day one',
        paragraphs: [
          'Documentation discipline: README, CHANGELOG, ADRs, runbook, setup guide maintained alongside code from day one. Type safety end-to-end: TypeScript strict, Supabase-generated types, Zod validation at every API boundary. Row-Level Security on every user-data table, even where data is currently public — practice the pattern. Observability wired up (Sentry + PostHog) before the first feature shipped. Pipeline resilience: retry with backoff, circuit breakers, graceful degradation per fetcher. Audit trails in pipeline_runs + stock_insight_sources tables.',
        ],
      },
      {
        heading: 'What I deliberately deferred',
        paragraphs: [
          'Backtest harness (best done after MVP signals stabilise — week 2 as its own showcase piece). Push notifications (iOS PWA support is shaky). Crowd-split odds (needs a user base to be meaningful). Premium scraped sources (free APIs cover analyst data adequately). Real-money mechanics (compliance burden + ethics — maybe never).',
          'The deferrals are themselves a design choice. Saying no is harder than saying yes.',
        ],
      },
    ],
    shipped: [
      'Daily insight pipeline running on GitHub Actions cron: fetches 10+ data sources in parallel for all 50 stocks, runs FinBERT sentiment + Llama-3 TL;DR summarisation, writes structured insights to Supabase.',
      'Predict-the-direction game loop: UP/DOWN bets before market open using virtual credits, resolutions at market close, streaks + badges + weekly leaderboards.',
      'Per-stock signal breakdown UI with cross-source agreement counters, source attribution, and methodology page — instead of a black-box verdict.',
      'Animated result-reveal sequence with confetti + shareable @vercel/og cards.',
      'Type-safe end-to-end stack: Supabase-generated types + Zod validation at every API boundary.',
      'Row-Level Security policies on every user-data table.',
      'Observability spine: Sentry error tracking + PostHog product analytics, both wired up before feature work began.',
      'Pipeline resilience: retry-with-backoff, circuit breakers, per-fetcher graceful degradation; every run logged to pipeline_runs for audit.',
    ],
    links: [
      { label: 'Live site', href: 'https://marketmind.neeleshkakaraparthi.dev', primary: true },
    ],
  },
  {
    slug: 'outbox-kit',
    title: 'outbox-kit',
    tagline: 'TypeScript + Java library implementing the transactional outbox pattern',
    tag: 'Open Source',
    status: 'Building',
    period: '2026 – present',
    summary:
      'The same reliability primitive that runs Walmart homepages at 150× scale, extracted into a small library you can drop into a Spring Boot or Node.js service. Atomic DB → Kafka delivery without distributed transactions.',
    stack: ['TypeScript', 'Java', 'Kafka', 'PostgreSQL', 'Drizzle ORM', 'Spring Boot'],
  },
  {
    slug: 'pr-reviewer',
    title: 'PR Reviewer',
    tagline: 'Claude-powered GitHub App that reviews pull requests with inline comments',
    tag: 'AI Tool',
    status: 'Planned',
    period: '2026',
    summary:
      'A GitHub App that fetches PR diffs, runs them through Claude with structured-output schemas, and posts inline review comments. Tracks acceptance rate over time so the prompt can be tuned against real signal.',
    stack: ['Claude API', 'Next.js', 'GitHub App SDK', 'Postgres', 'Drizzle ORM', 'Zod'],
  },
]

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug)
}

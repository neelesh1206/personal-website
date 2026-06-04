import type { Project } from './types'

export const projects: Project[] = [
  {
    slug: 'marketmind',
    title: 'MarketMind',
    tagline: 'Daily stock prediction game on top of a transparent multi-source signal engine',
    tag: 'Product',
    status: 'Live',
    period: 'May 2026 · 5-day build, still shipping',
    liveUrl: 'https://marketmind.neeleshkakaraparthi.dev',
    summary:
      'Every weeknight at 8 PM ET a Python pipeline behaves like a research analyst — visits ~10 data sources for each of 50 curated stocks, scores everything into four signal buckets, and produces a UP/DOWN/NEUTRAL verdict with a one-sentence explanation. Users open the app the next morning, see the signals and verdict, and place a virtual-credit bet before the window locks at 1 PM ET. At 4:15 PM the resolution job scores every bet — and MarketMind’s own call — against the day’s close. The app itself never calls the data sources: the pipeline is the producer, Supabase is the contract, the Next.js app is the consumer.',
    metrics: [
      {
        value: '50',
        label: 'Curated stocks',
        context: 'weekly auto-rotation based on user requests + activity',
      },
      {
        value: '~10',
        label: 'Data sources',
        context:
          'Massive, Finnhub, SEC EDGAR, StockTwits, ApeWisdom, Reddit, FRED, HuggingFace, yfinance',
      },
      {
        value: '4',
        label: 'Signal buckets',
        context: 'Technical · Sentiment · Professional · Social',
      },
      { value: '20', label: 'ADRs', context: 'every meaningful decision documented' },
      {
        value: '$38 / mo',
        label: 'All-in cloud cost',
        context: '$29 Massive + $9 HF Pro + $0 everything else',
      },
      {
        value: '~15 min',
        label: 'Nightly pipeline',
        context: 'GitHub Actions runner, 8 PM ET, fanned out across 50 stocks',
      },
    ],
    stack: [
      'Python + pandas + ta-lib',
      'Supabase (Postgres + Auth + RLS)',
      'FinBERT (local CPU, pinned SHA)',
      'Llama-3.1-8B-Instruct (HF Pro)',
      'GitHub Actions',
      'Cloudflare Worker (cron trigger)',
      'Upstash Redis',
      'Next.js 15 (App Router)',
      'TypeScript strict',
      'Tailwind + shadcn/ui',
      'Framer Motion',
      '@vercel/og',
      'Zod',
      'Mistral-Nemo (ungated fallback)',
      'Sentry + PostHog',
      'Vercel',
    ],
    problem:
      'Prediction markets are having a moment (Polymarket, Kalshi). Stock-tracking apps are commodity. The gap: a trustworthy, social, gamified prediction layer for stocks that doesn’t require real money and doesn’t masquerade as investment advice. Audience: friends + portfolio reviewers. Hard constraints going in: 5-day build (40–50 focused hours), $40/mo cloud cap, must showcase frontend taste, insights must feel valuable. These constraints created the product — they didn’t just bound it.',
    sections: [
      {
        heading: 'What goes into a single stock’s daily reading',
        paragraphs: [
          'Each stock is scored into four buckets, normalised to [−1, +1], and weighted into a single verdict. Technical comes from yfinance OHLCV (RSI, MACD crossover, 20/50-day MA distance, Bollinger position, volume trend). Sentiment comes from Massive news + FinBERT + Polygon’s per-ticker insights (articles are pre-filtered by Polygon’s per-ticker relevance signal at fetch time, FinBERT classification is blended with Polygon’s categorical sentiment, recency-weighted). Professional comes from Finnhub (analyst Buy/Hold/Sell consensus, rating changes, earnings proximity) + SEC EDGAR (Form 4 insider transactions, 8-K material events). Social comes from StockTwits + ApeWisdom + Reddit — bullish ratios, mention deltas, retail attention rank.',
          'Macro context (VIX, sector ETFs from FRED) is fetched once per run and stored alongside in `signal_breakdown.macro` for future regime-aware scoring. The exact verdict formula lives in `pipeline/processors/verdict.py` and is documented in three separate ADRs (signal-quality fixes, vol-normalised direction threshold, cross-sectional ranking).',
        ],
      },
      {
        heading: 'FinBERT runs locally on the runner, the LLM stays on the API',
        paragraphs: [
          'FinBERT classifies each news article as positive/neutral/negative. Per ADR 0012, the model file (~440 MB) is downloaded once from HuggingFace Hub and cached across CI runs via `actions/cache@v4`. Every subsequent classification happens in-process on the GitHub Actions runner via `transformers` + CPU-only `torch` — no per-article network calls, no shared rate limits, no cold-start tax. We pin to a specific commit SHA (`4556d130…`) so the weights never silently change under our resolved-prediction track record.',
          'The Llama-3.1-8B-Instruct LLM that produces verdict explanations and article TL;DRs stays on HuggingFace Inference because 8B+ models don’t fit on a free CI runner’s RAM. A shared circuit breaker (`pipeline/processors/_hf_breaker.py`) short-circuits after 5 consecutive HF failures, so an HF outage caps the cost at a handful of timeouts instead of bleeding the whole 50-stock run. Ungated fallback is `Mistral-Nemo-Instruct-2407` so local dev / fresh deploys without HF Pro still produce usable text. We don’t pin a SHA on the LLM — display-text drift is harmless and we want upstream improvements as Meta and Mistral ship them. Net effect: the prediction math is reproducible, the display text gets frontier progress, and the pipeline doesn’t depend on HF being healthy to produce a verdict.',
        ],
      },
      {
        heading: 'Honest verdict UX — publish your own track record alongside it',
        paragraphs: [
          'The instinct is to ship a verdict and hide the track record. I shipped both. MarketMind’s own daily UP/DOWN/NEUTRAL calls live in `marketmind_predictions` and resolve at market close every day. Cumulative accuracy is shown on `/about` with sample size alongside the percentage — small N is noisy, so the denominator is always visible. This is the only honest way to ship a verdict primitive (ADR 0007 supersedes the original "no aggregate verdict" stance once the track record table existed to back it up).',
          'A separate UX pass (ADR 0014, ADR 0015) vol-normalises the direction threshold per stock (TSLA needs more move than KO to cross "UP") and ranks predictions cross-sectionally so the daily feed shows the model’s top-conviction calls, not the most-volatile tickers by accident.',
        ],
      },
      {
        heading: 'Cloudflare Worker for cron, not GitHub Actions `schedule:`',
        paragraphs: [
          'GitHub Actions `schedule:` triggers drift by up to 3 hours under load and have no firing SLA — documented in their own docs. For a daily-ritual app where the bet window opens immediately after pipeline completion, multi-hour drift erodes trust ("why is the app showing yesterday’s data?"). Per ADR 0016, the trigger source moved to a Cloudflare Worker (~80 lines) that fires three cron triggers and dispatches each workflow via the `workflow_dispatch` REST API. Workers Free tier covers ~3 fires/day with 100,000 to spare.',
          'GitHub keeps the `workflow_dispatch:` blocks (rock-solid; no SLA issues observed) but drops all `schedule:` blocks. The Worker is the single source of truth for pipeline timing. A separate amendment to the ADR documents the DST gotcha (crons are fixed UTC, ET wall-clock shifts ±1h) and the redeploy-after-wrangler.toml-edits operational rule that bit us once already.',
        ],
      },
      {
        heading: 'Live prices on top of pipeline insights, via shared Redis',
        paragraphs: [
          'The signal pipeline runs once a night, so its `prev_close` snapshot is correct but stale by intraday standards. Each stock card and detail page also fetches a real-time quote from Finnhub’s free-tier `/quote` endpoint. The quote is cached in Upstash Redis with a 5-minute TTL using a single `MGET` round-trip for all visible tickers — so 50 stocks × N users still cost at most ~10 Finnhub calls/minute globally, well under the free-tier 60/min limit.',
          'Cache lives in shared Redis (not Next’s `unstable_cache`) because Vercel spreads requests across function instances; per-instance caches would multiply Finnhub calls past the limit. Successful quotes get 300s TTL, nulls get 60s TTL (negative cache stops us hammering a temporarily-failing ticker without committing a 5-minute black mark). Failure modes are all graceful: no Upstash creds → direct Finnhub on every request; no Finnhub key → UI shows "—"; Finnhub 4xx/5xx → cached null; Redis network blip → fall through.',
        ],
      },
      {
        heading: 'Polygon’s per-ticker insights as the relevance gate at fetch',
        paragraphs: [
          'Polygon’s `/v2/reference/news` response contains a per-article `insights[]` array where each entry has `ticker` + `sentiment` + `sentiment_reasoning` (free-text note specific to that ticker). Polygon only adds an `insights` entry when the article specifically discusses that ticker — so an article tagged with CVX but missing from `insights[]` is just a passing mention (sector piece, adjacent-company M&A) we should drop.',
          'Per ADR 0020 (the latest decision in the project), three changes ride together: the news fetcher drops articles where the target ticker isn’t in `insights[]` (kills 9–15% of noise at the source, saves FinBERT + LLM tokens on irrelevant articles), Polygon’s categorical sentiment is mapped to numeric and averaged with FinBERT’s continuous score, and the summariser prompt seeds the LLM with Polygon’s `sentiment_reasoning` as "a hint to refine, not as ground truth." A separate read-side filter shipped earlier the same day catches whatever survives the upstream filter — belt-and-suspenders that can be dropped once the upstream proves reliable.',
        ],
      },
      {
        heading: 'Promo-code redemption — a small feature, three database invariants',
        paragraphs: [
          'Per ADR 0019, users can redeem campaign codes (e.g. `LAUNCH2026`) for virtual credits, gated by three invariants enforced at the database layer rather than the app: per-(code, user) uniqueness via a `unique(code_id, user_id)` constraint on the redemption ledger; per-user daily inflow capped at 1,000 credits via a `(redeemed_at at time zone ‘America/New_York’)::date` check inside the redemption RPC; and `max_redemptions` enforced via `SELECT … FOR UPDATE` on the code row so two concurrent redemptions can’t race past the cap.',
          'Admin path (`/admin/codes`) is gated by an `ADMIN_EMAILS` env-var allowlist (single-tenant by design; a role column on `user_profiles` is a 30-minute migration when we need it). All redemption-error copy is deliberately vague — `not_found`, `inactive`, and `invalid_format` all surface as "That code isn’t valid." so a brute-forcer can’t probe which codes exist. The whole feature is ~400 lines across one RPC, two tables, one admin page, one user-side dialog.',
        ],
      },
      {
        heading: 'Weekly auto-rotation of the 50-stock universe',
        paragraphs: [
          'The universe was hand-picked at project start but staying static would make the product feel dead. Per ADR 0018, every Sunday at 8 AM ET a job demotes active stocks that are both (a) on zero user watchlists and (b) have zero predictions in the last 30 days, and promotes top-voted user requests (≥3 unique-user votes) that pass fresh Finnhub validation. The always-50 invariant is preserved via `swap_count = min(demotion_candidates, validated_promotions)` — if 4 candidates are demotion-eligible but only 2 promotions pass validation, only 2 get swapped.',
          'Bets are paused all day Sunday ET (Saturday remains open) while rotation runs. Newly-promoted stocks have Monday’s insights computed via a `python -m pipeline.fetch_insights --ticker X` subprocess before market open. Every rotation event is recorded in `stock_rotations` with ticker / action / votes-at-action / reason for future audit UI.',
        ],
      },
      {
        heading: 'Documentation discipline as a hard rule',
        paragraphs: [
          'Per ADR 0001, every shipped feature updates CHANGELOG.md with a one-line entry, README.md if setup or capability changed, and an ADR in `docs/adr/` if a design choice was made. Every manual step encountered updates SETUP.md or RUNBOOK.md. This is the most important meta-decision in the project — it’s why there are 20 ADRs after 5 days and why the README accurately describes the current shipped behaviour, not the original plan.',
          'Type safety is end-to-end: TypeScript strict, Supabase-generated types from the live schema, Zod validation at every API boundary. RLS policies sit on every user-data table, even where data is currently public (practice the pattern). Sentry + PostHog were wired up before the first feature shipped. Audit trails in `pipeline_runs` + `stock_insight_sources` track every execution and source response.',
        ],
      },
    ],
    shipped: [
      'Daily insight pipeline on GitHub Actions: 50 stocks × ~10 data sources in parallel, FinBERT sentiment classification locally on the runner, Llama-3.1 verdict explanations via HuggingFace Pro, writes structured insights to Supabase.',
      'UP/DOWN/NEUTRAL verdict + one-sentence English explanation per stock, vol-normalised per stock so high-vol tickers don’t falsely dominate the conviction list (ADR 0014, ADR 0015).',
      'Public track record — MarketMind’s own daily calls resolve at market close, cumulative accuracy shown on `/about` with sample size always visible (ADR 0007).',
      'Predict-the-direction game loop: UP/DOWN bets with virtual credits, bet window from 8 PM previous-day to 1 PM ET, resolution at 4:15 PM, entry-vs-close resolution for in-market bets (ADR 0017).',
      'Cloudflare Worker external cron trigger replacing GitHub Actions `schedule:` blocks — the trigger source is now the single source of truth for pipeline timing (ADR 0016).',
      'Polygon per-ticker `insights[]` used as the relevance gate at fetch time + sentiment blend input + LLM summariser prompt seed (ADR 0020, shipped today).',
      'Live-price layer on top of pipeline insights — Finnhub `/quote` cached in shared Upstash Redis with 5-min TTL, ~10 calls/min globally regardless of user count.',
      'Promo-code redemption with three database-enforced invariants (per-user uniqueness, daily cap, max-redemptions race protection) and an admin page gated by env-var allowlist (ADR 0019).',
      'Weekly auto-rotation of the 50-stock universe based on user requests + activity signals (ADR 0018), with always-50 invariant + Sunday bet closure + subprocess backfill of new stocks.',
      'Gamification + animation polish: streaks, badges, animated result-reveal modal, shareable `@vercel/og` cards, daily login bonus, pull-to-refresh, haptics on bet placement.',
      'Resilient pipeline patterns: retry-with-backoff, per-fetcher circuit breakers, graceful degradation, HF shared breaker, every run logged to `pipeline_runs` for audit.',
      'Row-Level Security policies on every user-data table; SECURITY DEFINER RPCs for redemption and bet placement to enforce business invariants at the DB layer; service-role client confined to admin paths only.',
      'Type-safety spine: TypeScript strict, Supabase-generated types, Zod validation at every API boundary; CI runs format → lint → typecheck → vitest → Playwright smoke → build.',
      'Observability spine: Sentry error tracking + PostHog product analytics, wired up before feature work began.',
      '20 ADRs across 5 days documenting every meaningful design decision — the documentation discipline rule (ADR 0001) is enforced as a project invariant.',
    ],
    links: [
      { label: 'Live site', href: 'https://marketmind.neeleshkakaraparthi.dev', primary: true },
    ],
  },
  {
    slug: 'gear-nest',
    title: 'GearNest',
    tagline:
      'Semantic outdoor + fitness gear aggregator — 50k products, AI chat, price comparison across 8 stores',
    tag: 'Product',
    status: 'Building',
    period: '2026 – present',
    liveUrl: 'https://github.com/neelesh1206/gear-nest',
    summary:
      'A semantic discovery and price-comparison platform for outdoor, hiking, running, camping, and fitness gear. Aggregates 50,000+ products across 8 retailers (Amazon, REI, Backcountry, Cabela’s, Moosejaw, Steep & Cheap, CampSaver, Garage Grown Gear) with a unified catalog, a best-value price ranking (price × store rating), and product-scoped RAG chat grounded in real specs and community reviews. Polyglot monorepo — Rust ingestion pipeline, Java 21 + Spring Boot RAG orchestrator, Next.js 16 frontend, PostgreSQL 16 + pgvector + Redis backing it.',
    metrics: [
      { value: '50k+', label: 'Products', context: '8 stores aggregated into one catalog' },
      { value: '~3M', label: 'Review chunks', context: 'indexed in pgvector for grounded chat' },
      { value: '3', label: 'Services / languages', context: 'Rust + Java + TypeScript monorepo' },
      {
        value: '$30/mo',
        label: 'GCP budget cap',
        context: 'Cloud Run + Cloud SQL + Pub/Sub auto-disable',
      },
      {
        value: '20+',
        label: 'ADRs',
        context: 'entity resolution, HNSW anti-pattern, stratified retrieval',
      },
      {
        value: '8M+',
        label: 'Vector chunks',
        context: 'specs + chunked reviews, exact KNN per product',
      },
    ],
    stack: [
      'Rust (Tokio + sqlx + reqwest)',
      'Java 21 + Spring Boot 3',
      'Spring AI (HuggingFace)',
      'Next.js 16 (App Router)',
      'TypeScript strict',
      'PostgreSQL 16 + pgvector',
      'Redis (Upstash)',
      'BAAI/bge-small-en-v1.5 (384d embeddings)',
      'Mistral-7B-Instruct (HF Pro)',
      'GCP Cloud Run + Cloud SQL',
      'Tailwind v4 + shadcn/ui',
      'TanStack Query + SSE',
      'Framer Motion',
      'Docker + GitHub Actions',
      'Vercel',
      'Zod',
    ],
    problem:
      'Outdoor enthusiasts shop across 8+ specialised retailers — comparing prices manually, reading scattered reviews on each site, and using keyword search that fails for nuanced queries like "which sleeping bag works below -20°F and packs under 2 lbs?" Built this because I hike, trail run, and CrossFit — and a unified, semantic gear search genuinely should exist.',
    sections: [
      {
        heading: 'Rust for the ingestion pipeline — not Python',
        paragraphs: [
          'Scraping 8 stores concurrently, normalising 50k products, chunking 3M review texts, and generating vector embeddings for all of them is CPU and I/O bound. Rust’s async model (Tokio) runs all 8 store scrapers concurrently with zero data races guaranteed at compile time. Rayon handles CPU-bound normalisation in parallel. The memory footprint is roughly 10× lower than a JVM equivalent, which matters on constrained Cloud Run batch-job machines.',
          'The pipeline is built around a StoreCrawler trait — each store’s implementation is transport-agnostic (clean HTTP, proxy rotation, or headless browser via chromiumoxide). Upgrading one store’s anti-bot approach is a one-file change that doesn’t touch the normaliser, chunker, or embedder.',
        ],
      },
      {
        heading: 'Entity resolution — the hardest correctness problem in e-commerce aggregation',
        paragraphs: [
          '"MSR PocketRocket 2" and "Mountain Safety Research Pocket Rocket II Stove" are the same product. Naive string similarity breaks immediately on real retailer title data. GearNest uses a three-tier resolution system: structural identifiers (GTIN/ASIN, O(1) lookup from affiliate APIs), structured attribute extraction (a ~40-brand alias table + model-number regex), and embedding similarity on canonical attribute strings as a fallback.',
          'Each match gets a confidence tier (EXACT / HIGH / MEDIUM / CANDIDATE). CANDIDATE rows are written to the DB but filtered from the user-facing price comparison table — they sit in a review queue rather than silently corrupting the canonical product graph. Documented as ADR-007, the single most important invariant in the ingestion pipeline.',
        ],
      },
      {
        heading: 'Java RAG orchestrator — product-scoped chat via stratified retrieval',
        paragraphs: [
          'The chat is always product-scoped. Users ask about a specific product ("Is this good for below-freezing conditions?") and the system retrieves context from that product’s indexed chunks only. Because the filter is so selective (~75 rows per product), an HNSW vector index would degrade to a sequential scan — exact KNN over 75 embeddings is microseconds and 100% accurate. The pgvector indexes are btree on product_id, not HNSW.',
          'Retrieval is stratified to prevent sentiment bias: semantic top-5 (with MMR for diversity) + top-3 negative review chunks (guaranteed failure modes regardless of query direction) + top-2 spec chunks. A pure top-10 cosine query on "Is this good for rain?" would cluster around rain chunks and miss the snow failure. Stratification makes answers trustworthy.',
          'Session budget (5 questions per 2-hour session) uses a Redis WATCH/MULTI reserve-then-commit pattern — budget rolls back if HuggingFace never responds, preventing wasted questions on timeouts.',
        ],
      },
      {
        heading: 'GCP hybrid deployment with a hard $30/mo cap',
        paragraphs: [
          'Cloud Run for the API (scale-to-zero, paid only on request) + Cloud SQL for Postgres (because Cloud Run can’t host pgvector) + Upstash Redis (serverless) + Vercel for the frontend. A Cloud Billing budget at $30 fires a Pub/Sub notification that triggers a Cloud Function — which suspends Cloud Run, downsizes Cloud SQL, and stops the pipeline scheduler. So the upper bound is enforced infrastructurally, not by trust.',
        ],
      },
      {
        heading: 'Three parallel Claude Code sessions, one shared schema',
        paragraphs: [
          'The monorepo is deliberately split into three services (pipeline / api / web) each with its own CLAUDE.md scoping the agent to that service. Session 0 owns the contract — Postgres schema, OpenAPI spec, ADRs, infra. Sessions A/B/C each implement one service against the contract, never editing each other’s code. This makes parallel CLI work possible without merge conflicts and forces every cross-service question to surface as an OpenAPI or schema change.',
        ],
      },
    ],
    shipped: [
      'Monorepo scaffold (3 services), Postgres schema with monthly range-partitioned price_history, OpenAPI 3.0 spec, 20 ADRs.',
      'Rust ingestion pipeline: Amazon PA-API + scraper traits, 3-tier entity resolution, sentence-aware spec chunker, fixed-overlap review chunker, HuggingFace embedding batching, pgvector bulk insert, Redis stale-while-revalidate price cache.',
      'Java RAG orchestrator: hybrid search (cosine 0.6 + FTS 0.4), best-value scorer, session budget service with reserve-then-commit, SSE chat streaming on Java 21 virtual threads.',
      'Next.js 16 frontend: server-rendered catalog with facets, product detail with price table + tiered reviews, debounced server-action search suggestions, client chat panel consuming SSE.',
      'GitHub Actions Claude code-review workflow with model-gated quotas, scope-boundary enforcement, OpenAPI contract conformance.',
    ],
    links: [{ label: 'GitHub', href: 'https://github.com/neelesh1206/gear-nest', primary: true }],
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

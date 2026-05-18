import type { CaseStudy, PlatformId } from './types'

const PRISM_ACCENT = {
  gradient: 'from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/10 dark:to-purple-500/10',
  border: 'hover:border-indigo-300 dark:hover:border-indigo-700',
  text: 'text-indigo-600 dark:text-indigo-400',
}

const TEMPO_ACCENT = {
  gradient: 'from-sky-500/10 to-cyan-500/10 dark:from-sky-500/10 dark:to-cyan-500/10',
  border: 'hover:border-sky-300 dark:hover:border-sky-700',
  text: 'text-sky-600 dark:text-sky-400',
}

const TEMPO_RUNTIME_ACCENT = {
  gradient: 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/10 dark:to-teal-500/10',
  border: 'hover:border-emerald-300 dark:hover:border-emerald-700',
  text: 'text-emerald-600 dark:text-emerald-400',
}

export const PLATFORMS: Record<PlatformId, { label: string; description: string }> = {
  prism: {
    label: 'PRISM',
    description:
      'Content + personalization platform that decouples copy/creative from Tempo modules — drove Walmart homepages from 20 to 3,500+.',
  },
  tempo: {
    label: 'Tempo',
    description:
      'Walmart’s configuration-based CMS for merchandising — 38 production storefronts, separated authoring write-path from a sub-50ms customer read-path.',
  },
}

export const caseStudies: CaseStudy[] = [
  {
    slug: 'prism-backend',
    platform: 'prism',
    platformLabel: 'PRISM · Backend',
    title: 'cxt-msg-asset-service',
    tagline: 'The PRISM system of record — Java 21, partitioned Postgres, Kafka outbox',
    role: 'Backend engineer (co-owner)',
    period: '2024 – present',
    status: 'In production',
    customerFacing: false,
    summary:
      'PRISM’s backend system of record. Persists every Message + Asset, validates schemas for partner systems (SmartCreative, Digital Eyes), and is the upstream source of truth for downstream content distribution services (Pronto, IronBank, Tango, asset-discovery, P13N).',
    metrics: [
      { value: '150×', label: 'Homepage scale', context: '20 → 3,500+ landing pages' },
      { value: '+6.8%', label: 'mWeb ATF CTR', context: 'A/B vs Athena modules' },
      { value: '+16%', label: 'Editor efficiency', context: 'CP / HP page-build workflows' },
      { value: '12k+ / 24k+', label: 'Messages / Assets', context: 'live in production' },
      { value: '~2 TPS', label: 'Write traffic', context: 'p95 ≈ 250ms' },
      { value: '$11 / day', label: 'Cloud spend', context: 'service + DB + Kafka' },
    ],
    stack: [
      'Java 21',
      'Spring Boot 3.5',
      'Hibernate JPA',
      'QueryDSL 5',
      'PostgreSQL',
      'Liquibase',
      'Kafka',
      'Forklift outbox',
      'OpenTelemetry',
      'GKE / Istio',
      'Akeyless',
    ],
    problem:
      'Athena modules required heavy seed overhead per landing page, had no real-time P13N sync, and used non-standard preview tooling. To scale Walmart from 20 hand-built homepages to thousands of targeted pages, the team needed reusable content as a first-class entity — with a strict lifecycle, multi-tenant isolation, and reliable Kafka fan-out to downstream consumers.',
    sections: [
      {
        heading: 'The PRISM domain model',
        paragraphs: [
          'A Message is "any idea we want to communicate to the customer" (Halloween Toys, Father’s Day, Local Bakery Finds). It owns schedule, targeting rules, eligible pages, and the linked destination — the four levers P13N uses to decide which Message to surface for a given customer on a given page.',
          'Every Message hangs off a Message Hierarchy with a primary M0 parent (enables rollup reporting, campaign-level management, richer P13N signal). Each Message owns 1…N Assets, each Asset owns 1…N AssetConfigs (one per locale carrying the actual headline, image URL, CTA, colours, alignment).',
          'The lifecycle is a strict state machine: Draft → In Progress → Published → Ended / Archived / Unpublished. P13N reads this state to make per-customer surface decisions.',
        ],
      },
      {
        heading: 'Why list-partitioned Postgres',
        paragraphs: [
          'The Asset table is list-partitioned across assets_active / assets_inactive / assets_default with a composite primary key (asset_id, status). When an asset transitions ACTIVE → ARCHIVED, Postgres physically row-moves it across partitions — keeping hot OLTP load on the active partition while preserving full audit history.',
          'Referential integrity is held together with a deferred-cascade FK from asset_config back to asset, so partition row-movement doesn’t orphan configs mid-transition. Without that, you get phantom configs pointing at archived assets and a slow leak of garbage.',
        ],
      },
      {
        heading: 'Four datasources, one Strati layer',
        paragraphs: [
          'A single REST surface, but four physical datasources behind it (postgres, postgres-no-cdc, postgres-wtp, postgres-asset-ingestion), CCM-driven role injection toggles Kafka emission per write-path. This isolates translation + ingestion workloads from core OLTP load so a flood of Figma ingests can’t slow down editor saves.',
        ],
      },
      {
        heading: 'Forklift transactional outbox — atomic DB + Kafka',
        paragraphs: [
          'Distributed transactions across DB and Kafka don’t exist in practice. The Forklift library writes the outbox row inside the same DB transaction as the entity mutation, and a background drainer publishes that tracker row to Kafka after commit — textbook outbox pattern.',
          'Downstream consumers (Pronto, IronBank, asset-discovery, P13N) therefore never see a dual-write inconsistency. Either the Message exists and the event will be delivered, or neither happened.',
        ],
      },
      {
        heading: 'Multi-tenant isolation as a default',
        paragraphs: [
          'A request-scoped WcpHeaders bean carries tenantId for the lifetime of the request. GenericBaseDAO.getDefaultPredicates injects the tenant predicate on every JPA query automatically, so no DAO can accidentally skip it. 25+ repositories therefore get tenant isolation for free — you have to actively opt out, not opt in.',
        ],
      },
      {
        heading: 'Optimistic concurrency for bulk edits',
        paragraphs: [
          'Hibernate @Version on a BaseDO superclass maps to DB_LOCK_VERSION. A structured LockException unwrap pipeline (Strati LockException → FoundException → PersistenceException → PSQLException) surfaces deeply-nested DB errors as actionable HTTP 409s on bulk operations, so the UI can show "this asset was edited by someone else" instead of a 500 stack trace.',
        ],
      },
      {
        heading: 'Auto-ingestion: Figma → Digital Eyes → Pronto → Asset',
        paragraphs: [
          "Eliminates merchant copy-paste between systems. A unique_ingested_figma_asset_constraint enforces idempotency — the same Figma layer can’t accidentally ingest twice. A partial unique index (WHERE status = 'START') enforces single-flight ingestion per tenant per metadata key, so a thundering herd of concurrent Figma webhooks can’t create duplicate work.",
        ],
      },
    ],
    shipped: [
      'Modeled the PRISM domain (message, asset, asset_config, message_pages, message_targeting, message_group, message_hierarchy) plus the Draft → In Progress → Published → Ended/Archived/Unpublished state machine that P13N reads.',
      'Designed the list-partitioned Postgres schema with composite PK (asset_id, status) and a deferred-cascade FK from asset_config — enabling lifecycle-driven row-movement across assets_active / assets_inactive / assets_default without losing referential integrity.',
      'Architected a four-datasource layout (postgres, postgres-no-cdc, postgres-wtp, postgres-asset-ingestion) over Walmart’s Strati framework with CCM-driven role injection, toggling Kafka emission per write-path.',
      'Hardened DB → Kafka reliability with the Forklift transactional-outbox / tracker-table pattern, writing the outbox row inside the same DB transaction as the entity mutation.',
      'Delivered the auto-ingestion pipeline (Figma → Digital Eyes → SmartCreative → Pronto → Asset) with constraint-based idempotency and single-flight protection.',
      'Shipped the Dynamic Asset Update (DAU) pipeline propagating CTA / attribute changes from the canonical asset out to every PRISM module’s deep-copied default — keeping non-personalized renders consistent with the system of record.',
      'Built a multi-tenant data-access layer that transparently injects a tenantId predicate on every query via a request-scoped WcpHeaders bean and GenericBaseDAO.getDefaultPredicates — eliminating per-DAO tenancy plumbing across 25+ repositories.',
      'Implemented optimistic concurrency control (Hibernate @Version on a BaseDO superclass + a structured LockException unwrap pipeline) surfacing deeply-nested errors as actionable HTTP 409s on bulk operations.',
      'Integrated Digital Eyes asset-image analysis and the Walmart Translation Platform on a dedicated postgres-wtp datasource, triggering translation requests automatically on every asset insert and default-locale change.',
      'Deployed to GKE behind GSLB with Istio sidecar, Akeyless-managed secrets, and a SonarQube quality gate at 80% — running for roughly $11/day in combined cloud spend.',
    ],
    accent: PRISM_ACCENT,
  },
  {
    slug: 'prism-ui',
    platform: 'prism',
    platformLabel: 'PRISM · UI',
    title: 'Prism V3 UI',
    tagline: 'The editor surface that drove 150× homepage scaling',
    role: 'Frontend engineer',
    period: '2024 – present',
    status: 'In production',
    customerFacing: false,
    summary:
      'Third-generation editor that replaces the legacy asset-discovery editor and unifies three previously fragmented workflows — Asset Discovery, Asset Requests, and Message Authoring — under a single tenant-aware Next.js 15 shell.',
    metrics: [
      { value: '150×', label: 'Homepages launched', context: '20 → 3,500+' },
      { value: '+16%', label: 'Editor efficiency', context: 'page-build workflows' },
      { value: '48%', label: 'Offshore shift', context: '33% → 58%' },
      { value: '6', label: 'Downstream services', context: 'one hardened BFF' },
    ],
    stack: [
      'Next.js 15 (App Router)',
      'React 19',
      'TypeScript 5',
      'TanStack Query',
      'React Hook Form + Zod',
      'Living Design',
      'Fastify BFF',
      'A2A signature signing',
      'W3C trace propagation',
    ],
    problem:
      'Editors juggled three disconnected tools to ship a single campaign — one to discover existing creative, another to request new creative from design, a third to author the Message and wire it to pages and audiences. Context loss between tabs cost real editor time and made hand-offs lossy.',
    sections: [
      {
        heading: 'Tenant-scoped URLs as a first-class concept',
        paragraphs: [
          'Tenant lives in the URL (e.g. /tenant/WM_GLASS/asset-discovery/assets) rather than in client state, so editors can deep-link to a specific brand/locale without state pollution. Tenant-aware Edge middleware handles /{tenant}/ rewrites across all 38 tenants and reconciles cookies on cross-tenant navigation.',
        ],
      },
      {
        heading: 'One BFF, six downstream services',
        paragraphs: [
          'A single hardened Fastify proxy consolidates SSRF protection, A2A signature signing, and W3C trace propagation across roughly six downstream services (Tempo Service, Message Asset Service, RMA, CCM2, Pronto, IronBank). Adding a seventh is a ~50-line typed-client template, not a multi-day BFF refactor.',
        ],
      },
      {
        heading: 'Streaming Suspense for editor responsiveness',
        paragraphs: [
          'TanStack Query’s streaming-Suspense integration on the App Router means the editor shell paints instantly while individual sections (asset gallery, message list, audience picker) stream in independently. Editors stopped looking at full-page spinners between every click.',
        ],
      },
      {
        heading: 'Super Agent chat drawer',
        paragraphs: [
          'A conversational drawer (api/services/SuperAgentService) lets editors interact with an LLM-backed copilot for content tasks without leaving the workspace — quick translations, alt-text suggestions, copy variants — wired through the same BFF proxy so trace context and tenant identity flow into the LLM call.',
        ],
      },
    ],
    shipped: [
      'Built the unified asset → message → publish editor shell on Next.js 15 App Router, replacing three previously separate tools.',
      'Implemented tenant-aware middleware (middleware.ts) so all routes are scoped by /{tenant}/ and authenticate against the right RMA tenant context.',
      'Designed a hardened Fastify BFF proxy collapsing SSRF protection, A2A signature signing, and W3C trace propagation for every outbound service call.',
      'Wired typed TanStack Query hooks per downstream service so each form field gets background revalidation and optimistic UI without per-component plumbing.',
      'Integrated a conversational Super Agent drawer that proxies LLM calls through the same BFF — trace context and tenant identity flow into the LLM provider for auditability.',
      'Stood up the OpenObserve dashboards, Quantum Metrics RUM, and a Playwright e2e suite hitting live stage.',
    ],
    accent: PRISM_ACCENT,
  },
  {
    slug: 'tempo-v3-ui',
    platform: 'tempo',
    platformLabel: 'Tempo · UI',
    title: 'Tempo V3 UI + Fastify BFF',
    tagline: 'Ground-up rewrite of Walmart’s merchandising CMS authoring tool',
    role: 'Lead frontend / BFF engineer',
    period: '2025 – present',
    status: 'Active rollout',
    customerFacing: false,
    summary:
      'Replacing the legacy Electrode V1 + GraphQL + React 16 stack with Next.js 15 App Router on React 19, fronted by a Fastify BFF that fans out to 15 downstream Walmart services. Live across 38 storefronts.',
    metrics: [
      { value: '38', label: 'Production tenants', context: 'multi-region active-active' },
      { value: '~60%', label: 'Build time ↓', context: 'cold-start vs Electrode V1' },
      { value: '>92%', label: 'Trace propagation', context: '1,284 / 1,387 requests' },
      { value: '15', label: 'Downstream services', context: 'one unified BFF gateway' },
    ],
    stack: [
      'Next.js 15 (App Router)',
      'React 19',
      'TypeScript 5',
      'Fastify',
      'TanStack Query',
      'React Hook Form + Zod',
      'OpenTelemetry',
      'OpenObserve',
      'Living Design',
      'Playwright',
      'WCNP / KITT / Concord / Akeyless',
    ],
    problem:
      'V2 was React 17 + Redux Toolkit + Apollo + a Koa BFF — slow dev loop, monolithic GraphQL resolvers, brittle module-definition form handling, and inconsistent UX with the rest of Walmart’s Living Design system. Adding a new downstream service required touching 15 duplicated resolver layers.',
    sections: [
      {
        heading: 'Why Fastify wrapping Next.js (not stock next start)',
        paragraphs: [
          'Walmart’s existing Saber/Electrode operational tooling (CCM2, electrode-tracing, electrode-ui-logger, electrode-prometheus, sso-pingfed) is Fastify-shaped. @walmart/wml-server-fastify wraps Next.js as a custom Node server, preserving the entire ops surface while getting App Router + React Server Components on top.',
        ],
      },
      {
        heading: 'One BFF gateway for 15 services',
        paragraphs: [
          'A unified /api/proxy Fastify route fans out to Tempo Service, Tempo Runtime, Pronto, Tango, IronBank, Legato, Asset Service, P13N, RMA, Normalize, SEO/Tejas, DAL, Portal, Translation, and CCM — collapsing 15 duplicated GraphQL resolver layers from V2.',
          'Adding a new downstream service is a ~50-line typed-client template against the same proxy contract. The proxy enforces SSRF (URL allowlist), normalizes headers, and adds defensive content-type parsing for downstreams that return unflagged JSON.',
        ],
      },
      {
        heading: 'W3C trace propagation — first end-to-end tracing in Tempo’s history',
        paragraphs: [
          'Wrote a traceparent validator + forwarder for every outbound fetch(), mirroring the trace id onto a legacy X-Trace-ID header for backward compatibility with the Java backend’s interceptor. Validated >92% propagation success rate in stage (1,284 of 1,387 inbound requests over 2 hours) — unblocking end-to-end distributed tracing for the first time across the BFF ↔ Tempo Service ↔ Tempo Runtime chain.',
        ],
      },
      {
        heading: 'Three classes of production bugs eliminated',
        paragraphs: [
          'A body-based proxy contract (application/proxy-service-json) fixed HTTP 431 on ~42KB Prism module submissions that previously failed at the gateway header-size limit. Defensive content-type parsing handled P13N’s unflagged JSON responses. SSRF protection via URL-allowlist validation closed an outbound-call attack surface.',
        ],
      },
      {
        heading: 'Auth simplification: IAM + RMA → RMA-only',
        paragraphs: [
          'Replaced the two-system auth chain with RMA-only authorization through the Role Manager Auth Engine, enforcing access at tenant × pageType granularity. Cut outage modes from two to one and simplified the on-call triage playbook.',
        ],
      },
      {
        heading: 'Tenant-aware Edge middleware',
        paragraphs: [
          'Next.js Edge middleware handles /{tenant}/ URL rewrites across all 38 tenants, cookie synchronization, feature-flag-driven legacy fallback to V2, and open-redirect protection. Enables a safe, route-by-route migration ramp without a flag-day cutover.',
        ],
      },
    ],
    shipped: [
      'Migrated the authoring UI from Electrode V1 + GraphQL + React 16 to Next.js 15 + React 19 on a Fastify custom server — cut cold-start build time by ~60% and shrank the client bundle through Server Components and TanStack Query streaming Suspense.',
      'Designed and shipped a unified /api/proxy Fastify BFF gateway fanning out to 15 downstream Walmart services — collapsed 15 duplicated GraphQL resolver layers and reduced "add new downstream service" to a ~50-line typed-client template.',
      'Implemented W3C Trace Context propagation across the BFF — validated >92% propagation success rate (1,284 / 1,387 requests over 2 hours) in stage.',
      'Eliminated three classes of production header bugs via a body-based proxy contract, defensive content-type parsing, and SSRF protection.',
      'Replaced the IAM + RMA auth chain with RMA-only authorization at tenant × pageType granularity — cut outage modes from two systems to one.',
      'Built tenant-aware Next.js Edge middleware handling /{tenant}/ URL rewrites across 38 tenants, cookie sync, feature-flag-driven legacy fallback, and open-redirect protection.',
      'Stood up the observability spine — OpenObserve dashboards, Quantum Metrics RUM, Prometheus metrics, and a Playwright e2e suite hitting live stage — surfacing per-user traffic patterns (79 unique editors, 1,857 calls / 4 days) and identifying ~57% bot-driven volume.',
      'Deployed multi-region active-active across three production clusters (uswest, uscentral, useast4) under the KITT nextjs-electrode-v1 profile with Concord + LooperPro pipelines and Akeyless-managed signature secrets.',
    ],
    accent: TEMPO_ACCENT,
  },
  {
    slug: 'tempo-service',
    platform: 'tempo',
    platformLabel: 'Tempo · Backend',
    title: 'Tempo Service',
    tagline: 'The Java authoring backend behind Tempo — 38 tenants, Oracle → Postgres on GCP',
    role: 'Backend contributor',
    period: '2023 – present',
    status: 'In production',
    customerFacing: false,
    summary:
      'The system of record for module instances, published versions, draft/staging state, schedules, triggers, targeting payloads, layouts, page-type metadata, SEO overrides, and audit history across 38 production tenants. Rated business-critical in Service Registry.',
    metrics: [
      { value: '~27 TPS', label: 'Authoring traffic', context: 'p95 ≈ 2.5s (bulk tail to 15s)' },
      { value: '38', label: 'Tenants', context: 'WM_GLASS, CA_GLASS, SAMS, ASDA, Mexico…' },
      { value: '~65', label: 'Seed PRs / month', context: 'inbound from many teams' },
      { value: '~$767 / day', label: 'Cloud spend', context: 'compute + DB + Kafka' },
    ],
    stack: [
      'Java 17',
      'Spring Boot 3.5',
      'Apache CXF (JAX-RS)',
      'Hibernate 6 + QueryDSL 5',
      'Oracle (legacy) + PostgreSQL (modernized)',
      'Meghacache (Memcached)',
      'Kafka',
      'Strati AF + Pallet',
      'WCNP / GKE',
      'Istio mTLS',
    ],
    problem:
      'Tempo Service is the spinal cord of authoring — a multi-minute outage stalls every Walmart publish across 38 tenants. The legacy Oracle environment had to be migrated to GCP Postgres in flight, without an authoring-side flag-day, while continuing to absorb ~65 Seed-monorepo PRs per month from teams the Tempo team doesn’t gate.',
    sections: [
      {
        heading: 'Module lifecycle as a state machine in SQL',
        paragraphs: [
          'A module instance flows draft_module → module_version (+ version_trigger, targeting) → published, with published_token augmenting the read-side for high-volume runtime serves. One published row per DRAFT_MODULE_PK indicates the row that’s live on the site, so the runtime’s join is bounded.',
          'Triggers (URLs, page IDs, search terms, shelves, categories) and zone restrictions are enforced server-side at publish time, not in the UI — so a misbehaving client can’t produce a publish state the runtime can’t serve.',
        ],
      },
      {
        heading: 'Self-healing the runtime cache',
        paragraphs: [
          'A runtime-validator cron runs every 2 minutes, reconciling published modules in the authoring DB against the runtime Meghacache and republishing any drift. Editorial changes propagate in seconds; cache drift heals itself in tens of seconds.',
        ],
      },
      {
        heading: 'Cache-aside on the hot path',
        paragraphs: [
          'PublishedToken reads are served cache-aside via Walmart Pallet’s CacheService over Meghacache. Misses hit Postgres, hydrate the cache, and emit a Kafka event so downstream caches can warm in lockstep.',
        ],
      },
      {
        heading: 'Kafka as the spine to downstream consumers',
        paragraphs: [
          'Every state change emits to KAFKA-V2-TEMPO-MOD-PROD, consumed by the Content Sync Service (which writes Cassandra for Tempo Runtime), Tango, the GraphQL CLS/OL layer, analytics, and re-indexing. The producer surface is centralized through KafkaProducerManager + SimpleKafkaProducer so producer config drift is impossible.',
        ],
      },
      {
        heading: 'Why CXF (not Spring MVC)',
        paragraphs: [
          'Apache CXF lets the same Java service expose a JAX-RS surface under /services/* while keeping Spring Boot 3 underneath. Mature interceptors plug in for tenant header propagation, structured error envelopes, and W3C trace forwarding to downstreams — a more surgical fit for Walmart’s existing interceptor conventions than Spring MVC filters.',
        ],
      },
    ],
    shipped: [
      'Contributed to module versioning, publish, and rollback flows across draft_module, module_version, version_trigger, targeting, and published.',
      'Hardened tenant header propagation and W3C trace forwarding through CXF interceptors so the V3 UI → Tempo Service → Tempo Runtime chain is fully traceable end-to-end.',
      'Tuned cache-aside semantics on the PublishedToken hot path — cache hit ratios and Kafka invalidation events are now load-bearing for runtime cache warmth.',
      'Participated in the Oracle → GCP Postgres modernization (the *-post environments), validating Hibernate dialects and query plans against the new dialect.',
      'Multi-region prod deployment across useast4 / uscentral / EDC with Istio mTLS sidecars and Akeyless-managed secrets through the KITT pipeline.',
    ],
    accent: TEMPO_ACCENT,
  },
  {
    slug: 'tempo-runtime',
    platform: 'tempo',
    platformLabel: 'Tempo · Runtime',
    title: 'Tempo Runtime — Node → Go, Cosmos → Cassandra',
    tagline: 'Customer hot path — sub-50ms p95, 100K reads/sec/region',
    role: 'Contributor on Go rewrite + migration',
    period: '2025 – present',
    status: 'Active rollout',
    customerFacing: true,
    summary:
      'The customer-facing read service of the Tempo CMS ecosystem. Given tenant + channel + pageType (+ pageId + zone + targeting + Expo variant), returns the prioritized list of modules that render for that customer in that moment. Mid-rewrite from Node + Cosmos to Go + Cassandra.',
    metrics: [
      { value: '35–45 ms', label: 'p95 latency (Go)', context: 'vs Node 45–50 ms' },
      { value: '100K', label: 'Reads/sec/region', context: 'Cassandra sizing target' },
      { value: '82%', label: 'Memory ↓', context: 'Go ~180 MB vs Node ~1 GB' },
      { value: '18×', label: 'Cold start ↓', context: '~10s vs ~180s' },
      { value: '20%', label: 'Throughput ↑', context: '~55 TPS/core vs Node 45' },
      { value: '80%', label: 'Image size ↓', context: 'Go ~100 MB vs Node ~500 MB' },
    ],
    stack: [
      'Go 1.24',
      'Echo',
      'Apache Cassandra',
      'Ristretto (L1)',
      'Meghacache (L2)',
      'Kafka (Content Sync)',
      'OpenTelemetry',
      'Istio',
      'WCNP / KITT (tenant-group sharded)',
      'Echonyx edge',
    ],
    problem:
      'Node + Cosmos was costly, slow to cold-start (3 minutes), and the ingestion pipeline was a periodic full-DB scan that took 3–5 minutes to propagate a publish. A complete runtime outage blanks the homepage — so the rewrite had to be canary-driven, dual-write, shadow-compared, and gradually ramped by tenant group, never flag-day.',
    sections: [
      {
        heading: 'Three-tier cache topology',
        paragraphs: [
          'Ristretto L1 (in-process LFU, microseconds) catches the long tail of homepage hot keys without crossing the network. Meghacache L2 (18 nodes across 3 DCs, single-digit ms) catches everything else. Cassandra origin (single-digit-to-low-tens of ms, LOCAL_ONE consistency) is only touched on TTL expiry or genuine cache miss.',
          'The Meghacache cluster is shared with the legacy Node runtime during cutover, with a version-namespaced key schema so the two services can’t poison each other’s reads.',
        ],
      },
      {
        heading: 'Cassandra schema designed for one-shot reads',
        paragraphs: [
          'Cosmos was a per-container JSON document store. Cassandra is wide-column with explicit partition and clustering keys. The new schema partitions by (tenant, channel, pageType) and clusters by module version, so a single read returns the whole page payload without scatter-gather across nodes.',
        ],
      },
      {
        heading: 'Kafka-driven sync replaces periodic full scans',
        paragraphs: [
          'Tempo Service emits to KAFKA-V2-TEMPO-MOD-PROD on every commit. The Content Sync Service consumes that stream and writes Cassandra (Go runtime) or Cosmos (legacy Node runtime). Propagation budget went from 3–5 minutes (full DB scan) to seconds.',
        ],
      },
      {
        heading: 'Tenant-group sharding for bounded blast radius',
        paragraphs: [
          'The Go deployment is split into three tenant groups via separate KITT files — TG1 (WM_GLASS), TG2 (CA + MX), TG3 (SAMs + long-tail). A bad rollout is bounded by tenant group rather than affecting all 38 tenants simultaneously.',
        ],
      },
      {
        heading: 'Shadow-compare migration',
        paragraphs: [
          'The Node service POSTs every request + response to the Go canary asynchronously, behind a CCM feature flag (isCallToGoLangEnabled, CallGoLangByQueryParam, CallGolangCompareTimeOut). A daily checksum + record-count diff job compares Cosmos vs Cassandra with an alert threshold of > 0.1% drift. Canary started at uswest-stage-az-301; tenant-group cutover is in progress.',
        ],
      },
      {
        heading: 'Defense in depth at the edge',
        paragraphs: [
          'Echonyx OPUS sits at the edge with auth: resign and explicitly allow-lists only GET /api/v[12]/tempo/layouts — the rest of the runtime surface is denied at edge. Istio sidecars enforce mTLS for all internal traffic. The selection algorithm (tenant filter → channel filter → page resolution → zone filter → targeting evaluation → Expo overlay) runs inside that hardened perimeter.',
        ],
      },
    ],
    shipped: [
      'Contributed to the Go + Echo rewrite of the customer-facing runtime, including the three-tier cache (Ristretto L1 → Meghacache L2 → Cassandra) and the selection algorithm port.',
      'Helped design the Cassandra schema partitioning by (tenant, channel, pageType) so a single read returns the whole page payload without scatter-gather.',
      'Validated the Kafka-driven Content Sync ingestion against the legacy periodic full-DB scan with daily checksum + record-count diffs at > 0.1% drift threshold.',
      'Implemented the shadow-compare wiring inside the Node service — every request + response asynchronously POSTed to the Go canary behind a CCM feature flag for safe canary ramping.',
      'Tenant-group sharded deployment (TG1 / TG2 / TG3) so a bad rollout is bounded by tenant group, not by the whole fleet.',
    ],
    accent: TEMPO_RUNTIME_ACCENT,
  },
  {
    slug: 'tempo-v2-ui',
    platform: 'tempo',
    platformLabel: 'Tempo · Legacy UI',
    title: 'Tempo V2 UI (cxt-tempo)',
    tagline: 'The legacy editor that runs in parallel with V3 during rollout',
    role: 'Frontend engineer',
    period: '2020 – 2024',
    status: 'Sunset',
    customerFacing: false,
    summary:
      'The previous-generation merchant-facing CMS used by hundreds of site merchants across 38 tenants for years. Still serves production traffic for tenants/features not yet migrated to V3.',
    metrics: [
      { value: '38', label: 'Tenants supported', context: 'parallel with V3 rollout' },
      { value: '25+', label: 'GraphQL provider schemas', context: 'stitched in Saber BFF' },
      { value: 'Module', label: 'Version diff', context: 'side-by-side history' },
    ],
    stack: [
      'React 17',
      'TypeScript',
      'Redux Toolkit',
      'Redux Persist',
      'Apollo GraphQL',
      'Koa (Saber)',
      'Mongoose',
      'Emotion / Saber UI',
      'Formik + Yup',
      'AJV (JSON Schema)',
      'Jest + RTL',
      'Nx monorepo',
    ],
    problem:
      'Months-old branches, slow dev loop, monolithic GraphQL resolvers, brittle module-definition forms, and a UX that drifted from Walmart’s Living Design system. Editors needed an audit trail and version history they could actually act on.',
    sections: [
      {
        heading: 'Versioning + diff visualization',
        paragraphs: [
          'Integrated a custom JSON-diff renderer into the module editor so merchants can compare any two published versions side-by-side and recover from accidental changes in seconds. Previously, version recovery meant filing a ticket against the Tempo team.',
        ],
      },
      {
        heading: 'End-to-end RBAC',
        paragraphs: [
          'Implemented role-based access controls across the full stack (React → GraphQL resolvers → backend ACL) so merchants only see modules for the tenants and page-types they own — the same tenant × pageType grain that RMA enforces in V3.',
        ],
      },
      {
        heading: 'Dynamic module-definition forms',
        paragraphs: [
          '@cxt-tempo/seed-to-schema converts Seed JSON module definitions into JSON Schema, then renders dynamic forms via @walmart/json-schema-form — field transformers, conditional logic, validation rules, locale handling, PRISM module support, all driven from the same Seed source of truth that backs Tempo Service.',
        ],
      },
    ],
    shipped: [
      'Shipped versioning + side-by-side diff visualization for module history — cut version-recovery time from "file a ticket" to "compare two versions in the UI."',
      'Implemented role-based access controls end-to-end (React → GraphQL resolvers → backend ACL) at tenant × pageType granularity.',
      'Built reusable React + TypeScript components (history tables, content modals, dynamic module editors) on Walmart’s internal @saberjs/ui library.',
      'Raised Jest + React Testing Library coverage on the critical-path editor flows.',
    ],
    accent: TEMPO_ACCENT,
  },
]

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((c) => c.slug === slug)
}

export function getCaseStudiesByPlatform(platform: PlatformId): CaseStudy[] {
  return caseStudies.filter((c) => c.platform === platform)
}

export function getAdjacentCaseStudies(slug: string): {
  prev: CaseStudy | undefined
  next: CaseStudy | undefined
} {
  const idx = caseStudies.findIndex((c) => c.slug === slug)
  return {
    prev: idx > 0 ? caseStudies[idx - 1] : undefined,
    next: idx >= 0 && idx < caseStudies.length - 1 ? caseStudies[idx + 1] : undefined,
  }
}

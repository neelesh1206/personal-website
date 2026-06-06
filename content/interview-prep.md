# Interview Prep — Full-Stack SWE

> Owner: Neelesh Kakaraparthi
> Target role: Full-Stack Software Engineer
> Anchor projects: PRISM `cxt-msg-asset-service` (Java backend) · Tempo V3 UI + Fastify BFF (Next.js frontend) · Tempo Service (Java) · Tempo Runtime (Node→Go migration)

---

## Delivery rules (read first, every time)

You ramble when your mind wanders. Fix it with structure, not effort.

1. **Pause 2 seconds before you answer.** Out loud: _"Good question — let me think."_ That's not weakness, it's how senior engineers signal they're going to give a real answer instead of a panic-stream.
2. **Lead with one headline sentence.** Always start with the punchline. The interviewer should know your direction in 5 seconds.
3. **Use a structure every single time.** Pick one and stick to it: **Problem → Approach → Tradeoff** or **What → Why → How I used it**. Never freestyle.
4. **End deliberately and stop.** When you're done, say _"That's how I'd approach it"_ and stop. Silence isn't your enemy. Filler words are.
5. **Practice out loud, recorded.** Reading silently teaches you nothing about pacing. Phone voice-memo every answer in this doc; play it back; cut filler.
6. **Talk in numbers and names.** _"~27 TPS, p95 2.5s"_ is concrete. _"It scales well"_ is invisible. Same for systems: _"Tempo Service"_ not _"the backend service"_. Specificity = credibility.
7. **When you don't know, say so cleanly.** _"I haven't done that directly — closest I've done is X. Here's how I'd ramp."_ Then stop. Don't fish for partial credit.

---

## Rapid-fire trivia — know these cold

You should be able to fire any of these in under 3 seconds with no thinking. These are your sentinels for credibility.

### Versions

| Tool                         | Version         | Where                       |
| ---------------------------- | --------------- | --------------------------- |
| Java                         | **21**          | PRISM (msg-asset-service)   |
| Java                         | **17**          | Tempo Service               |
| Spring Boot                  | **3.5.12**      | PRISM                       |
| Spring Boot                  | **3.5.6**       | Tempo Service               |
| Hibernate                    | **6.6.3**       | PRISM + Tempo               |
| QueryDSL                     | **5.0**         | PRISM + Tempo               |
| MapStruct                    | **1.5.3**       | PRISM                       |
| Apache CXF (JAX-RS)          | **4.0.4**       | Tempo Service               |
| Next.js                      | **15.5**        | Tempo V3 UI                 |
| React                        | **19.1**        | Tempo V3 UI                 |
| TypeScript                   | **5.8 strict**  | Tempo V3 UI                 |
| TanStack Query               | **5.76**        | Tempo V3 UI                 |
| React Hook Form              | **7.56**        | Tempo V3 UI                 |
| Zod                          | **4.1**         | Tempo V3 UI                 |
| Fastify (Walmart wml-server) | **5.0.11**      | Tempo V3 BFF                |
| Node                         | **20.13+**      | Tempo V3 + Runtime (legacy) |
| Go                           | **1.24** (Echo) | Tempo Runtime (rewrite)     |

### Headline numbers (PRISM)

- **150×** homepage scale (20 → 3,500+ landing pages)
- **+6.8%** mWeb ATF Content CTR (A/B vs legacy Athena)
- **+16%** editor efficiency on CP/HP page-build workflows
- **12,000+** messages live in prod, **24,000+** assets
- **~2 TPS**, **p95 ≈ 250ms**
- **~$11/day** combined cloud spend
- **4 datasources** behind one Strati layer

### Headline numbers (Tempo)

- **38 production tenants** (WM_GLASS, CA_GLASS, SAMS, ASDA, Mexico, B2B, …)
- **~27 TPS** Tempo Service authoring, **p95 ~2.5s** (bulk to 15s)
- **~$767/day** Tempo Service cloud spend
- **~65 PRs/month** into the Seed monorepo (across many teams)
- **15 downstream services** behind the V3 Fastify BFF
- **>92%** W3C trace propagation success in stage (**1,284 / 1,387** requests)
- **~60%** cold-start build-time reduction (Electrode V1 → Next 15)

### Headline numbers (Tempo Runtime Go rewrite)

- **35–45 ms** p95 latency @ **4K TPS** (vs Node 45–50 ms)
- **100,000** reads/sec/region (Cassandra sizing)
- **20%** throughput ↑ vs Node, **82%** memory ↓, **18×** cold-start ↓ (~10s vs 180s), **80%** image ↓
- **3 DCs × 3 nodes** Cassandra, `LOCAL_QUORUM` writes, `LOCAL_ONE` reads
- **3-tier cache**: Ristretto L1 (in-process, µs) → Meghacache L2 (18 nodes, single-digit ms) → Cassandra (low-tens ms)
- **TG1 / TG2 / TG3** tenant-group sharded deployment (WM_GLASS / CA+MX / SAMs+long-tail)

---

# 1. React & Frontend

> Anchor: **Tempo V3 UI** — Next.js 15 App Router on React 19, TanStack Query streaming Suspense, React Hook Form + Zod, Fastify BFF fanning out to 15 services.

### Q1.1 — What's actually new in React 19?

**Answer**: Three things that show up day-to-day. First, **React Server Components** as a real primitive — components that run on the server, ship zero JS, and stream their output. Second, **the new use() hook** and Suspense improvements that let you await async data inline. Third, **automatic batching everywhere** plus form-action support — `<form action={serverAction}>` works natively. The reconciler also gets better at prioritising urgent work (typing, scrolling) over deferred work (data fetches).

**How I used it**: Tempo V3's editor stays responsive while module data hydrates because TanStack Query streams via Suspense — React 19's concurrent scheduling keeps the input field interactive while the module list resolves in the background.

**Remember**: _"Server Components ship HTML, not JavaScript."_

### Q1.2 — `useState` vs `useReducer` — when do you pick which?

**Answer**: `useState` for **one piece of independent state**: a boolean, a string, a number. `useReducer` when you have **multiple state values that transition together** — like form state, or a fetch state machine (idle/loading/success/error). The deciding question is: do these values change as a group? If yes, reducer. If no, two `useState`s. Reducer also wins when next state depends on prior state and you want the transition logic centralised — easier to test.

**How I used it**: Tempo V3's module-editor wizard uses a reducer because step, validation errors, and draft payload all transition together — reading `useReducer` makes the state machine obvious.

**Remember**: _"State machine → reducer. Atom → useState."_

### Q1.3 — `useEffect` — what's it for and what's the trap?

**Answer**: It's for **synchronising your component with something outside React** — a subscription, a timer, a fetch. The trap is treating it like componentDidMount and dumping all logic into it. Two real rules: every effect should declare every reactive value it reads in the dependency array; and if you're using effects to _derive_ state from props, you're doing it wrong — derive it in render. React 19's compiler will eventually make most `useMemo`/`useCallback` unnecessary, but the effect rules still apply.

**How I used it**: In Tempo V3 I removed an effect that closed the mobile menu on pathname change — it's a side effect of the link click, not the URL change. Replaced with an `onClick` handler. Eliminated a class of lint errors and a confusing rerender.

**Remember**: _"Effects synchronise. They don't derive."_

### Q1.4 — `useMemo` and `useCallback` — when actually needed?

**Answer**: Mostly when you're handing a value or function down to a **memoised child** that's expensive to re-render — `React.memo` won't help if the prop reference changes every render. Also for genuinely expensive computations you don't want to repeat. The wrong reason: "to make it faster." `useMemo` itself has overhead. With React 19's compiler enabled, you write plain code and the compiler memoises what's worth memoising. So: reach for it deliberately, not reflexively.

**How I used it**: Tempo V3's targeting builder memoises the parsed-rule tree it passes to a deeply nested `<RuleEditor>` because the child is `React.memo`'d and re-parses the rule string on every change otherwise.

**Remember**: _"Memo for memoised children, or genuinely slow work."_

### Q1.5 — Server Components vs Client Components — when does each go?

**Answer**: **Server Components** are the default in Next 15 App Router — they run on the server, can hit a database directly, never ship their code to the browser. **Client Components** (`'use client'`) hydrate in the browser; you need them for state, effects, event handlers, browser APIs. The pattern is: keep the tree mostly Server Components, push `'use client'` as deep as possible so you ship the least JS. Server Components stream HTML; Client Components run interactivity.

**How I used it**: Tempo V3's catalog page is a Server Component that fetches from Tempo Service directly. The drag-and-drop reorder is a small `'use client'` island. We ship ~50KB less to the browser than V2.

**Remember**: _"Server by default. Client at the leaves where you need state."_

### Q1.6 — Virtual DOM — what is it and why does it matter?

**Answer**: React keeps an in-memory tree of UI elements. When state changes, it builds a new tree, diffs it against the previous one, and produces the **minimum set of DOM operations** to bring the real DOM in line. The browser DOM is slow to mutate; a JS object tree is fast. So doing the diff in memory and surgically patching the DOM is cheaper than re-rendering from scratch. React 19's concurrent reconciler also batches updates and prioritises urgent ones.

**How I used it**: In V2 we hit a perf bug where a 200-row module table re-rendered on every keystroke. The fix was correct keys + `React.memo` — the virtual DOM diff was correct, we were just letting React think every row was new.

**Remember**: _"Two trees, one diff, minimal patch."_

### Q1.7 — Forms — why React Hook Form + Zod?

**Answer**: React Hook Form uses **uncontrolled inputs with refs** — most components don't re-render on every keystroke, only on submit/validation. Zod gives you a **schema as the source of truth**: TypeScript types come from the schema, runtime validation runs from the same schema, and you wire it in with `zodResolver`. So you get fewer re-renders, no separate types-vs-validation drift, and type-safe access to `data` after submit.

**How I used it**: Every form in Tempo V3 (module-definition editor, targeting builder, contact-like screens) uses RHF + Zod. The Zod schema is generated from the Seed JSON schema by `@cxt-tempo/seed-to-schema` — so the form, the validator, and the backend contract are the same shape.

**Remember**: _"RHF for performance, Zod as the contract."_

### Q1.8 — Performance — how do you stop unnecessary re-renders?

**Answer**: Five moves, in order of impact. (1) **Lift state down** — keep state where it's used so siblings don't re-render. (2) **Stable keys** in lists — bad keys force React to remount. (3) **`React.memo` on heavy children**, paired with `useCallback`/`useMemo` for stable prop references. (4) **Split contexts** — one big context re-renders every consumer; split by concern. (5) **Profile with React DevTools' Profiler** before guessing — usually one component is causing 90% of the re-renders.

**How I used it**: On Tempo V2 I cut module-table re-renders by ~80% by splitting the editor context (selection vs draft state) and keying rows on stable ID instead of array index.

**Remember**: _"Profile first. Split context, stable keys, memo heavy."_

### Q1.9 — The BFF pattern — what is it, and why is it the right call?

**Answer**: BFF = **Backend For Frontend**. A thin server in front of your UI that aggregates downstream services into the exact shape your UI needs. Instead of the browser calling 15 services with 15 different shapes/auths, it calls **one** BFF, which fans out and stitches. Wins: one auth boundary, one place to do trace propagation, one place to do SSRF protection, one place to shape data for the screen. Tradeoff: extra hop, and the BFF can become a god service if you let it. Mitigation: keep it a thin pass-through with typed clients, not business logic.

**How I used it**: Tempo V3 BFF is **one Fastify `/api/proxy` route** fanning out to 15 services (Tempo Service, Pronto, Tango, IronBank, Legato, RMA, P13N, …). Adding a new service is ~50 lines from a typed-client template. W3C trace IDs forward through every outbound call.

**Remember**: _"One inbound surface, fan-out behind it."_

### Q1.10 — Next.js App Router vs Pages Router — which and why?

**Answer**: **App Router**. Three reasons. (1) Server Components — smaller JS bundles, faster TTFB, direct data access on the server. (2) Streaming with Suspense — render incrementally, don't block on the slowest fetch. (3) Layouts as a first-class concept — shared UI doesn't unmount on navigation. Pages Router still ships and works fine; new builds default to App Router. Tradeoff: caching is more nuanced (`revalidate`, `force-dynamic`, route segment config) — you have to understand the layers.

**How I used it**: Tempo V3 is App Router. Layouts give us a stable editor shell across all tenant routes; Server Components let the catalog page stream while the BFF is still resolving. We measured ~60% cold-start build time reduction vs the Electrode V1 setup.

**Remember**: _"App Router = Server-first + streaming + persistent layouts."_

### Q1.11 — Frontend testing — what do you actually test?

**Answer**: Three layers. (1) **Component unit tests** with Vitest + Testing Library — assert behaviour from the user's perspective ("typing in the field, clicking Submit, the right copy appears"). Don't test implementation. (2) **Integration tests** with MSW mocking the BFF — tests one screen's data flow end-to-end without a real server. (3) **E2E** with Playwright against live stage — tiny number of tests, only the critical user journeys (login, save a module, publish). The pyramid: lots of unit, fewer integration, very few E2E.

**How I used it**: Tempo V3 has Vitest unit suites on components, MSW for the BFF integration tests, and Playwright hitting live stage for the publish flow. CI fails the build if Vitest coverage drops below 70%.

**Remember**: _"Test behaviour, not implementation. Pyramid: lots / fewer / very few."_

---

# 2. Spring Boot & Core Java

> Anchor: **PRISM `cxt-msg-asset-service`** — Java 21, Spring Boot 3.5.12, Hibernate JPA, QueryDSL 5, MapStruct, list-partitioned Postgres, Forklift outbox, 4 datasources.

### Q2.1 — What is dependency injection and why do we use it?

**Answer**: DI is **the container creates your dependencies and hands them to you** instead of you constructing them inside your class. The point isn't "fewer `new` keywords" — it's that your class declares what it needs, and at test time you swap real dependencies for fakes without touching production code. Spring's DI is constructor-based by default; you mark a class `@Service` (or `@Component`/`@Repository`), declare its constructor, and Spring wires the graph at startup.

**How I used it**: Every PRISM service follows constructor injection — `MessageService` takes `MessageDAO`, `AssetDAO`, `KafkaProducerManager`. In unit tests we hand-construct the service with mock DAOs; no Spring context needed.

**Remember**: _"Declare what you need. Container hands it to you. Tests swap it."_

### Q2.2 — Spring Bean scopes — which do you actually use?

**Answer**: **Singleton** is the default and covers ~95% — one instance per Spring context, shared, stateless. **Prototype** gives you a fresh instance every injection, used for stateful builders. **Request** and **session** are web scopes — a new bean per HTTP request or session. Request scope is where you carry per-request state like the authenticated tenant ID or trace context. Most services should be singletons; reach for request scope when you have a value that's "true for this request only."

**How I used it**: PRISM's `WcpHeaders` bean is request-scoped — it carries `tenantId` for the lifetime of the request, and `GenericBaseDAO.getDefaultPredicates()` reads it to inject the tenant filter on every JPA query.

**Remember**: _"Singleton everywhere. Request scope for per-request state."_

### Q2.3 — Centralised exception handling with `@RestControllerAdvice` — how do you wire it?

**Answer**: One class annotated `@RestControllerAdvice` catches exceptions thrown anywhere in a controller and translates them to HTTP responses. Each handler method is `@ExceptionHandler(SomeException.class)` and returns a `ResponseEntity` with the right status + a uniform error envelope `{code, message, traceId}`. The point: **business logic throws domain exceptions; the advice translates them**. Controllers stay clean. Same exception → same HTTP code → same envelope shape, every endpoint.

**How I used it**: PRISM's advice maps `OptimisticLockingException` → 409, `EntityNotFoundException` → 404, `ValidationException` → 422, anything else → 500 with the trace ID echoed back. The log line masks `Authorization` and `Cookie` headers before writing.

**Remember**: _"Throw domain. Advice translates to HTTP."_

### Q2.4 — Mapping domain errors to HTTP codes — what's the table?

**Answer**: **400** — the client sent a malformed request (bad JSON, missing required field). **401** — no auth or bad auth. **403** — authed but not authorised for this resource. **404** — the entity genuinely doesn't exist. **409** — conflict; usually optimistic-lock collision or unique-constraint violation. **422** — request is well-formed but business validation fails (invalid state transition). **429** — rate limited. **5xx** — your fault; usually 500 generic, 503 when a downstream is down. The rule: 4xx is the client; 5xx is you.

**How I used it**: PRISM's bulk-edit endpoint surfaces deeply-nested Postgres lock errors (Strati `LockException` → `FoundException` → `PSQLException`) as a clean 409 with `{conflictedAssetIds: [...]}` — the UI can highlight the rows instead of showing a 500 stack.

**Remember**: _"4xx your fault if you sent it. 5xx my fault if it broke."_

### Q2.5 — Optimistic locking with `@Version` — explain it.

**Answer**: You add a `@Version` column (usually `lock_version BIGINT`). On every read Hibernate captures the version; on UPDATE it writes `WHERE id = ? AND lock_version = ?` and increments. If two writers read v3, the first commits v4, the second's WHERE clause matches zero rows → Hibernate throws `OptimisticLockingFailureException`. **No table-level lock taken**, no deadlock risk — at the cost of one rare retry. Pessimistic locking (`SELECT FOR UPDATE`) blocks readers; optimistic assumes conflict is rare.

**How I used it**: PRISM's `BaseDO` superclass has `@Version` on `DB_LOCK_VERSION`. Bulk edits on the same asset surface as a 409 with the asset ID — the UI prompts "edited by someone else, reload?" instead of overwriting silently.

**Remember**: _"Stamp on read, check on write, retry on miss."_

### Q2.6 — REST vs GraphQL — when do you pick which?

**Answer**: **REST** when each consumer wants a clear, cacheable resource and the response shapes are stable — e.g. an authoring backend with a UI plus three downstream services that all want different fields, but those fields don't change often. **GraphQL** when you have many consumers with different shape needs and you want one endpoint that lets each ask for exactly what they need — cuts overfetching. Tradeoffs: GraphQL is harder to cache at the HTTP layer; REST forces a versioning conversation when shapes change.

**How I used it**: Tempo V2 was GraphQL; we moved Tempo V3's BFF to REST/JSON because the consumer is just our Next.js front-end and one cache layer. The BFF talks REST to 15 downstream services with a typed-client template, simpler to reason about than 15 GraphQL resolvers.

**Remember**: _"REST = stable shapes. GraphQL = many shapes from many consumers."_

### Q2.7 — JPA / Hibernate / QueryDSL / MapStruct — what does each do?

**Answer**: **JPA** is the spec; **Hibernate** is the implementation that turns entity classes into SQL. **QueryDSL** is a type-safe query builder — instead of writing JPQL strings, you write `query.from(QAsset.asset).where(asset.status.eq("ACTIVE"))`; compile-time checked, refactors safely. **MapStruct** generates code at compile time that maps your entities ↔ DTOs — no reflection at runtime. Together: Hibernate handles persistence, QueryDSL handles dynamic queries, MapStruct handles boundary mapping.

**How I used it**: PRISM uses all four. `Asset` and `Message` are JPA entities, partitioned tables and composite PKs declared via Hibernate. Search queries with optional filters are built with QueryDSL. DTOs at the REST boundary are generated by MapStruct so we never `.set...()` 30 fields by hand.

**Remember**: _"Hibernate persists. QueryDSL queries. MapStruct maps boundaries."_

### Q2.8 — Java 17 → 21 — what's worth knowing?

**Answer**: **Records** (immutable data carriers, `record User(String id, String name) {}` replaces ~30 lines of class). **Sealed classes** lock the type hierarchy at compile time — useful for state-machine modelling. **Pattern matching for switch** lets you switch on type with deconstruction. **Virtual threads (21)** are the headline — green threads scheduled by the JVM, not the OS, so blocking I/O is no longer expensive; you can write straight-line blocking code at scale. Tomcat/Spring Boot picks them up if you enable `spring.threads.virtual.enabled`.

**How I used it**: PRISM is Java 21; DTOs are records, our `MessageState` hierarchy is a sealed type. We haven't flipped virtual threads on in PRISM yet — workload is low enough not to need them — but I've measured them on a side project.

**Remember**: _"Records = data. Sealed = closed hierarchies. Virtual = cheap blocking I/O."_

### Q2.9 — Spring Boot startup — what actually happens?

**Answer**: Spring scans your packages for `@Component`/`@Service`/`@Repository`/`@Configuration` classes, builds a dependency graph, instantiates singletons in dependency order. `@ConfigurationProperties` binds your `application.yml` into typed config objects. Auto-configuration looks at the classpath (e.g. "Hibernate is here") and wires sensible defaults. The web server (Tomcat, Netty, or Undertow) starts, the JPA EntityManagerFactory initialises, and any `CommandLineRunner` / `ApplicationRunner` beans run. Total cold start for PRISM is ~25s.

**How I used it**: PRISM's startup runs a Liquibase migration check before the EntityManagerFactory is exposed — if a migration hasn't been applied to this branch, the service refuses to start. Catches "Vercel pointed at a fresh Neon branch" within seconds.

**Remember**: _"Scan → graph → instantiate → bind config → start web → run runners."_

---

# 3. Microservices & Architecture

> Anchor: **PRISM Forklift outbox** + **Tempo authoring/delivery split** + **BFF for 15 services**.

### Q3.1 — What is the dual-write problem?

**Answer**: When your service must update a database AND publish a Kafka event in the same logical operation. The problem: there's no distributed transaction across Postgres and Kafka in practice. Either order fails: write DB first, crash before Kafka → downstream consumers never hear. Write Kafka first, DB rollback → downstream sees an event for a state that doesn't exist. You need a way to make the DB write and the event emission **atomic from the consumer's point of view**.

**How I used it**: PRISM's `MessageService` had to write to Postgres and emit to Kafka for every save. We used the transactional outbox pattern (next question) to make this atomic — downstream services (Pronto, IronBank, P13N) never see an inconsistent state.

**Remember**: _"Two systems, one logical write, no distributed transaction → broken."_

### Q3.2 — Transactional outbox pattern — how does it actually work?

**Answer**: Instead of writing to Kafka directly, your service writes the event row into an **outbox table** inside the same DB transaction as the entity mutation. Both succeed atomically, or both rollback. A separate **drainer process** (or a CDC reader on the outbox table) reads outbox rows after commit and publishes them to Kafka, marking them sent. If the drainer crashes mid-publish, it just retries on restart — at-least-once delivery. Consumers must be idempotent because retries can produce duplicates.

**How I used it**: PRISM uses Walmart's Forklift library for exactly this. Every `Message` or `Asset` mutation writes an outbox row in the same transaction; Forklift's drainer publishes to Kafka. Pronto, IronBank, asset-discovery, and P13N never see a dual-write inconsistency.

**Remember**: _"Write the event into the DB. Drain to Kafka after commit."_

### Q3.3 — Idempotency and exactly-once — what's actually achievable?

**Answer**: Kafka delivery is **at-least-once** at the protocol level — true exactly-once is operationally expensive. The practical recipe: producer writes events with a deterministic **event ID**; consumer keeps a small table of processed event IDs (or uses a unique constraint on the side effect). If the same event arrives twice, the consumer's DB write fails the unique check and is treated as success. Net effect: **at-least-once + idempotent consumer = effectively exactly-once**.

**How I used it**: PRISM's downstream consumers (e.g. asset-discovery) treat the outbox event's UUID as a unique constraint. We never deduped at the broker; we deduped at write time.

**Remember**: _"Exactly-once doesn't exist. At-least-once + idempotent does."_

### Q3.4 — Authoring vs delivery — why are they split?

**Answer**: Editorial traffic is bursty, write-heavy, often slow (bulk publish at p95 2.5s, spikes to 15s), and tolerates multi-second propagation. Customer traffic is steady-state, read-heavy, must be sub-50ms at p95, and an outage blanks the homepage. **Mixing them forces both sides to optimise for the harder side.** Splitting lets each side pick the right DB, cache, framework, and SLO. An authoring outage stalls publishes; a delivery outage takes down the homepage — two very different incidents, two different on-call playbooks.

**How I used it**: Tempo is the textbook split. **Tempo Service** writes to Postgres (authoring), **Tempo Runtime** reads from Cassandra (delivery), Kafka syncs between them. A 5-minute Tempo Service outage in April 2026 didn't blank a single customer page.

**Remember**: _"Write-path and read-path are different products."_

### Q3.5 — Event-driven sync over Kafka — what does it replace?

**Answer**: The naive approach: the read side periodically polls the write side's DB ("scan all updated rows since timestamp X"). It works but lags by the poll interval, hammers the write DB, and gets weird around schema drift. **Kafka push** flips it: every write commits an event; the read side consumes the topic and updates its store. Lag drops from minutes to seconds; the write DB isn't being scanned; the contract is the event schema, not the table shape.

**How I used it**: Tempo's original sync was a periodic full DB scan from Tempo Service Postgres → Cosmos DB, 3–5 minutes of lag. The Kafka rewrite (Content Sync Service consuming `KAFKA-V2-TEMPO-MOD-PROD`) brought it to seconds and let the read side switch DBs to Cassandra cleanly.

**Remember**: _"Scan = polling. Kafka = push. Push wins for freshness and load."_

### Q3.6 — Multi-tenancy across 38 storefronts — what does it actually mean?

**Answer**: One service, many tenants, **hard data isolation**. Three layers. (1) **API**: every request carries a `tenant-id` header; auth checks the user has access to that tenant. (2) **Data**: every table has a `tenant_id` column; every query has a `WHERE tenant_id = ?` predicate. (3) **Operational**: deploy in tenant groups so a bad rollout doesn't blast every tenant at once. The trap is forgetting the predicate in a new DAO — solve it by injecting the predicate at the framework level so individual queries can't opt out.

**How I used it**: PRISM's `GenericBaseDAO.getDefaultPredicates()` reads tenantId from a request-scoped `WcpHeaders` bean and injects the predicate on every JPA query. 25+ repositories get isolation for free; opt-out has to be explicit.

**Remember**: _"Inject the tenant predicate at the framework, not at the DAO."_

### Q3.7 — Bounding blast radius — tenant-group canary + feature flags.

**Answer**: Two complementary tools. **Tenant-group canary**: split your deployment into groups (e.g. TG1 = WM_GLASS only, TG2 = CA+MX, TG3 = SAMs+long-tail). Roll the new build to TG1 first; if it's healthy for an hour, roll TG2; then TG3. A bad change blasts one group, not 38 tenants. **Feature flags**: ship the new code dark, flip it on per tenant via CCM. Both are cheap, both let you roll back without a redeploy.

**How I used it**: Tempo Runtime Go rewrite was deployed via three KITT files (`kitt-wcp-tg1.yml`, etc.). Tempo V3 UI's V2 fallback is feature-flag-driven through CCM — flip a flag and a tenant snaps back to V2 without a deploy.

**Remember**: _"Group your canary by tenant. Flip your changes by flag."_

### Q3.8 — Circuit breaker / bulkhead — when and why?

**Answer**: **Circuit breaker** wraps a remote call. If it's been failing for N seconds, "open the circuit" and start returning a fallback immediately instead of waiting for timeouts. After a cool-down, try one request; if it succeeds, close the circuit. Prevents cascading failure — one slow downstream doesn't tie up all your threads. **Bulkhead** isolates resources per dependency — a pool of N threads for service A, separate from B — so a flood to A can't starve B.

**How I used it**: Tempo V3 BFF wraps each downstream service in a Resilience4j circuit breaker with a per-service thread pool. When P13N had a 30-second hang in March, the editor stayed responsive — only the personalisation tab degraded.

**Remember**: _"Circuit breaker stops the bleeding. Bulkhead stops the spread."_

### Q3.9 — Service discovery — how do you find your dependencies?

**Answer**: Two patterns. **Static config**: the URL of each downstream is in a config file (or CCM in our world), service-name keyed. Simple, works inside Kubernetes via DNS. **Dynamic registry**: services register themselves to a registry (Consul, Eureka) on startup; consumers query at call time. Dynamic is overkill at our scale — Kubernetes service DNS gives you 90% of the value (`tempo-service.cxt-tempo.svc.cluster.local`) with zero extra moving parts. Reach for dynamic only when topology actually changes minute-to-minute.

**How I used it**: PRISM and Tempo V3 use CCM2 for downstream URLs + GKE service DNS for in-cluster calls. No separate registry. Faster to debug.

**Remember**: _"K8s DNS first. Registry only if topology actually moves."_

---

# 4. SQL Fundamentals

> Anchor: Used daily on **PRISM Postgres** + **Tempo Service Postgres**. These are the SQL building blocks interviewers actually test, before you ever talk schema design.

### Q4.1 — JOIN types — INNER vs LEFT vs RIGHT vs FULL OUTER. What's the difference?

**Answer**: **INNER** returns only rows where the join key matches in both tables — non-matches drop out. **LEFT** keeps every row from the left table and fills nulls where the right has no match — use when "I want all parents whether they have children or not". **RIGHT** is the mirror, rarely used because you can just flip the FROM order. **FULL OUTER** keeps unmatched rows from both sides. Rule: if your result has nulls in columns that aren't supposed to be nullable, you've got the wrong join type.

**How I used it**: PRISM editor list page joins message → asset → asset_config. `message LEFT JOIN asset` because some messages don't yet have assets (they're being authored). `asset INNER JOIN asset_config` — every asset must have at least one locale config, so a missing one is a bug.

**Remember**: _"LEFT keeps parents without children. INNER drops them. FULL keeps both orphans."_

### Q4.2 — GROUP BY and HAVING — when is HAVING different from WHERE?

**Answer**: **WHERE filters rows before grouping. HAVING filters groups after grouping.** You can't put an aggregate (`COUNT`, `SUM`, `AVG`) in WHERE because the aggregate doesn't exist until after grouping — it has to go in HAVING. Rule: filter by row-level columns in WHERE, by aggregates in HAVING. Both is fine — WHERE narrows what gets grouped, HAVING narrows the resulting buckets.

**How I used it**: PRISM's tenant-activity dashboard: `SELECT tenant_id, COUNT(*) FROM assets WHERE updated_at > now() - interval '7 days' GROUP BY tenant_id HAVING COUNT(*) >= 10`. WHERE prunes to the last 7 days (cheap, uses the `updated_at` index); HAVING keeps only tenants with real activity.

**Remember**: _"WHERE filters rows. HAVING filters groups."_

### Q4.3 — Window functions — what are they and when do you reach for them?

**Answer**: A window function computes a value across a set of rows related to the current row, **without collapsing the rows like GROUP BY does**. You write `OVER (PARTITION BY x ORDER BY y)`. Common ones: `ROW_NUMBER()` gives a unique sequential number per partition; `RANK()` and `DENSE_RANK()` handle ties differently; `LAG`/`LEAD` reach into adjacent rows; running sums via `SUM() OVER`. The killer use case is **"most recent N per group"** — partition by group, ORDER BY date DESC, ROW_NUMBER() <= N.

**How I used it**: PRISM's editor view: "show me the latest 3 asset versions per message" is one window query — `ROW_NUMBER() OVER (PARTITION BY message_id ORDER BY created_at DESC) <= 3`. Without window functions you'd need a correlated subquery per message — orders of magnitude slower at 12k messages.

**Remember**: _"Window = compute across a set without collapsing rows. Top-N-per-group is the killer use case."_

### Q4.4 — CTE vs subquery — when do you pick which?

**Answer**: A **CTE** (`WITH foo AS (...)`) names a query result so you can reference it like a table. Wins: readability for multi-step queries, recursion (`WITH RECURSIVE`), and reusing the same intermediate result twice without writing the subquery twice. Subqueries are fine for one-off filters. The rule: if naming the intermediate result makes the query clearer, use a CTE; if it's just one expression in WHERE, inline a subquery. Modern Postgres inlines simple CTEs by default so the perf gap is closed.

**How I used it**: PRISM's bulk asset state transition: `WITH targets AS (SELECT id FROM asset WHERE status = 'ACTIVE' AND updated_at < ...) UPDATE asset SET status = 'ARCHIVED' WHERE id IN (SELECT id FROM targets)`. The CTE is also reused in the RETURNING clause for logging.

**Remember**: _"CTE = named intermediate. Subquery = inline filter."_

### Q4.5 — Transactions and isolation levels — what are READ COMMITTED, REPEATABLE READ, SERIALIZABLE actually doing?

**Answer**: All three guarantee your own transaction sees a consistent view; they differ on what other concurrent transactions can do to your view. **READ COMMITTED** (Postgres default): each statement sees the latest committed data — non-repeatable reads possible (run the same SELECT twice, get different rows). **REPEATABLE READ**: snapshot taken at first read; you see that snapshot for the whole transaction — but phantom reads can still happen with predicates. **SERIALIZABLE**: behaves as if transactions ran one at a time — Postgres detects conflicts and aborts losers with `serialization_failure`. Cost goes up the higher you climb.

**How I used it**: PRISM writes that need to read + check + write (e.g. publish a message + assert it's still in DRAFT) use SERIALIZABLE. Most reads stay on READ COMMITTED. The bulk drainer for the Forklift outbox table uses `SELECT FOR UPDATE SKIP LOCKED` — same isolation, finer-grained locking.

**Remember**: _"Read Committed = latest per statement. Repeatable Read = snapshot per txn. Serializable = as-if-serial, expensive."_

### Q4.6 — Reading EXPLAIN / EXPLAIN ANALYZE — what do you look for?

**Answer**: `EXPLAIN` shows the planner's chosen plan; `EXPLAIN ANALYZE` runs it and shows real timing + row counts. Three things to inspect: (1) the **access method** on each table — `Seq Scan` on a big table is usually wrong, `Index Scan` or `Index Only Scan` is what you want; (2) **row estimates vs actual** — if planner estimates 10 and gets 1M, your statistics are stale (`ANALYZE` the table); (3) **the costliest node** — Sort, Hash, or Nested Loop high up the plan tree is your bottleneck. Read the plan **bottom-up** — leaves execute first.

**How I used it**: PRISM's editor list query went from 800ms to 12ms when I noticed EXPLAIN was doing a Seq Scan on `asset` because the WHERE predicate referenced `asset_config.locale`. Added a covering composite index on `asset_config (asset_id, locale)`, plan switched to Index Scan.

**Remember**: _"Seq Scan bad on big tables. Estimate vs actual reveals stale stats. Read bottom-up."_

### Q4.7 — UNION vs UNION ALL — what's the difference and why does it matter?

**Answer**: **UNION** removes duplicates between the two result sets. **UNION ALL** doesn't. Removing duplicates costs a sort or hash — orders of magnitude more expensive than just concatenating. Rule: use **UNION ALL by default**; use UNION only when you actually need the dedup. If you know the sets are already disjoint (e.g. drafts table + published table), UNION ALL is correct AND cheaper.

**How I used it**: PRISM's editor "all my work" view unions drafts + published modules. UNION ALL because a draft and a published are different rows by definition — no dedup needed. Saved ~200ms on the page render.

**Remember**: _"UNION ALL by default. UNION only when you really need dedup."_

### Q4.8 — NULL semantics — what's the trap most people hit?

**Answer**: SQL has **three-valued logic**: TRUE, FALSE, UNKNOWN (NULL). Anything compared to NULL with `=` or `!=` returns NULL, not true/false — so `WHERE x = NULL` never matches anything. Use `IS NULL` / `IS NOT NULL`. The classic trap: `WHERE id NOT IN (SELECT id FROM filter_table)` returns **ZERO ROWS** if `filter_table` contains a NULL — because `id NOT IN (1, 2, NULL)` resolves to NULL, which fails the WHERE. Fix with `NOT EXISTS` or filtering NULL out of the subquery.

**How I used it**: Hit this exact `NOT IN` trap on PRISM's "show me messages without an audience override" query — the override table had one row with a NULL message_id, and my query returned an empty list for two days before I noticed. Switched to `NOT EXISTS`.

**Remember**: _"Anything = NULL is NULL, not false. NOT IN explodes when the subquery has NULLs."_

### Q4.9 — UPSERT — what is `INSERT ... ON CONFLICT` and when do you use it?

**Answer**: Postgres's `INSERT ... ON CONFLICT (target) DO UPDATE / DO NOTHING` is an **atomic 'insert if not exists, else update'** in one statement. The target is a unique constraint or unique index. `ON CONFLICT DO NOTHING` is the idempotent-write pattern: same row twice = same outcome. `ON CONFLICT DO UPDATE` lets you merge — `EXCLUDED.column` refers to the values from the failed INSERT. Atomic, no race; replaces the read-then-write race condition you'd otherwise have to wrap in a transaction.

**How I used it**: The `page_views` table on this portfolio site uses `ON CONFLICT (path, visitor_hash, view_date) DO NOTHING` — same visitor on the same page on the same UTC date deduplicates naturally. No app-side check needed.

**Remember**: _"UPSERT = atomic insert-or-update. DO NOTHING = idempotency for free."_

### Q4.10 — Normalisation — when do you stop normalising and start denormalising?

**Answer**: Normalisation (1NF → 2NF → 3NF → BCNF) eliminates redundancy: each fact lives in exactly one place. The wins are **write correctness** (update once, no inconsistency) and storage. The costs are **JOINs and lookup latency** on hot reads. Rule: **normalise the write side** (where consistency matters), **denormalise the read side** (where latency matters). The CMS authoring backend is fully normalised; the delivery view is a flattened denormalised projection.

**How I used it**: Exactly the PRISM ↔ Tempo Runtime split. PRISM Postgres is 3NF — `message`, `asset`, `asset_config` separate. Tempo Runtime Cassandra is denormalised — one row per `(tenant, channel, pageType)` holds the entire payload so a customer read is one disk seek.

**Remember**: _"Normalise the write side, denormalise the read side."_

### Q4.11 — The N+1 query problem — what is it and how do you fix it?

**Answer**: You run **one query to fetch N parent rows, then one query per parent to fetch its children** — N+1 queries total. Looks fine at N=10, dies at N=1,000. The fix depends on your tool: ORMs offer eager fetching (Hibernate's `@EntityGraph` or fetch-join), or batch fetching that issues one IN-list query for all child IDs. Raw SQL: do a single JOIN and group the result in application code. Detection: log query counts per request in dev; spikes proportional to result size are the smell.

**How I used it**: Bit me on PRISM's bulk-export endpoint. Iterating over 500 messages triggered 500 lazy loads of their assets — 501 queries, 8 seconds. Fixed with a QueryDSL fetch-join: 1 query, 80ms.

**Remember**: _"Loop over parents = N+1 queries waiting to happen. Fetch-join or batch."_

### Q4.12 — ORM vs raw SQL — when do you drop down?

**Answer**: ORMs (Hibernate, Drizzle) are great for 80% of queries: CRUD, simple filters, type-safe entity mapping. Drop to raw SQL or a query builder when you need: **window functions, recursive CTEs, complex aggregations, dialect-specific features** (partial indexes, JSON operators), or specific performance shape the ORM won't produce (e.g. a covering index-only scan). The discipline: keep raw SQL in one DAO file per concern, not sprinkled across the codebase, so it's easy to find and review.

**How I used it**: PRISM uses JPA + QueryDSL for 90% of queries. The remaining 10% — the bulk state transition CTEs, the windowed "latest N versions" view, the partitioned partial-index lookup — live in clearly-named native query methods on the DAO so they're easy to grep.

**Remember**: _"ORM for CRUD. Drop to SQL for window functions, recursive CTEs, hand-tuned plans."_

---

# 5. Databases (project-specific Postgres patterns)

> Anchor: **PRISM Postgres** — list-partitioned assets, composite PK (asset_id, status), deferred-cascade FK, Liquibase, partial unique indexes.

### Q5.1 — What is list partitioning and when do you reach for it?

**Answer**: **Postgres partitioning** physically splits a logical table into several child tables, and Postgres automatically routes reads/writes to the right one based on a partition key. **List partitioning** keys by a discrete value (status, type, region). The win: hot data lives in one small table that fits in cache; archived data sits in a larger table that the planner can skip. Operationally you can also drop a whole partition in one DDL instead of a million-row DELETE.

**How I used it**: PRISM's `asset` table is list-partitioned on `status` across `assets_active` / `assets_inactive` / `assets_default`. Active queries hit ~12k rows; archived sits in the inactive partition. ARCHIVE is a partition row-move, not an UPDATE.

**Remember**: _"Split by a status-shaped key. Hot stays hot."_

### Q5.2 — Composite primary key — why `(asset_id, status)` not just `asset_id`?

**Answer**: With list partitioning, **every partition has its own PK B-tree**. If the PK is just `asset_id`, an asset's row in `assets_active` and `assets_inactive` would collide on the same key when you try to row-move it. Making the PK `(asset_id, status)` lets the same `asset_id` exist (temporarily, during a transition) in both partitions without violating uniqueness. It also makes `status` a free index — query planner uses it.

**How I used it**: PRISM. The composite PK is what made ARCHIVE work as `UPDATE asset SET status = 'ARCHIVED'` — Postgres physically moves the row, both partitions are happy with their local PK, no key collision.

**Remember**: _"Partition + composite PK = no key collision during row-move."_

### Q5.3 — Deferred-cascade FK — what does it solve?

**Answer**: A normal `ON UPDATE CASCADE` FK fires immediately when the parent row changes. During a partition row-move, the parent is briefly absent then reappears — an immediate cascade can see "parent missing" and cascade a delete or just fail. **Deferred** means the constraint is checked at commit time, not statement time, so the FK sees the final consistent state and the row-move succeeds.

**How I used it**: PRISM's `asset_config` has a deferred-cascade FK to `asset`. When an asset moves from `assets_active` → `assets_inactive`, the FK doesn't fire mid-move; it validates at commit when the asset is settled in its new partition.

**Remember**: _"Deferred = constraint checks at commit, not statement."_

### Q5.4 — Partial unique index — what's a real use case?

**Answer**: A unique index that only applies to rows matching a `WHERE` predicate. Why useful: enforce uniqueness for a state, not the whole table. Classic case: "only one in-progress ingestion per `(tenant, metadata_key)`" — you can't put a plain unique constraint on `(tenant, metadata_key)` because completed ingestions can repeat. `CREATE UNIQUE INDEX ... ON ingestions(tenant, metadata_key) WHERE status = 'START'` does it.

**How I used it**: PRISM's Figma auto-ingestion pipeline. Two concurrent webhooks for the same Figma layer hit the partial unique index and one fails with a clean conflict — single-flight protection without a distributed lock.

**Remember**: _"Unique only when the WHERE matches. Cheap single-flight."_

### Q5.5 — Cursor vs offset pagination — when does each break?

**Answer**: **Offset** (`LIMIT 20 OFFSET 1000`) is simple and supports jumping to page N, but Postgres has to scan + discard 1,000 rows; performance degrades linearly with offset. Worse, items shift between pages if data is inserted while paging. **Cursor** uses a stable key — usually `(created_at, id)` — and you fetch `WHERE (created_at, id) < (last_seen)`. Constant time, stable under inserts, but you can't jump to page N; only "next" and "previous."

**How I used it**: PRISM's `/messages` list is cursor-paginated on `(updated_at, id)` because editors page through 12k messages and offset got slow past page 50.

**Remember**: _"Offset for small lists. Cursor for big ones."_

### Q5.6 — SQL vs NoSQL — what's the real distinction?

**Answer**: Not "structured vs unstructured." The real question is **access pattern**. SQL gives you ad-hoc query flexibility, JOINs, transactional consistency across rows — pick it when you don't know all your queries up front and you need ACID. NoSQL (Cassandra, DynamoDB) gives you predictable single-key reads at massive scale; you design the schema around the queries you'll run. Pick it when you have one or two access patterns and you need horizontal scale beyond what a single-leader SQL DB can give.

**How I used it**: PRISM authoring is Postgres — many ad-hoc editor queries, transactional safety matters. Tempo Runtime delivery is Cassandra — one access pattern (`get layout by tenant + channel + pageType`), need 100K reads/sec/region, no JOINs.

**Remember**: _"SQL = flexible queries. NoSQL = known access patterns at scale."_

### Q5.7 — Cassandra consistency — `LOCAL_QUORUM` vs `LOCAL_ONE`?

**Answer**: Cassandra replicates writes across N nodes; the consistency level is **how many must acknowledge before the operation returns**. `LOCAL_QUORUM` = majority of replicas in the local DC must ACK — survives one node failure, strong enough for most apps. `LOCAL_ONE` = first replica wins — fastest, but you might read stale data immediately after a write. Convention: **write with QUORUM, read with ONE** when stale-by-seconds is OK; write+read QUORUM when it's not.

**How I used it**: Tempo Runtime writes with `LOCAL_QUORUM` (publish must be durable across the local DC) and reads with `LOCAL_ONE` (storefront read is allowed to be a few-second-stale; freshness comes from Kafka push + cache invalidation, not from read consistency).

**Remember**: _"Quorum writes, fast reads, freshness from invalidation."_

### Q5.8 — Liquibase / migrations — what discipline do you keep?

**Answer**: Every schema change is **a versioned, ordered changelog file** in the repo. Never edit an applied changeset; always write a new one. Migrations apply at deploy time or via a CI job — never by hand on prod. Drizzle / Liquibase keep a tracker table so re-running is idempotent. Reversibility is nice-to-have; in practice we forward-fix rather than down-migrate destructive changes.

**How I used it**: PRISM uses Liquibase changelogs under `db/changelog/`. Schema changes go through PR review, the CI job applies them to the dev branch automatically. Prod migrations run as a separate gated workflow.

**Remember**: _"Versioned. Append-only. Tracked. Never hand-applied."_

### Q5.9 — Indexes — what kinds and when?

**Answer**: **B-tree** is the default — equality and range queries on a column. **Partial** indexes apply to a `WHERE` subset (saves space + write cost). **Composite** indexes on `(a, b, c)` accelerate queries that filter by `a`, `a+b`, or `a+b+c` (left-prefix rule) — not by `b` alone. **GIN** is for full-text and JSONB containment. **Don't over-index**: every index adds write cost. Profile with `EXPLAIN ANALYZE` before adding.

**How I used it**: PRISM's `asset` table has a B-tree on `(tenant_id, status, updated_at)` for the editor's "recent assets" view, a partial GIN on the JSONB `asset_config` for full-text search across translations.

**Remember**: _"B-tree common, partial cheap, composite left-prefix, GIN for JSONB."_

---

# 6. GCP, Kubernetes & Cloud

> Anchor: **WCNP** (Walmart's K8s) on **GKE**, **Istio mTLS**, multi-region active-active across `useast4`, `uscentral`, `uswest`, Akeyless for secrets.

### Q6.1 — How honestly do you frame your GCP experience?

**Answer**: I've run production workloads on **GKE for ~3 years through Walmart's WCNP wrapper**. That means I'm strong on **Kubernetes** — deployments, services, ingress, autoscaling, secrets, mTLS via Istio, observability stack. I've **not driven raw GCP primitives** like Cloud Run, Cloud SQL, IAM bindings, VPC Service Controls hands-on — the platform team handled those. My ramp on those is short because the concepts map cleanly: Cloud SQL is managed Postgres, IAM is RBAC-shaped, Cloud Run is a managed `kubectl run`. **No bluffing**: I've used GKE in prod for years; I'll ramp on raw GCP in days, not months.

**How I used it**: PRISM and Tempo Service run on GKE behind GSLB, Istio sidecars, Akeyless secrets, multi-region active-active. My GearNest side project is the first thing I'm building on raw GCP (Cloud Run + Cloud SQL + Pub/Sub) end-to-end.

**Remember**: _"GKE deep, raw GCP ramp. Don't bluff, frame the gap."_

### Q6.2 — Kubernetes — what's actually in a deployment?

**Answer**: A **Pod** is one or more containers scheduled together on the same node, sharing network + storage. A **Deployment** manages a replicated set of pods — declares "I want N replicas of this image" and the controller maintains it. A **Service** gives you a stable virtual IP + DNS for that set of pods so callers don't talk to ephemeral pod IPs. An **Ingress** routes external traffic to services. **HorizontalPodAutoscaler** scales replicas on CPU/memory/custom metrics. Everything is declarative YAML.

**How I used it**: PRISM is a Deployment + Service + HPA, exposed via GSLB → Istio gateway → Service → Pod. HPA scales between 3 and 12 replicas on CPU > 70%.

**Remember**: _"Pod ⊂ Deployment ⊂ Service ⊂ Ingress. Everything declared."_

### Q6.3 — Istio service mesh — what does it actually solve?

**Answer**: Three things, in order of impact. (1) **mTLS automatically** between every pod — every internal call is mutually authenticated and encrypted, without each service implementing TLS. (2) **Traffic policy** (timeouts, retries, circuit breakers, canary splits) as YAML — change them without redeploying code. (3) **Observability** — every request gets a trace span automatically, every metric is labelled by service. The cost: an extra sidecar container per pod, some latency, operational complexity.

**How I used it**: PRISM and Tempo Service have Istio sidecars. Internal calls are mTLS — we don't reason about cert distribution. The canary deploy for Tempo Runtime Go used an Istio traffic split (1% → 5% → 25%).

**Remember**: _"mTLS, traffic shaping, observability — all without code changes."_

### Q6.4 — Multi-region active-active — what does it cost you?

**Answer**: Two regions both serve traffic, both read+write the same logical data. The hard part is the data layer. Three patterns. (1) **Active-active stateless services + single-leader DB** — easy for the service, the DB is the single point of failure. (2) **Multi-master DB** (CockroachDB, Spanner) — true active-active but heavy. (3) **Per-region partition** — each region owns a slice of tenants. The cost is conflict resolution and consistency tradeoffs; the win is regional failure tolerance + latency for users near the region.

**How I used it**: Tempo Service runs active-active across `useast4`, `uscentral`, `EDC` — stateless services, GSLB routes user to the nearest region, the DB is logically single-region with replication for DR.

**Remember**: _"Stateless = easy, stateful = pick your conflict model."_

### Q6.5 — Secrets management — what's the discipline?

**Answer**: Three rules. (1) **Never in env files on disk** in prod — always fetched at startup from a secrets store. (2) **Rotated regularly** — short-lived credentials > long-lived where possible. (3) **Scope-bound** — each service has only the credentials it needs. The toolchain matters less than the discipline: Akeyless, Vault, AWS Secrets Manager, GCP Secret Manager all do this.

**How I used it**: PRISM and Tempo Service use Akeyless. The pod fetches DB creds + Kafka SASL + downstream API keys at startup. No secret hits a YAML file or `kubectl edit`.

**Remember**: _"Fetched, scoped, rotated. Never in YAML."_

### Q6.6 — High availability — what's actually load-bearing?

**Answer**: HA is a stack of decisions. (1) **No single instance of anything** — ≥ 2 replicas of every service. (2) **Health checks** that actually verify the service can serve, not just that the process is alive. (3) **Graceful shutdown** — drain on SIGTERM so K8s rolling updates don't drop in-flight requests. (4) **Stateless services** so any pod can serve any request. (5) **Multi-AZ scheduling** so a single zone failure doesn't take you down. (6) **Backups + tested restore** for the data layer. Without #6, the other five only buy you minutes.

**How I used it**: PRISM has all six. The one we caught the hard way: graceful shutdown — we were dropping requests on rolling deploys until we added the SIGTERM drain + readiness probe gate.

**Remember**: _"Two of everything, drain on shutdown, tested restore."_

### Q6.7 — Cost — where do K8s bills actually come from?

**Answer**: Usually three places, ranked. (1) **Right-sizing** — overprovisioned `requests` on every pod adds up across hundreds of pods. (2) **Egress** — cross-region or cross-cloud traffic is expensive; in-region is free. (3) **Managed services** (Cloud SQL, Memcached, Kafka) — easy to ignore until they're 60% of the bill. The fix: monitor cost per service in a dashboard, set a baseline, alert on regressions.

**How I used it**: PRISM runs at **~$11/day** because the workload is genuinely small and we sized pods to actual usage. Tempo Service is **~$767/day** — that's where the cross-region replication + Kafka topic spend lives.

**Remember**: _"Right-size pods, watch egress, monitor managed services."_

---

# 7. Observability & Logging

> Anchor: **PRISM + Tempo V3** — OpenTelemetry, OpenObserve logs, Prometheus + Grafana, W3C Trace Context >92% propagation.

### Q7.1 — Metrics vs Logs vs Traces — what's each for?

**Answer**: **Metrics** are numeric time-series (`http_requests_total`, `cpu_seconds`). Cheap, aggregable, alertable. Tell you "something is wrong, here's the shape." **Logs** are timestamped lines, structured ideally. Tell you "what specifically happened, with full context." Expensive to store at scale. **Traces** stitch a single request across services with timing. Tell you "where did the time go." Sampled, not stored 100%. The discipline: metrics for alerting, traces for root cause, logs for the specific user incident.

**How I used it**: PRISM ships Prometheus metrics for RED (Rate / Errors / Duration), OpenTelemetry traces sampled at 10%, structured JSON logs to OpenObserve. When the editor hit a 500, I went metrics → trace → log in that order.

**Remember**: _"Metrics for alarms. Traces for shape. Logs for specifics."_

### Q7.2 — Prometheus + Grafana — what's the model?

**Answer**: Prometheus **scrapes** your services on a `/metrics` endpoint at a regular interval, stores time-series locally. PromQL is the query language — `rate(http_requests_total{status="500"}[5m])` gives you 500s per second over the last 5 min. Grafana renders PromQL on dashboards. Alerts run as PromQL expressions on a schedule. The model: services expose numbers; Prometheus polls; Grafana draws; Alertmanager pages.

**How I used it**: PRISM exposes Prometheus metrics via Spring Boot Actuator. Our four core dashboards: RED, JVM, DB connection pool, Kafka producer health. Alert thresholds are PromQL expressions in `prometheus-rules.yml`.

**Remember**: _"Scrape numbers. Query with PromQL. Draw with Grafana."_

### Q7.3 — OpenTelemetry — what does it standardise?

**Answer**: One SDK, one wire format, three signals (traces, metrics, logs). Before OTel: every vendor had their own SDK and wire format. After: instrument once with OTel, export to any backend (Jaeger, Tempo, Datadog, Honeycomb). The OTel SDK auto-instruments common libraries (HTTP client, JDBC, Kafka) so you don't write boilerplate. Manual spans cover business operations.

**How I used it**: Tempo V3 BFF and PRISM both run the OTel Java agent. Auto-instrumentation gave us HTTP/JDBC/Kafka spans for free. We added manual spans around the signal-aggregation step in PRISM's bulk publish because the auto trace stopped at the SQL call.

**Remember**: _"One SDK, one wire format, swap the backend anytime."_

### Q7.4 — W3C Trace Context — what is the spec and why does it matter?

**Answer**: A single HTTP header — `traceparent` — that carries the **trace ID + parent span ID + flags** in a standard format every modern library understands. Before: every vendor had its own header (`X-B3-TraceId`, `X-Datadog-Trace-Id`), so trace context died at the boundary between two teams using different libraries. With W3C: any compliant SDK reads/writes the same header, so the trace stitches all the way through.

**How I used it**: I rolled out W3C `traceparent` propagation across the Tempo V3 BFF (PR #700). Validated **>92% propagation success in stage** (**1,284 / 1,387** requests over 2 hours). First end-to-end distributed tracing in Tempo's history — we could finally follow a publish from the editor through 15 services to Tempo Runtime.

**Remember**: _"One header, every SDK, traces stitch across teams."_

### Q7.5 — How do you actually debug a prod issue from logs?

**Answer**: Five-step discipline. (1) **Get the trace ID** from the user's error or the alert. (2) **Filter logs by that trace ID** — pulls every line across every service for that one request. (3) **Read by stack-frame source, not error string** — two different bugs can throw the same message; the stack frame tells you which one. (4) **Look for the first error**, not the loudest — downstream errors are usually a consequence of an earlier one. (5) **Reproduce locally** with the trace context as a seed.

**How I used it**: April 2026 Tempo Service `/` returned 500 while `/fn/ecv` stayed 200. Following the trace, the error came from `saber-wm-iam` not our code — IAM provider issue, not ours. Took 4 minutes because we sorted by stack-frame source.

**Remember**: _"Trace ID → stack frame → first error. In that order."_

### Q7.6 — SLOs vs SLAs vs SLIs — what's the difference?

**Answer**: **SLI** = Service Level Indicator — the actual measurement (e.g. "fraction of requests that succeeded in <500ms"). **SLO** = Service Level Objective — the internal target on that SLI (e.g. "99.5% of requests in <500ms over a 30-day window"). **SLA** = Service Level Agreement — the contractual promise to a customer, usually weaker than the SLO (e.g. "99% uptime"). The discipline: pick SLIs that reflect user pain, set SLOs you can actually hit, communicate SLAs you can comfortably exceed.

**How I used it**: PRISM's SLO is **99.5% of writes <500ms over 30 days**. The SLI is the p99.5 latency. We're not on the customer hot path so there's no external SLA — internal teams know our SLO.

**Remember**: _"SLI = what you measure. SLO = what you target. SLA = what you promise."_

### Q7.7 — Stream-naming gotchas — what did you learn the hard way?

**Answer**: Naming conventions for log streams **bite you in incidents**. Two real lessons. (1) Nonprod and prod use different conventions — we use hyphens in nonprod (`wcnp_cxt-tempo`) and underscores in prod (`wcnp_cxt_tempo`). Grepping the wrong one in a prod incident wastes 10 minutes. (2) Per-app `_v1` streams are decoys — they often contain only Prometheus/Helm logs, never the app's structured logs. Always grep the canonical stream first.

**How I used it**: Documented in our runbook after an incident where I grepped `wcnp_cxt-tempo_v1` for 8 minutes before realising the app logs were in `wcnp_cxt_tempo`.

**Remember**: _"Different conventions per env. Don't trust `_v1`."_

---

# 8. Exception Handling & Reliability

> Anchor: **PRISM** + **Tempo V3 BFF** — Kafka idempotency, SSRF/open-redirect protection, feature-flag rollback, partial-failure isolation.

### Q8.1 — Kafka at-least-once + idempotent consumer — how do you actually wire it?

**Answer**: Producer publishes with `acks=all` and a deterministic event key (UUID). Consumer uses **auto-commit off** and manual commits after the side effect succeeds. The consumer's side effect must be idempotent — usually a unique constraint on the consumed event ID, or an `INSERT ... ON CONFLICT DO NOTHING`. If the consumer crashes between processing and commit, the message replays; the unique constraint catches the duplicate. Net effect: messages might be delivered twice; effects happen once.

**How I used it**: PRISM's downstream services (Pronto, IronBank, asset-discovery, P13N) all use this. The consumed event's UUID is the unique key in their side-effect tables. A replay just hits the conflict and is logged-and-discarded.

**Remember**: _"At-least-once delivery + unique key on the side effect = at-most-once effect."_

### Q8.2 — Retry with exponential backoff — what's the rule?

**Answer**: Don't retry forever, don't retry immediately. Three constants: **base delay** (e.g. 200ms), **multiplier** (usually 2), **max delay** (cap at 30s so you don't wait an hour). Add **jitter** — randomise within ±25% — so a thundering herd of clients doesn't all retry at the same instant. **Total retry budget** matters too: 3-5 attempts is usual; beyond that you're adding latency for the user without a real shot at success. Distinguish **retriable** (timeout, 503) from **non-retriable** (400, 401, 404).

**How I used it**: Tempo V3 BFF uses Resilience4j retry per downstream service. Base 200ms, multiplier 2, max 5 attempts. Jitter prevents the BFF from synchronising retries against a downstream that just came back online.

**Remember**: _"Cap delay, add jitter, bound attempts, only retry retriables."_

### Q8.3 — Validation at boundaries — where does it actually live?

**Answer**: **At every boundary**, with the validator owning the contract. Inbound HTTP: Zod (TS) or `@Valid` + Bean Validation (Java) on the request DTO — reject malformed before it reaches business logic. Outbound to a downstream: still validate, because contracts drift. DB writes: rely on schema constraints (NOT NULL, CHECK, FK) as the last line. The mistake: validating once at the controller and trusting it through the stack — a refactor or a new caller breaks the assumption.

**How I used it**: Tempo V3 BFF validates inbound with Zod, outbound to downstreams with Zod on the response. PRISM validates inbound with Bean Validation, lets Postgres enforce the rest.

**Remember**: _"Validate at every boundary. Don't trust the previous one."_

### Q8.4 — SSRF protection in a BFF — what's the attack and the fix?

**Answer**: **SSRF** (Server-Side Request Forgery): an attacker sends a request that makes your server fetch a URL the attacker chose — typically pointing at internal metadata services (`169.254.169.254` on AWS), or internal admin endpoints, or a port scan of your VPC. The fix: **never proxy an attacker-controlled URL**. Maintain a per-downstream allowlist of base URLs; for each outbound call, resolve the target against the allowlist; reject anything else. Don't follow redirects to off-list URLs.

**How I used it**: Tempo V3 BFF's `/api/proxy` accepts a `service` enum (one of the 15 known downstreams) and a path — never an arbitrary URL. The base URL is server-side. Closed the SSRF surface entirely; documented in our security review.

**Remember**: _"Allowlist of services. Server-side base URL. Never proxy a URL."_

### Q8.5 — Open-redirect protection — what's the attack?

**Answer**: Your app has a `?next=` query param that controls where to send the user after login. An attacker sets `?next=https://evil.com/fake-login`. User logs in, redirected to evil, who phishes the next thing. The fix: **only honour same-origin redirects** — parse the target URL, check `origin === request.origin`, otherwise drop the redirect and go to the default. Don't allowlist domains (drift over time); always reduce to same-origin.

**How I used it**: Tempo V3 has tenant routing through `/{tenant}/...`. The middleware validates the post-login redirect is same-origin before honouring it.

**Remember**: _"Same-origin only. Don't allowlist."_

### Q8.6 — Feature flags as a rollback tool — what makes them work?

**Answer**: Three properties. (1) **Off by default for new code** — ship dark, flip on intentionally. (2) **Tenant-scoped or user-scoped** — flip for one customer to validate before fleet rollout. (3) **Read at request time, not boot time** — so flipping a flag takes effect immediately, no redeploy. The flag store has to be fast (CCM-style) so the read cost is negligible. The trap: flags accumulate. Set an expiry date on each flag and clean them up when stable.

**How I used it**: Tempo V3's V2-fallback is a per-tenant CCM flag. During cutover we flipped one tenant at a time; if anything broke we flipped it off and they snapped back to V2 without a deploy.

**Remember**: _"Dark by default. Tenant-scoped. Read at request. Expire when stable."_

### Q8.7 — Partial-failure isolation across downstream calls — how?

**Answer**: When your BFF fans out to N services, **one slow downstream shouldn't stall the whole response**. Three tools. (1) **Per-downstream timeouts** — never inherit the default. (2) **Per-downstream circuit breakers** — open the circuit if errors > threshold; serve a fallback. (3) **Per-downstream thread pools (bulkheads)** — flood of requests to A can't starve threads from serving B. The pattern: every downstream gets its own pool, breaker, and timeout, configured per its real characteristics.

**How I used it**: Tempo V3 BFF wraps each of the 15 downstreams in a per-service Resilience4j config. When P13N hung for 30s in March, the editor stayed responsive — only the personalisation tab degraded. Without isolation, the whole UI would have timed out.

**Remember**: _"Per-downstream timeout, breaker, and pool."_

---

# 9. System Design

> Anchor: **Tempo / PRISM IS a content-delivery platform**. If you get a CMS / content-delivery / signal-aggregation prompt, you've already built it.

## The 6-step framework — say it out loud, in this order

1. **Clarify requirements** — functional + non-functional. _"Before I design, can I clarify: who are the users? What's the read/write ratio? What's the consistency model — can we tolerate seconds of staleness? What scale are we targeting?"_ Two minutes here saves twenty later.
2. **Estimate scale** — rough QPS, storage, read/write ratio. _"100M users, 10% DAU, 10 actions/day → ~120 QPS average, peak 3× → 360 QPS, 100KB per action → ~1TB/month storage."_ Be loud about the math.
3. **Define the API** — key endpoints, inputs/outputs. _"`POST /predict {stock, direction}` → `{betId, lockedAt}`. `GET /predictions?day=X` → list."_ This forces concreteness.
4. **High-level design** — client → LB → service → cache → DB → queue. Draw the boxes. Trace one request through them.
5. **Deep-dive 1–2 components** — data model, caching strategy, sync strategy. **This is where you lean on PRISM / Tempo.** Show you've made these calls before.
6. **Bottlenecks & tradeoffs** — where it breaks at 10× scale, consistency vs availability, SPOFs, cost. End on tradeoffs, not certainty.

### Q9.1 — Design a content management + delivery system (your home turf).

**Answer**: Same shape as Tempo. (1) **Authoring write-path**: editor → REST API → relational DB (Postgres) for transactional correctness, audit history, ad-hoc editor queries. (2) **Kafka outbox**: every commit publishes an event. (3) **Sync service**: consumes events, writes into a denormalised store optimised for one access pattern. (4) **Delivery read-path**: customer → CDN → BFF → in-process cache → distributed cache → wide-column store (Cassandra). (5) **Multi-tenant** by tenant ID at every layer. (6) **Canary by tenant group** for safe rollout. Trade-off: eventual consistency between write and read paths (seconds), but customer reads are p95 sub-50ms.

**How I used it**: This is **exactly Tempo + PRISM**. 38 tenants, 100K reads/sec/region target, ~3-tier cache, Kafka-driven sync. I'll talk through the real numbers: ~27 TPS write, 4K TPS read, Cassandra `LOCAL_QUORUM`/`LOCAL_ONE`, Ristretto + Meghacache + Cassandra.

**Remember**: _"Authoring + delivery split. Kafka in between. Tempo IS this system."_

### Q9.2 — Design a URL shortener (the canonical warmup).

**Answer**: (1) **API**: `POST /shorten {longUrl}` → `{shortCode}`, `GET /:code` → 301 redirect. (2) **ID generation**: pre-generated counter + base62 encoding gives ~62^7 = 3.5T short codes in 7 chars. Avoid hashing the URL (collisions, deterministic = enumerable). (3) **Storage**: KV store keyed by short code (Redis + a durable backing like DynamoDB) — single-key reads, perfect for NoSQL. (4) **Cache**: redirects are the hot path; LRU in-process cache catches the head, the KV store catches the rest. (5) **Analytics**: every redirect emits an event to Kafka, processed offline. (6) **Scale**: 1B URLs → 1B rows × ~100 bytes = ~100GB; trivial.

**Remember**: _"Counter + base62. KV store. Cache the redirects. Async analytics."_

### Q9.3 — Design a rate limiter.

**Answer**: (1) **Algorithm**: **token bucket** is the standard — N tokens refill at rate R, each request consumes one. Smooth, bursty-friendly. Sliding-window log is more accurate but stores more. Fixed-window counter is cheap but spiky at the boundary. (2) **Storage**: Redis with atomic `INCR` + `EXPIRE`, or a server-side Lua script for token bucket. (3) **Key shape**: `rate:user:{id}` or `rate:ip:{addr}` or `rate:tenant:{id}` depending on the unit you're limiting. (4) **Distributed**: Redis is centralised, so it scales until Redis is the bottleneck; for huge scale you shard by key and accept slight inaccuracy at shard boundaries. (5) **Response**: `429 Too Many Requests` + `Retry-After` header.

**How I used it**: We use Redis-backed rate limits on the Tempo V3 BFF, 60 req/min per user.

**Remember**: _"Token bucket. Redis INCR. 429 with Retry-After."_

### Q9.4 — Design a notification system (push/email).

**Answer**: (1) **API**: `POST /notify {userId, type, payload}`. (2) **Fan-out**: dispatcher publishes to Kafka topic per channel (push, email, in-app). (3) **Per-channel workers**: consume the topic, call provider (APNs/FCM, SES, in-app store). Idempotent on event ID. (4) **User preferences**: read at dispatch time — opt-outs, quiet hours. (5) **Retry**: failed sends go to a delay queue (exponential backoff). After N attempts, dead-letter. (6) **Storage**: persisted in `notifications` table for in-app history + analytics. (7) **Scale concerns**: provider rate limits (APNs's 9K/sec/connection), bulk send batching, fan-out amplification.

**Remember**: _"Dispatcher → per-channel topic → idempotent worker → provider."_

### Q9.5 — Design a chat / real-time system.

**Answer**: (1) **Transport**: **WebSocket** for full-duplex; SSE for server→client only. (2) **Gateway**: stateless WS gateway accepts connections, sticky-routes by user ID to a per-user channel. (3) **Message bus**: incoming messages publish to Kafka or Redis Pub/Sub keyed by conversation ID. (4) **Persistence**: write to Cassandra partitioned by `(conversation_id, message_time)` — bounded partition, time-ordered scan. (5) **Delivery**: gateway subscribes to its conversations, fans out to connected sockets. **Offline** clients: read missed messages on reconnect via timestamp cursor. (6) **Presence**: heartbeat to Redis TTL; "last seen" = TTL expiry.

**Remember**: _"WS gateway → Kafka/Redis → Cassandra by conv_id. Presence in Redis TTL."_

### Q9.6 — Caching strategy — when do you pick which?

**Answer**: Three patterns. (1) **Cache-aside**: app reads cache; on miss, read DB and populate cache. Simple, app owns staleness. (2) **Write-through**: app writes both cache and DB synchronously. Strong consistency, latency cost. (3) **Write-behind**: app writes cache; async flush to DB. Fast writes, risk of data loss on cache crash. Most systems use cache-aside with a TTL. **Cache invalidation strategy** matters more than the pattern: TTL is honest, explicit invalidation on write is precise but harder to get right.

**How I used it**: Tempo Runtime is **3-tier cache-aside**: Ristretto in-process L1, Meghacache L2, Cassandra origin. Cache-aside with both TTL and Kafka-driven invalidation on publish. Ristretto wins ~80% of reads in microseconds.

**Remember**: _"Cache-aside default. TTL is honest. Invalidate when you can afford to."_

### Q9.7 — Estimating QPS and storage — what's the rough math?

**Answer**: Have a recipe. (1) **Active users** × **actions per user per day** = total daily actions. (2) Divide by **86,400** seconds in a day for average QPS. (3) Multiply by **3** for peak QPS. (4) Multiply by **bytes per action** for total daily bytes; **× 365** for yearly storage. Worked example: 10M DAU × 10 actions = 100M/day; avg = 1,160 QPS; peak ~3,500 QPS. At 1KB each = 100GB/day = 36TB/year — sharded relational or wide-column.

**Remember**: _"DAU × actions/day. /86,400 = avg. ×3 = peak. ×bytes = storage."_

### Q9.8 — Bottlenecks and tradeoffs — how do you close strong?

**Answer**: Always end on tradeoffs — it signals seniority. Three classes. (1) **CAP under partition**: you pick C or A, can't have both. Most systems pick A and document the staleness window. (2) **Single points of failure**: any one-of resource is a SPOF — DB primary, ID generator, config service. Mitigate with replicas, fallback IDs, cached config. (3) **Cost vs. latency**: every cache layer reduces latency and adds operational complexity; every replica reduces failure risk and adds cost. **Say the tradeoff out loud** — the interviewer wants to know you've thought past the happy path.

**How I used it**: Tempo Runtime's tradeoff is **eventual consistency between authoring and delivery (seconds via Kafka)** for **sub-50ms p95 reads**. Editorial outages don't blank the homepage; that's the win for the split.

**Remember**: _"CAP, SPOFs, cost vs. latency. End on the tradeoff."_

---

# Final practice checklist

Before each interview:

- [ ] Reread the **Delivery Rules** section. Out loud.
- [ ] Pick three Qs at random and answer them aloud, recorded. Listen back; cut filler.
- [ ] Rehearse the **rapid-fire trivia** until you can fire versions and numbers in <3 seconds.
- [ ] Know the **6-step system design** framework cold; you should be able to recite all six steps with no prompt.
- [ ] Pick your two strongest stories: **PRISM Forklift outbox** (backend signature) and **Tempo V3 W3C trace propagation** (full-stack signature). Rehearse both as ~90-second narratives.
- [ ] Honest framing for **raw GCP**: rehearse the gap-and-ramp sentence out loud once.

---

_End of doc. Update freely as new Qs come up in practice runs._

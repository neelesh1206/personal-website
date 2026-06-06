# Portfolio Website — Project Plan

**Owner:** Neelesh Kakaraparthi  
**Repo:** [github.com/neelesh1206/personal-website](https://github.com/neelesh1206/personal-website)  
**Live:** [neeleshkakaraparthi.dev](https://neeleshkakaraparthi.dev)  
**Goal:** Showcase enterprise-grade full-stack skills to recruiters and hiring managers targeting Senior Software Engineer roles.

---

## Decisions Log

| Decision           | Choice                                             | Rationale                                                  |
| ------------------ | -------------------------------------------------- | ---------------------------------------------------------- |
| Framework          | Next.js 16 (App Router) from scratch               | Template fight not worth it; own every decision            |
| Language           | TypeScript strict mode                             | Non-negotiable enterprise signal                           |
| Styling            | Tailwind CSS v4 + next-themes                      | Industry standard; class-based dark mode for SSR safety    |
| Dark mode          | Light default, user-toggleable                     | Accessibility + preference                                 |
| Content            | MDX files in `/content`                            | Git-based, no CMS needed, typed with Zod later             |
| Fonts              | Inter (body) + JetBrains Mono (code) via next/font | Zero layout shift, self-hosted                             |
| Database           | Neon (serverless Postgres) + Drizzle ORM           | TypeScript-native ORM, serverless fits Vercel edge         |
| Email              | Resend                                             | Modern API, great Next.js DX, free tier sufficient         |
| Analytics          | Vercel Analytics + Speed Insights                  | Free, privacy-friendly, no cookie banner                   |
| Forms              | React Hook Form + Zod                              | Type-safe, enterprise-standard validation                  |
| Deployment Phase 1 | Vercel                                             | Zero config, PR previews, auto-deploy on push              |
| Deployment Phase 2 | Terraform AWS S3 + CloudFront + OIDC               | IaC in repo as seniority signal; activate after v1 stable  |
| CI/CD              | GitHub Actions                                     | Lint + typecheck + test + build on every PR                |
| Git hooks          | Husky + lint-staged                                | Enforces quality on every commit                           |
| Testing            | Vitest (unit) + Playwright (E2E)                   | Treats own project with production rigor                   |
| Icons              | lucide-react                                       | Tree-shakeable, consistent                                 |
| Animations         | framer-motion (selective)                          | Subtle entrance animations, no gimmicks                    |
| Domain             | neeleshkakaraparthi.dev (Cloudflare Registrar)     | Exact name match = strongest Google ranking signal         |
| Node version       | 24 LTS (pinned via .nvmrc)                         | Latest LTS, consistent across local + CI                   |
| Strava data        | Server Component + ISR revalidate:3600             | Tokens stay server-side; hourly refresh avoids rate limits |

---

## Feature Requirements

### Core Features

- [x] Light/dark mode toggle (default light)
- [x] Fully responsive — mobile-first
- [x] SEO: `next/metadata` + JSON-LD Person schema (Google name search ranking)
- [x] Vercel Analytics + Speed Insights
- [x] Sticky header with active nav states
- [x] Mobile hamburger menu

### Visitor Contact & Resume Delivery

- [ ] `/connect` page with contact form
- [ ] Form fields: Name, Email, Message (optional)
- [ ] Validation: React Hook Form + Zod
- [ ] On submit: save contact to Neon DB (`contacts` table)
- [ ] On submit: Resend auto-sends resume PDF to visitor's email
- [ ] On submit: Resend sends notification to neelesh1206@gmail.com
- [ ] "Get Resume" CTA in header opens connect page

### Analytics

- [x] Vercel Analytics (page views, referrers, device breakdown)
- [x] Vercel Speed Insights (Core Web Vitals)
- [ ] Neon DB stores all contact form submissions with metadata (referrer, timestamp)

### SEO

- [x] `next/metadata` with title template
- [x] Default OG/Twitter card metadata
- [ ] JSON-LD Person schema on home page
- [ ] `/sitemap.xml` via next-sitemap
- [ ] `/robots.txt`
- [ ] Per-page OG images via `/api/og` route

### Strava Integration (Life page — Activity Dashboard)

**Goal:** Show real fitness data from Strava on the `/life` page — makes the personal section dynamic and genuinely interesting rather than static text.

**What we display:**

- Year-to-date stats: total activities, total distance (km), total elevation gain (m), total moving time
- All-time stats: runs, rides, workouts
- Recent activities feed: last 8 activities — type icon, name, distance, pace/duration, date
- Activity type breakdown: visual split of Run / Ride / Workout / Other

**Architecture:**

- Strava API v3 (OAuth 2.0 — client credentials + refresh token flow)
- Refresh token stored in env vars; access token auto-refreshed server-side (expires every 6h)
- **Next.js Server Component** — tokens never sent to client
- **ISR `revalidate: 3600`** — data refreshed hourly, no rate-limit risk
- No chart library — pure CSS/Tailwind bar charts keep the bundle clean
- `lib/strava.ts` — typed API client with auto token refresh

**Data flow:**

```
/life page (Server Component, revalidate: 3600)
  → lib/strava.ts → refreshAccessToken() if needed
  → GET /athlete/stats          (YTD + all-time counts)
  → GET /athlete/activities?per_page=8 (recent activity feed)
  → render ActivityDashboard component (pure display, no client JS)
```

**New env vars required:**
| Variable | Description |
|---|---|
| `STRAVA_CLIENT_ID` | From Strava app settings |
| `STRAVA_CLIENT_SECRET` | From Strava app settings |
| `STRAVA_REFRESH_TOKEN` | Long-lived refresh token (obtained once via OAuth) |

**Components:**

- `components/life/ActivityDashboard.tsx` — top-level dashboard wrapper
- `components/life/StatCard.tsx` — single metric (count, distance, elevation)
- `components/life/ActivityFeed.tsx` — scrollable recent activity list
- `components/life/ActivityRow.tsx` — single activity: icon + name + metrics
- `lib/strava.ts` — typed Strava API client (refreshToken, getAthleteStats, getActivities)

**One-time setup (OAuth flow to get refresh token):**

1. Create a Strava app at strava.com/settings/api
2. Authorize once via browser to get the initial code
3. Exchange code for `access_token` + `refresh_token` — store refresh token in env
4. From then on, the server auto-refreshes the access token silently

---

## Pages

### Status Key: ✅ Done · 🔨 In Progress · 📋 Planned

| Page              | Route                    | Status | Notes                                                                                                                                                                                                                                                                                                                                                            |
| ----------------- | ------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home              | `/`                      | ✅     | Hero, currently strip, featured work, projects, connect CTA                                                                                                                                                                                                                                                                                                      |
| About             | `/about`                 | 📋     | Bio, career arc, 3 things I'm known for                                                                                                                                                                                                                                                                                                                          |
| Case Studies List | `/work`                  | ✅     | Platform-grouped (PRISM, Tempo); 6 cards                                                                                                                                                                                                                                                                                                                         |
| PRISM Backend     | `/work/prism-backend`    | ✅     | cxt-msg-asset-service — Java 21, partitioned PG, Forklift outbox                                                                                                                                                                                                                                                                                                 |
| Prism V3 UI       | `/work/prism-ui`         | ✅     | Next.js 15 editor unifying asset/request/message flows                                                                                                                                                                                                                                                                                                           |
| Tempo V3 UI       | `/work/tempo-v3-ui`      | ✅     | Lead frontend/BFF; Fastify proxy fanning out to 15 services                                                                                                                                                                                                                                                                                                      |
| Tempo Service     | `/work/tempo-service`    | ✅     | Java 17 authoring backend; Oracle → GCP Postgres                                                                                                                                                                                                                                                                                                                 |
| Tempo Runtime     | `/work/tempo-runtime`    | ✅     | Node → Go, Cosmos → Cassandra; 82% memory, 18× cold start                                                                                                                                                                                                                                                                                                        |
| Tempo V2 UI       | `/work/tempo-v2-ui`      | ✅     | Legacy editor (sunset); versioning + RBAC + dynamic forms                                                                                                                                                                                                                                                                                                        |
| Projects List     | `/projects`              | ✅     | Renders all projects from `lib/projects/data.ts`                                                                                                                                                                                                                                                                                                                 |
| MarketMind        | `/projects/marketmind`   | ✅     | Stock-prediction app — live at marketmind.neeleshkakaraparthi.dev. Full case-study layout (problem, sections, what shipped, stack).                                                                                                                                                                                                                              |
| outbox-kit        | `/projects/outbox-kit`   | 🔨     | Stub card, content TBD when library ships                                                                                                                                                                                                                                                                                                                        |
| PR Reviewer       | `/projects/pr-reviewer`  | 📋     |                                                                                                                                                                                                                                                                                                                                                                  |
| Agentic RAG       | `/projects/agentic-rag`  | 📋     |                                                                                                                                                                                                                                                                                                                                                                  |
| Stock Picker      | `/projects/stock-picker` | 📋     |                                                                                                                                                                                                                                                                                                                                                                  |
| Writing List      | `/writing`               | ✅     | 3 peer-reviewed papers (JCSTS, IJCE, Sarcouncil) — external links with abstract + tags                                                                                                                                                                                                                                                                           |
| Blog Posts        | `/writing/[slug]`        | 📋     | MDX-driven internal posts (planned — current /writing is publications-only)                                                                                                                                                                                                                                                                                      |
| Life              | `/life`                  | 📋     | Strava dashboard (YTD stats + activity feed) · CrossFit, hiking, travel, books, sports (F1/NFL/tennis/cricket), stock market, astronomy, current affairs                                                                                                                                                                                                         |
| Now               | `/now`                   | ✅     | Public streak + badge wall + 16-week activity heatmap; rendered from prep tables, no PII                                                                                                                                                                                                                                                                         |
| Resume            | `/resume`                | 📋     | Embedded PDF + download                                                                                                                                                                                                                                                                                                                                          |
| Connect           | `/connect`               | ✅     | Visitor form (React Hook Form + Zod), saves to Neon, fans out Resend visitor + owner emails, honeypot, error/success states                                                                                                                                                                                                                                      |
| Admin             | `/admin`                 | ✅     | Owner-only contacts dashboard — HMAC-signed cookie auth, 30-day bar chart, all-time / 30d / 7d counters, submissions table; blocked in robots.txt                                                                                                                                                                                                                |
| Coding Prep       | `/admin/coding-prep`     | ✅     | Personal interview-prep tracker — 4 tabs: Today routine (anchor / applications log / 2× Pomodoro / system design / CrossFit / English / reward), 10-day plan, Reference Library, Dashboard (streaks/heatmap/13 badges). Autosaved journal. shadcn + Framer. 10 Neon prep\_\* tables. Public `/now` mirror. Daily summary email (Resend) + Slack via Vercel Cron. |

---

## Content Plan

### Case Studies (PCODR format)

Each case study: **Problem → Constraints → Options Evaluated → Decision + Architecture → Result → Lessons**

| Case Study                    | Headline Metric                                        | Status |
| ----------------------------- | ------------------------------------------------------ | ------ |
| PRISM `cxt-msg-asset-service` | 150× homepage scale, +6.8% CTR, 12k msgs / 24k assets  | ✅     |
| Prism V3 UI                   | Unifies asset/request/message workflows; 6 services    | ✅     |
| Tempo V3 UI + Fastify BFF     | 38 storefronts, >92% trace propagation, 15-service BFF | ✅     |
| Tempo Service                 | ~27 TPS authoring, 38 tenants, Oracle → GCP Postgres   | ✅     |
| Tempo Runtime (Go rewrite)    | 82% memory ↓, 18× cold start ↓, 100K reads/sec/region  | ✅     |
| Tempo V2 UI                   | Versioning + diff, tenant×pageType RBAC, dynamic forms | ✅     |

**Source of truth:** project biographies under `/Users/neelesh/Downloads/project-biographies/*.md`. Rendered from a single typed data file (`lib/case-studies/data.ts`) — slug, metrics, problem, structured sections, "what I shipped" bullets, stack. Statically generated via `generateStaticParams` so each `/work/<slug>` is prerendered.

### Projects

| Project      | Type                     | Status      |
| ------------ | ------------------------ | ----------- |
| outbox-kit   | Open Source Library      | 🔨 Building |
| PR Reviewer  | AI Tool (Claude API)     | 📋 Planned  |
| Agentic RAG  | AI/ML Showpiece          | 📋 Planned  |
| Stock Picker | Product + AI Integration | 📋 Planned  |

### Blog Posts

| Post                                                     | Ties To            | Status |
| -------------------------------------------------------- | ------------------ | ------ |
| Dual-Track Deploy: Vercel + AWS from one repo            | Portfolio infra    | 📋     |
| The Transactional Outbox Pattern: how PRISM scaled 150×  | PRISM + outbox-kit | 📋     |
| W3C Trace Context across a 15-service BFF                | Tempo V3           | 📋     |
| Building a code review bot with Claude                   | PR Reviewer        | 📋     |
| Production-grade Agentic RAG: ingestion, retrieval, eval | Agentic RAG        | 📋     |
| From RAG primitive to real product: Stock Picker         | Stock Picker       | 📋     |

---

## Database Schema

```sql
-- contacts: visitor form submissions
CREATE TABLE contacts (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  message    TEXT,
  referrer   VARCHAR(500),       -- which page they came from
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**Environments:**

- Local dev → Neon `dev` branch
- Vercel Preview → Neon `dev` branch
- Vercel Production → Neon `main` branch

---

## Deployment

### Phase 1 — Vercel (Active)

- Push to `main` → Vercel auto-deploys
- PR branches → Vercel preview URLs
- Domain: `neeleshkakaraparthi.dev` via Cloudflare CNAME → `cname.vercel-dns.com`
- CI: GitHub Actions runs lint + typecheck + test + build on every PR

### Phase 2 — AWS (Planned, IaC scaffolded)

- S3 bucket + CloudFront with OAC (not legacy OAI)
- OIDC trust between GitHub Actions and AWS (no long-lived IAM keys)
- Separate caching: hashed assets cached forever, HTML revalidated
- Terraform remote state in S3 backend
- Activate after Vercel v1 is stable and tested

---

## Environment Variables

| Variable                     | Local                    | Vercel Preview       | Vercel Production                 |
| ---------------------------- | ------------------------ | -------------------- | --------------------------------- |
| `DATABASE_URL`               | Neon dev branch          | Neon dev branch      | Neon main branch                  |
| `RESEND_API_KEY`             | Resend API key           | Same                 | Same                              |
| `NEXT_PUBLIC_SITE_URL`       | `http://localhost:3000`  | _(Vercel auto-sets)_ | `https://neeleshkakaraparthi.dev` |
| `CONTACT_NOTIFICATION_EMAIL` | neelesh1206@gmail.com    | Same                 | Same                              |
| `STRAVA_CLIENT_ID`           | Strava app client ID     | Same                 | Same                              |
| `STRAVA_CLIENT_SECRET`       | Strava app secret        | Same                 | Same                              |
| `STRAVA_REFRESH_TOKEN`       | Long-lived refresh token | Same                 | Same                              |

---

## Project Structure

```
personal-website/
├── app/                    # Next.js App Router pages + API routes
│   ├── layout.tsx          # Root layout — fonts, ThemeProvider, Analytics
│   ├── page.tsx            # Home page
│   ├── work/               # Case studies
│   ├── projects/           # Side projects
│   ├── writing/            # Blog (MDX)
│   ├── life/               # Personal tab
│   ├── now/                # /now page
│   ├── resume/             # Resume PDF viewer
│   ├── connect/            # Visitor contact form
│   └── api/
│       ├── contact/        # Form handler → Neon + Resend
│       └── og/             # Dynamic OG image generation
├── components/
│   ├── layout/             # Header, Footer, ThemeProvider, ThemeToggle
│   ├── ui/                 # Primitives (Button, Card, Badge, etc.)
│   ├── connect/            # ContactForm, ResumeModal
│   ├── work/               # CaseStudyCard, CaseStudyLayout
│   ├── mdx/                # MDXComponents map
│   └── seo/                # JsonLd
├── content/
│   ├── work/               # Case study MDX files
│   ├── projects/           # Project MDX files
│   └── blog/               # Blog post MDX files
├── lib/
│   ├── db/                 # Drizzle schema, connection, queries
│   ├── email/              # Resend client + email templates
│   ├── metadata.ts         # Shared SEO metadata factory
│   └── utils.ts            # cn(), formatDate()
├── public/
│   ├── resume.pdf
│   └── images/
├── terraform/              # Phase 2 AWS IaC
├── .github/workflows/      # CI (ci.yml) + Phase 2 deploy (deploy-aws.yml)
├── tests/                  # Vitest unit + Playwright E2E
└── db/migrations/          # Drizzle migration files
```

---

## Open Items

- [x] Add LinkedIn profile URL (updated in Footer)
- [ ] **Strava setup:** Create app at strava.com/settings/api, run one-time OAuth flow, store `STRAVA_REFRESH_TOKEN` in env vars + Vercel
- [ ] Upload resume PDF to `/public/resume.pdf`
- [ ] Add headshot for About page
- [ ] Verify Resend sending domain on `neeleshkakaraparthi.dev`
- [ ] Add GitHub Actions secrets (`DATABASE_URL`, `RESEND_API_KEY`, `CONTACT_NOTIFICATION_EMAIL`)
- [ ] Wire `next-sitemap` for `/sitemap.xml`
- [ ] Set `git config --global user.name` and `user.email`

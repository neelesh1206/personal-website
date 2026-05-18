# neeleshkakaraparthi.dev

Personal portfolio of **Neelesh Kakaraparthi** — Senior Full-Stack Software Engineer with 8+ years at Walmart Global Tech.

**Live:** [neeleshkakaraparthi.dev](https://neeleshkakaraparthi.dev)

---

## What This Is

A portfolio website built to showcase enterprise-grade full-stack engineering. The site itself demonstrates the same standards used in production — TypeScript strict mode, a full CI/CD pipeline, automated testing, and dual-track deployment infrastructure. Every architectural decision is intentional and defensible.

---

## Tech Stack

| Layer      | Choice                                   | Why                                                                 |
| ---------- | ---------------------------------------- | ------------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router)                  | Latest stable; server components, streaming, built-in metadata API  |
| Language   | TypeScript — `strict: true`              | `noUncheckedIndexedAccess`, `noImplicitReturns` enabled             |
| Styling    | Tailwind CSS v4                          | Utility-first; class-based dark mode via `@custom-variant`          |
| Dark Mode  | next-themes                              | SSR-safe, no flash on load; light default                           |
| Fonts      | next/font — Inter + JetBrains Mono       | Self-hosted, zero layout shift                                      |
| Content    | MDX files in `/content`                  | Git-based CMS, no external dependency                               |
| Database   | Neon (serverless Postgres) + Drizzle ORM | TypeScript-native ORM; serverless driver fits Vercel edge           |
| Email      | Resend                                   | Resume auto-delivery and new-contact notifications                  |
| Strava API | Strava v3 (OAuth 2.0, server-side)       | Live activity dashboard on `/life` — refresh-token flow, ISR-cached |
| Forms      | React Hook Form + Zod                    | Type-safe validation, minimal re-renders                            |
| Analytics  | Vercel Analytics + Speed Insights        | Privacy-friendly, no cookie banner needed                           |
| Icons      | lucide-react                             | Tree-shakeable                                                      |
| Animations | framer-motion (selective)                | Entrance animations only; no gimmicks                               |
| Testing    | Vitest (unit) + Playwright (E2E)         | Treats own project with production rigor                            |
| Linting    | ESLint flat config + Prettier            | Enforced style from day one                                         |
| Git Hooks  | Husky + lint-staged                      | Lint + format on every commit                                       |
| CI/CD      | GitHub Actions                           | Lint → typecheck → test → build on every PR                         |
| Deployment | Vercel (Phase 1 active)                  | Auto-deploy on push to `main`, PR previews                          |
| IaC        | Terraform — AWS S3 + CloudFront + OAC    | Phase 2; scaffolded in repo, OIDC not IAM keys                      |
| Node       | v24 LTS (pinned via `.nvmrc`)            | Consistent across local, CI, and Vercel                             |

---

## Architecture Decisions

### Why Next.js App Router (not Pages Router)

App Router enables per-page metadata for SEO, server components to keep the JS bundle small, and streaming for case study pages with large MDX content. The portfolio content is semi-static — static generation fits perfectly.

### Why Neon + Drizzle (not Prisma)

Neon's serverless driver works with Vercel Edge without connection pooling overhead. Drizzle is TypeScript-native — the schema is the type, no code generation step. Migrations are plain SQL in `/db/migrations`, fully transparent.

### Why Resend (not SendGrid or Nodemailer)

React-based email template API, clean Next.js SDK. Free tier covers 3,000 emails/month. Contact form sends the resume PDF as an attachment and notifies the owner — two API calls, no queue needed at this scale.

### Why Tailwind v4 (not v3)

Native CSS cascade layers and `@theme` directive — no `tailwind.config.ts` needed. Dark mode via `@custom-variant dark` works cleanly with next-themes' class strategy.

### Why dual-track deployment (Vercel + Terraform AWS)

Vercel handles the live site with zero config. The Terraform code in `/terraform` provisions S3 + CloudFront with OAC (not legacy OAI) and GitHub Actions OIDC trust — no long-lived IAM keys. Phase 2 activates after Vercel v1 is stable.

### Why server-side Strava (not client-side fetch)

The `/life` page renders a live Strava activity dashboard — YTD distance, all-time totals, recent activities. The OAuth refresh-token flow runs entirely on the server: `STRAVA_CLIENT_SECRET` and `STRAVA_REFRESH_TOKEN` never reach the browser. Tokens are exchanged inside a Server Component, the dashboard renders with `revalidate: 3600` (ISR, hourly), and the token itself is cached for 5h (under the 6h Strava access-token TTL). Net effect: one API call per hour per region — not per visitor — and zero secrets exposed client-side. See `lib/strava/client.ts`.

### Caching strategy (Phase 2 CloudFront)

- Hashed assets (`/_next/static/*`): `max-age=31536000, immutable` — content-addressed, cached forever
- HTML: `max-age=3600` with revalidation — routing layer must stay fresh

---

## Features

- **Visitor contact form** (`/connect`) — Zod-validated, persists to Neon, auto-sends resume PDF via Resend, notifies owner.
- **Live Strava dashboard** (`/life`) — YTD run/ride/swim totals, all-time stats, recent activities. Server-side OAuth refresh-token flow, ISR-cached hourly; credentials never reach the browser. See architecture note above.
- **Six production case studies** (`/work`) — PRISM (backend + UI) and Tempo (V3 UI, Service, Runtime, V2 UI) — sourced from project biographies, rendered from a single typed data file (`lib/case-studies/data.ts`), with platform grouping, metric chips, problem/architecture/shipped sections, and prev/next nav. Statically generated via `generateStaticParams`.
- **Dark / light mode** — class-based via `next-themes`, light default, no flash on load.
- **Mobile-first responsive layout**, full a11y semantics, JSON-LD Person schema for SEO.
- **Vercel Analytics + Speed Insights** — privacy-friendly, cookieless.

---

## Visitor Contact Flow

```
User fills form on /connect
  → POST /api/contact
    → Zod validates input
    → Drizzle inserts into Neon contacts table
    → Resend sends visitor an email with resume PDF attached
    → Resend sends owner a new-contact notification
```

---

## Local Setup

```bash
git clone https://github.com/neelesh1206/personal-website.git
cd personal-website

nvm use                   # switches to Node 24 via .nvmrc
npm install

cp .env.example .env.local
# Fill in: DATABASE_URL, RESEND_API_KEY, NEXT_PUBLIC_SITE_URL, CONTACT_NOTIFICATION_EMAIL

npm run db:migrate        # creates contacts table in Neon dev branch
npm run dev               # http://localhost:3000
```

### Scripts

```bash
npm run dev           # dev server (Turbopack)
npm run build         # production build
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint
npm run format        # Prettier write
npm run format:check  # Prettier check (used in CI)
npm run test          # Vitest unit tests
npm run test:e2e      # Playwright E2E tests
npm run db:generate   # generate Drizzle migration
npm run db:migrate    # apply migrations to Neon
npm run db:studio     # Drizzle Studio GUI
```

---

## CI/CD

Every pull request runs `.github/workflows/ci.yml`:

```
Format check → ESLint → TypeScript → Vitest → Next.js build
```

Merge to `main` → Vercel auto-deploys.

Phase 2 (`.github/workflows/deploy-aws.yml`): manual trigger only until Vercel v1 is stable. Runs `terraform apply` + S3 sync + CloudFront invalidation via OIDC.

---

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout — fonts, providers, analytics
│   ├── page.tsx            # Home
│   ├── work/               # Case studies (PRISM, Tempo V3, Tango)
│   ├── projects/           # Side projects
│   ├── writing/            # MDX blog
│   ├── life/               # Personal tab
│   ├── now/                # /now page
│   ├── resume/             # Embedded PDF viewer
│   ├── connect/            # Visitor contact form
│   └── api/contact/        # Form handler → Neon + Resend
├── components/
│   ├── layout/             # Header, Footer, ThemeProvider, ThemeToggle
│   ├── ui/                 # Primitives
│   └── connect/            # ContactForm
├── content/
│   ├── work/               # Case study MDX files
│   ├── projects/           # Project MDX files
│   └── blog/               # Blog post MDX files
├── lib/
│   ├── db/                 # Drizzle schema, connection, queries
│   ├── email/              # Resend client + templates
│   ├── metadata.ts         # SEO metadata factory
│   └── utils.ts
├── terraform/              # Phase 2 AWS IaC (S3 + CloudFront + OAC)
├── .github/workflows/      # CI + Phase 2 deploy
├── db/migrations/          # Drizzle SQL migrations
└── tests/                  # Vitest unit + Playwright E2E
```

---

## Environment Variables

| Variable                     | Description                                            |
| ---------------------------- | ------------------------------------------------------ |
| `DATABASE_URL`               | Neon Postgres connection string                        |
| `RESEND_API_KEY`             | Resend API key                                         |
| `NEXT_PUBLIC_SITE_URL`       | Full site URL (e.g. `https://neeleshkakaraparthi.dev`) |
| `CONTACT_NOTIFICATION_EMAIL` | Email to notify on new contact submissions             |
| `STRAVA_CLIENT_ID`           | Strava API application Client ID                       |
| `STRAVA_CLIENT_SECRET`       | Strava API application Client Secret (server-only)     |
| `STRAVA_REFRESH_TOKEN`       | Long-lived Strava refresh token (one-time OAuth mint)  |

See `.env.example` for the template.

---

## Pages

| Page          | Route                  | Status     |
| ------------- | ---------------------- | ---------- |
| Home          | `/`                    | ✅ Live    |
| About         | `/about`               | 🔨 Planned |
| Case Studies  | `/work`                | ✅ Live    |
| PRISM Backend | `/work/prism-backend`  | ✅ Live    |
| Prism V3 UI   | `/work/prism-ui`       | ✅ Live    |
| Tempo V3 UI   | `/work/tempo-v3-ui`    | ✅ Live    |
| Tempo Service | `/work/tempo-service`  | ✅ Live    |
| Tempo Runtime | `/work/tempo-runtime`  | ✅ Live    |
| Tempo V2 UI   | `/work/tempo-v2-ui`    | ✅ Live    |
| Projects      | `/projects`            | 🔨 Planned |
| outbox-kit    | `/projects/outbox-kit` | 🔨 Planned |
| Writing       | `/writing`             | ✅ Live    |
| Life          | `/life`                | ✅ Live    |
| Now           | `/now`                 | 🔨 Planned |
| Resume        | `/resume`              | 🔨 Planned |
| Connect       | `/connect`             | 🔨 Planned |

---

_Built by Neelesh Kakaraparthi · [neeleshkakaraparthi.dev](https://neeleshkakaraparthi.dev)_

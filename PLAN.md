# Portfolio Website — Project Plan

**Owner:** Neelesh Kakaraparthi  
**Repo:** [github.com/neelesh1206/personal-website](https://github.com/neelesh1206/personal-website)  
**Live:** [neeleshkakaraparthi.dev](https://neeleshkakaraparthi.dev)  
**Goal:** Showcase enterprise-grade full-stack skills to recruiters and hiring managers targeting Staff SWE roles.

---

## Decisions Log

| Decision           | Choice                                             | Rationale                                                   |
| ------------------ | -------------------------------------------------- | ----------------------------------------------------------- |
| Framework          | Next.js 16 (App Router) from scratch               | Template fight not worth it; own every decision             |
| Language           | TypeScript strict mode                             | Non-negotiable enterprise signal                            |
| Styling            | Tailwind CSS v4 + next-themes                      | Industry standard; class-based dark mode for SSR safety     |
| Dark mode          | Light default, user-toggleable                     | Accessibility + preference                                  |
| Content            | MDX files in `/content`                            | Git-based, no CMS needed, typed with Zod later              |
| Fonts              | Inter (body) + JetBrains Mono (code) via next/font | Zero layout shift, self-hosted                              |
| Database           | Neon (serverless Postgres) + Drizzle ORM           | TypeScript-native ORM, serverless fits Vercel edge          |
| Email              | Resend                                             | Modern API, great Next.js DX, free tier sufficient          |
| Analytics          | Vercel Analytics + Speed Insights                  | Free, privacy-friendly, no cookie banner                    |
| Forms              | React Hook Form + Zod                              | Type-safe, enterprise-standard validation                   |
| Deployment Phase 1 | Vercel                                             | Zero config, PR previews, auto-deploy on push               |
| Deployment Phase 2 | Terraform AWS S3 + CloudFront + OIDC               | IaC in repo as Staff-level signal; activate after v1 stable |
| CI/CD              | GitHub Actions                                     | Lint + typecheck + test + build on every PR                 |
| Git hooks          | Husky + lint-staged                                | Enforces quality on every commit                            |
| Testing            | Vitest (unit) + Playwright (E2E)                   | Treats own project with production rigor                    |
| Icons              | lucide-react                                       | Tree-shakeable, consistent                                  |
| Animations         | framer-motion (selective)                          | Subtle entrance animations, no gimmicks                     |
| Domain             | neeleshkakaraparthi.dev (Cloudflare Registrar)     | Exact name match = strongest Google ranking signal          |
| Node version       | 24 LTS (pinned via .nvmrc)                         | Latest LTS, consistent across local + CI                    |

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

---

## Pages

### Status Key: ✅ Done · 🔨 In Progress · 📋 Planned

| Page                | Route                    | Status | Notes                                                                                                     |
| ------------------- | ------------------------ | ------ | --------------------------------------------------------------------------------------------------------- |
| Home                | `/`                      | ✅     | Hero, currently strip, featured work, projects, connect CTA                                               |
| About               | `/about`                 | 📋     | Bio, career arc, 3 things I'm known for                                                                   |
| Case Studies List   | `/work`                  | 📋     | Cards for all 3 case studies                                                                              |
| PRISM Case Study    | `/work/prism`            | 📋     | Full PCODR write-up with diagrams                                                                         |
| Tempo V3 Case Study | `/work/tempo-v3`         | 📋     | Full PCODR write-up with diagrams                                                                         |
| Tango Case Study    | `/work/tango`            | 📋     | Shorter supporting case study                                                                             |
| Projects List       | `/projects`              | 📋     | Cards for all 4 projects                                                                                  |
| outbox-kit          | `/projects/outbox-kit`   | 📋     |                                                                                                           |
| PR Reviewer         | `/projects/pr-reviewer`  | 📋     |                                                                                                           |
| Agentic RAG         | `/projects/agentic-rag`  | 📋     |                                                                                                           |
| Stock Picker        | `/projects/stock-picker` | 📋     |                                                                                                           |
| Writing List        | `/writing`               | 📋     | Blog post list                                                                                            |
| Blog Posts          | `/writing/[slug]`        | 📋     | MDX-driven                                                                                                |
| Life                | `/life`                  | 📋     | CrossFit, hiking, travel, books, sports (F1/NFL/tennis/cricket), stock market, astronomy, current affairs |
| Now                 | `/now`                   | 📋     | Monthly update: building/reading/doing                                                                    |
| Resume              | `/resume`                | 📋     | Embedded PDF + download                                                                                   |
| Connect             | `/connect`               | 📋     | Visitor form + auto resume delivery                                                                       |

---

## Content Plan

### Case Studies (PCODR format)

Each case study: **Problem → Constraints → Options Evaluated → Decision + Architecture → Result → Lessons**

| Case Study                    | Headline Metric                                     | Status |
| ----------------------------- | --------------------------------------------------- | ------ |
| PRISM `cxt-msg-asset-service` | 150× homepage scale, +6.8% CTR                      | 📋     |
| Tempo V3 UI + Fastify BFF     | 38 storefronts, >92% trace propagation              | 📋     |
| Tango — Taxonomy Management   | Sub-second editor, replaced ticket-driven workflows | 📋     |

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

| Variable                     | Local                   | Vercel Preview       | Vercel Production                 |
| ---------------------------- | ----------------------- | -------------------- | --------------------------------- |
| `DATABASE_URL`               | Neon dev branch         | Neon dev branch      | Neon main branch                  |
| `RESEND_API_KEY`             | Resend API key          | Same                 | Same                              |
| `NEXT_PUBLIC_SITE_URL`       | `http://localhost:3000` | _(Vercel auto-sets)_ | `https://neeleshkakaraparthi.dev` |
| `CONTACT_NOTIFICATION_EMAIL` | neelesh1206@gmail.com   | Same                 | Same                              |

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

- [ ] Add LinkedIn profile URL (currently placeholder in Footer)
- [ ] Upload resume PDF to `/public/resume.pdf`
- [ ] Add headshot for About page
- [ ] Verify Resend sending domain on `neeleshkakaraparthi.dev`
- [ ] Add GitHub Actions secrets (`DATABASE_URL`, `RESEND_API_KEY`, `CONTACT_NOTIFICATION_EMAIL`)
- [ ] Wire `next-sitemap` for `/sitemap.xml`
- [ ] Set `git config --global user.name` and `user.email`

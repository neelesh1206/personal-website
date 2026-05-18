@AGENTS.md

# Claude Instructions for This Project

## When to Update README + PLAN

The README is reference documentation for someone landing on the repo cold — recruiters, hiring managers, future-you on a different machine. **Document at the feature level and add operational instructions where they're needed. Skip minor diffs.**

### Update `README.md` when the commit:

- **Adds a user-facing route** → Pages table (✅ Live)
- **Adds or changes a feature** the user would notice → bullet under **Features**
- **Introduces a new architectural pattern, library, or tech-stack choice** → Tech Stack table and/or Architecture Decisions
- **Adds an API endpoint or DB table** → API Endpoints table
- **Adds an env var** → Environment Variables table
- **Adds a new operational task** ("how do I trigger X manually", "how do I rotate Y") → Manual Operations table
- **Adds a workflow or CI/CD step** → CI/CD or DB Migrations section
- **Adds an npm script** → Scripts block

### Don't update `README.md` for:

- Bug fixes that don't change behavior or surface
- UI tweaks (renaming a label, moving a button, breakpoint changes)
- Internal refactors that don't touch the documented surface
- Lint/format-only changes
- Commits that revert prior commits

If a commit doesn't touch any of the "do update" categories, that's fine — just don't silently _skip_ one that does.

### Always update `PLAN.md` when the commit:

- **Completes a planned item** → flip 📋 → ✅
- **Discovers new requirements** → add to the relevant section + Open Items

### Style rules

- **Stage README/PLAN changes in the same commit as the code change.** No "docs: update README" follow-up commits — the doc change belongs with the feature change.
- **Write for the cold reader.** Don't assume context from the PR or chat. The README is the only thing they have.
- **Concise but explicit.** A one-line "Resume PDF served at `/resume.pdf`" beats a paragraph. Numbers and code paths > prose.

## Coding Conventions

- **TypeScript strict** — no `any`, no `@ts-ignore`. Fix the type properly.
- **Tailwind v4** — dark mode via `dark:` prefix (powered by `@custom-variant dark` in globals.css). Do not add inline styles.
- **Server vs Client components** — default to Server Components. Add `'use client'` only when you need browser APIs, event handlers, or hooks.
- **Imports** — always use `@/` alias (e.g. `@/lib/utils`, `@/components/layout/Header`).
- **No comments** unless the WHY is non-obvious. Never describe what the code does.
- **cn()** — use `cn()` from `@/lib/utils` for conditional class merging, never string concatenation.

## Project Context

- **Owner:** Neelesh Kakaraparthi — Staff SWE candidate, 8+ years at Walmart
- **Goal:** Showcase enterprise-grade full-stack skills to recruiters
- **Live URL:** neeleshkakaraparthi.dev
- **Repo:** github.com/neelesh1206/personal-website
- **Node version:** 24 LTS (always run `nvm use` before any npm commands)
- **Env vars:** Never hardcode secrets. All secrets in `.env.local` (gitignored). See `.env.example`.

## Running Commands

Always prefix with nvm:

```bash
export NVM_DIR="$HOME/.nvm" && [ -s "/usr/local/opt/nvm/nvm.sh" ] && \. "/usr/local/opt/nvm/nvm.sh" && nvm use --lts && <command>
```

Or in a single shell session after sourcing nvm, just `nvm use --lts` first.

## Before Pushing

Run in order:

1. `npm run typecheck` — must pass with zero errors
2. `npm run lint` — must pass with zero errors
3. `npm run build` — must compile cleanly

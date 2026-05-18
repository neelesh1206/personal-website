@AGENTS.md

# Claude Instructions for This Project

## On Every Commit — Non-Negotiable

Before staging files for a commit, run this checklist. Don't skip steps because "the change is small" — small changes accumulate into README drift, which is what just landed me in trouble.

1. **Update `README.md`** when the commit touches any of:
   - A new user-facing route → update the **Pages** status table (✅ Live)
   - A new feature → add a bullet under **Features**
   - A new tech-stack choice or architectural pattern → row in the **Tech Stack** table and/or an **Architecture Decisions** subsection
   - A new env var → row in the **Environment Variables** table
   - A new npm script → line in the **Scripts** block
   - A new workflow → mention under **CI/CD** or **DB Migrations**
2. **Update `PLAN.md`** — mark completed items with ✅, add any new requirements discovered during implementation, update the Open Items list.

If a commit truly has no surface-area change worth documenting (e.g., a hotfix that touches a single line of internal logic), state that explicitly in the commit body — don't silently skip.

Stage README/PLAN changes in the same commit as the code change. Don't push a "docs: update README" follow-up commit; the change belongs with the change that caused it.

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

@AGENTS.md

# Claude Instructions for This Project

## On Every Commit

Before committing any code changes, always:

1. **Update `README.md`** — keep the Pages status table current (✅ Live / 🔨 Planned), reflect any new tech stack additions, and update architecture decisions if a new decision was made.

2. **Update `PLAN.md`** — mark completed items with `[x]`, add any new requirements discovered during implementation, update the Open Items list.

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

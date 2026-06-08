import quotesContent from '@/content/coding-prep-quotes.json'

export type Quote = {
  id: string
  text: string
  author: string
  role: string
  category: 'athlete' | 'philosopher' | 'scientist' | 'builder' | 'writer' | 'leader'
  tags: string[]
}

type QuotesFile = { meta: { title: string; note: string }; quotes: Quote[] }

const QUOTES: Quote[] = (quotesContent as unknown as QuotesFile).quotes

/**
 * Deterministic daily quote.
 *
 * The same `dateKey` (YYYY-MM-DD) always returns the same quote — page
 * refreshes don't reshuffle and a quote stays anchored to its day in the
 * activity feed forever.
 *
 * Theme matching: when a plan-day theme is passed, we bias the pick
 * toward quotes whose tags overlap. Inside the matching set the choice
 * is still deterministic, so refreshing on Day 3 always shows the same
 * Day 3 quote.
 */
export function getDailyQuote(
  dateKey: string,
  planDayTheme?: string,
  excludeIds?: Set<string>
): Quote {
  const themeTags = themeToTags(planDayTheme)
  const matching =
    themeTags.length > 0 ? QUOTES.filter((q) => q.tags.some((t) => themeTags.includes(t))) : QUOTES
  let pool = matching.length > 0 ? matching : QUOTES
  if (excludeIds && excludeIds.size > 0) {
    const filtered = pool.filter((q) => !excludeIds.has(q.id))
    // Only honor the exclusion if at least one candidate survives — we
    // never want to return undefined just because the user has cycled
    // through every theme-matched quote recently.
    if (filtered.length > 0) pool = filtered
  }
  const idx = hashDate(dateKey) % pool.length
  return pool[idx]!
}

function hashDate(key: string): number {
  // FNV-1a-ish 32-bit. Stable across runs / platforms.
  let h = 2166136261
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = (h * 16777619) >>> 0
  }
  return h
}

function themeToTags(theme?: string): string[] {
  if (!theme) return []
  const t = theme.toLowerCase()
  const tags: string[] = []
  if (/(intro|start|arrays?|hash|warm)/.test(t)) tags.push('consistency', 'focus')
  if (/(two pointers|sliding|stack|queue|linked)/.test(t)) tags.push('focus', 'discipline')
  if (/(tree|graph|bfs|dfs|recursion|dp|dynamic)/.test(t)) tags.push('depth', 'focus')
  if (/(heap|interval|greedy|backtrack)/.test(t)) tags.push('depth', 'discipline')
  if (/(system|design|scale|distributed|microservice)/.test(t)) tags.push('depth', 'discipline')
  if (/(review|mock|recap|simulate)/.test(t)) tags.push('failure-recovery', 'consistency')
  return tags
}

export const ALL_QUOTES = QUOTES

export function getQuoteById(id: string): Quote | null {
  return QUOTES.find((q) => q.id === id) ?? null
}

/**
 * Theme-filtered + spread candidate pool for the AI picker.
 *
 * - When a plan-day theme is provided, biases toward matching tags but
 *   pads with diverse fallbacks if the matching pool is small.
 * - Result is deterministic per dateKey so re-renders during a single
 *   day pass the same list to the model.
 * - Capped at `limit` so the prompt stays compact (~1.5–2k tokens).
 */
export function getCandidateQuotes(dateKey: string, planDayTheme?: string, limit = 18): Quote[] {
  const themeTags = themeToTags(planDayTheme)
  const matching =
    themeTags.length > 0 ? QUOTES.filter((q) => q.tags.some((t) => themeTags.includes(t))) : QUOTES
  // Spread within the matching pool by sorting on a stable per-id hash
  // seeded by today's date, then take the head. Adding `limit` distinct
  // categories first guarantees the model sees variety across athlete /
  // philosopher / scientist / builder / writer / leader even when the
  // theme-matched pool skews toward one bucket.
  const seed = hashDate(dateKey)
  const ordered = [...matching].sort(
    (a, b) => ((hashStr(a.id) ^ seed) >>> 0) - ((hashStr(b.id) ^ seed) >>> 0)
  )
  const picked: Quote[] = []
  const seenCategories = new Set<string>()
  // First pass — one per category
  for (const q of ordered) {
    if (picked.length >= limit) break
    if (seenCategories.has(q.category)) continue
    picked.push(q)
    seenCategories.add(q.category)
  }
  // Second pass — fill remaining slots
  for (const q of ordered) {
    if (picked.length >= limit) break
    if (picked.some((p) => p.id === q.id)) continue
    picked.push(q)
  }
  return picked
}

function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = (h * 16777619) >>> 0
  }
  return h
}

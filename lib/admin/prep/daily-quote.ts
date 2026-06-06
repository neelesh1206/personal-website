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
export function getDailyQuote(dateKey: string, planDayTheme?: string): Quote {
  const themeTags = themeToTags(planDayTheme)
  const matching =
    themeTags.length > 0 ? QUOTES.filter((q) => q.tags.some((t) => themeTags.includes(t))) : QUOTES
  const pool = matching.length > 0 ? matching : QUOTES
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

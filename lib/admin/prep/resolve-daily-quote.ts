import 'server-only'
import { getDailyQuote, getCandidateQuotes, getQuoteById, type Quote } from './daily-quote'
import { patchDailyLog, getDailyLog, getRecentDailyQuoteIds } from './queries'
import { pickDailyQuote } from '@/lib/hf'
import type { PrepDailyLogRow } from '@/lib/db/schema'

export type ResolvedQuote = {
  quote: Quote
  reflection: string
}

/**
 * Resolve today's morning anchor quote.
 *
 * Order of preference:
 *   1. If today's prep_daily_log row has a non-null daily_quote_id and
 *      that id still exists in the curated library, use the cached
 *      choice (deterministic for the rest of the day).
 *   2. Otherwise, when HUGGINGFACE_API_KEY is set, ask the model to
 *      pick a quote from a theme-filtered candidate pool and write a
 *      one-sentence connector grounded in yesterday's journal +
 *      today's plan focus. Cache the result on the daily log row.
 *   3. If the AI call is unavailable or returns something invalid,
 *      fall back to the deterministic date-hash picker and cache that
 *      so refreshes don't keep re-trying HF.
 *
 * The function never throws — degrades gracefully on every error path
 * because the page render depends on it.
 */
export async function resolveDailyQuote(args: {
  todayKey: string
  todayLog: PrepDailyLogRow
  planDayLabel: string | null
  planDayTheme: string | undefined
  studyStreak: number
  gymStreak: number
}): Promise<ResolvedQuote> {
  const { todayKey, todayLog, planDayLabel, planDayTheme, studyStreak, gymStreak } = args

  // 1. Cached choice from earlier today
  if (todayLog.dailyQuoteId) {
    const cached = getQuoteById(todayLog.dailyQuoteId)
    if (cached) {
      return { quote: cached, reflection: todayLog.dailyQuoteReflection ?? '' }
    }
  }

  // Recently-shown quote ids (last 20 days, strictly before today).
  // Both the AI candidate pool and the deterministic fallback consult
  // this set so the same quote doesn't surface two days in a row.
  const recentlyShown = await getRecentDailyQuoteIds(todayKey, 20)

  // 2. AI pick (best effort)
  const aiPick = await tryAIPick({
    todayKey,
    planDayLabel: planDayLabel ?? 'Free practice',
    planDayTheme,
    studyStreak,
    gymStreak,
    excludeIds: recentlyShown,
  })

  if (aiPick) {
    await persist(todayKey, aiPick.quote.id, aiPick.reflection)
    return aiPick
  }

  // 3. Deterministic fallback
  const fallback = getDailyQuote(todayKey, planDayTheme, recentlyShown)
  await persist(todayKey, fallback.id, '')
  return { quote: fallback, reflection: '' }
}

async function tryAIPick(args: {
  todayKey: string
  planDayLabel: string
  planDayTheme: string | undefined
  studyStreak: number
  gymStreak: number
  excludeIds: Set<string>
}): Promise<ResolvedQuote | null> {
  if (!process.env.HUGGINGFACE_API_KEY) return null

  // Over-fetch then drop recently-shown, then cap at 18 for prompt size.
  // If the dedupe leaves us with too few candidates (rare — only when
  // the user has cycled most of the theme-matched pool), fall back to
  // the unfiltered list for that day rather than ship an empty pool.
  const rawCandidates = getCandidateQuotes(args.todayKey, args.planDayTheme, 30)
  const filtered = rawCandidates.filter((c) => !args.excludeIds.has(c.id))
  const candidates = (filtered.length >= 6 ? filtered : rawCandidates).slice(0, 18)

  // Yesterday's journal — best signal for "what is the user wrestling with"
  const yesterdayKey = isoMinusOneDay(args.todayKey)
  const yesterdayLog = await getDailyLog(yesterdayKey).catch(() => null)
  const yesterday = yesterdayLog
    ? {
        finished: yesterdayLog.journalFinished,
        avoided: yesterdayLog.journalAvoided,
        win: yesterdayLog.journalWin,
        deviation: yesterdayLog.journalDeviation,
        mood: yesterdayLog.mood ?? null,
      }
    : null

  try {
    const pick = await pickDailyQuote({
      candidates: candidates.map((c) => ({
        id: c.id,
        text: c.text,
        author: c.author,
        tags: c.tags,
      })),
      planDayLabel: args.planDayLabel,
      studyStreak: args.studyStreak,
      gymStreak: args.gymStreak,
      yesterday,
    })
    if (!pick) return null

    const quote = getQuoteById(pick.quoteId)
    if (!quote) return null // already guarded inside pickDailyQuote but defensive
    return { quote, reflection: pick.reflection }
  } catch (err) {
    console.error('resolveDailyQuote AI pick threw', err)
    return null
  }
}

async function persist(date: string, quoteId: string, reflection: string): Promise<void> {
  try {
    await patchDailyLog(date, { dailyQuoteId: quoteId, dailyQuoteReflection: reflection })
  } catch (err) {
    console.error('resolveDailyQuote persist failed', err)
  }
}

function isoMinusOneDay(key: string): string {
  const [y, m, d] = key.split('-').map((s) => Number.parseInt(s, 10))
  const dt = new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1))
  dt.setUTCDate(dt.getUTCDate() - 1)
  return dt.toISOString().slice(0, 10)
}

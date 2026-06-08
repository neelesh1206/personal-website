import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { skipTodayDailyQuote, todayKey } from '@/lib/admin/prep/queries'

export const runtime = 'nodejs'

/**
 * Clear today's cached quote choice so the next page render re-runs
 * resolveDailyQuote() — which now dedupes against the last 20 days.
 * Used by the manual "↻" refresh button on DailyQuoteCard when the
 * caller doesn't like today's pick.
 */
export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await skipTodayDailyQuote(todayKey())
  return NextResponse.json({ ok: true })
}

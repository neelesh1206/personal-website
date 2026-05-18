import 'server-only'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { pageViews, type NewPageView } from '@/lib/db/schema'

export async function recordPageView(view: NewPageView): Promise<void> {
  try {
    await db.insert(pageViews).values(view).onConflictDoNothing()
  } catch (err) {
    // Never let analytics break a page render.
    console.error('recordPageView failed:', err)
  }
}

export type SiteStats = {
  totalVisitors: number
  totalViews: number
  visitorsToday: number
}

export async function getSiteStats(): Promise<SiteStats> {
  try {
    const result = await db.execute<{
      total_visitors: number
      total_views: number
      visitors_today: number
    }>(sql`
      SELECT
        (SELECT COUNT(DISTINCT visitor_hash)::int FROM page_views) AS total_visitors,
        (SELECT COUNT(*)::int FROM page_views) AS total_views,
        (SELECT COUNT(DISTINCT visitor_hash)::int FROM page_views WHERE view_date = CURRENT_DATE) AS visitors_today
    `)
    const row = result.rows[0]
    return {
      totalVisitors: row?.total_visitors ?? 0,
      totalViews: row?.total_views ?? 0,
      visitorsToday: row?.visitors_today ?? 0,
    }
  } catch (err) {
    console.error('getSiteStats failed:', err)
    return { totalVisitors: 0, totalViews: 0, visitorsToday: 0 }
  }
}

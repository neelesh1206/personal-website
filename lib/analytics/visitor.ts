import 'server-only'
import { createHash } from 'node:crypto'

/**
 * Produce a daily-rotating, non-reversible visitor identifier.
 *
 * Inputs: IP + User-Agent + a daily salt.
 * Output: 64-char hex SHA-256 digest.
 *
 * Why this shape:
 * - No cookies, no localStorage, no PII stored.
 * - Hash resets at UTC midnight (salt changes), so we never have a stable
 *   long-term identifier — only "is this the same visitor today, yes/no".
 * - SHA-256 is a one-way function; the hash cannot be reversed to recover IP.
 */
export function hashVisitor(ip: string, userAgent: string): string {
  const day = new Date().toISOString().slice(0, 10) // YYYY-MM-DD (UTC)
  const salt = process.env.ANALYTICS_SALT ?? 'nk-default-salt-please-override-in-prod'
  return createHash('sha256').update(`${ip}|${userAgent}|${day}|${salt}`).digest('hex')
}

const BOT_PATTERNS = [
  /bot/i,
  /crawl/i,
  /spider/i,
  /slurp/i,
  /facebookexternalhit/i,
  /headlesschrome/i,
  /lighthouse/i,
  /pingdom/i,
  /uptimerobot/i,
  /pagespeed/i,
  /chrome-lighthouse/i,
  /search\.google/i,
]

export function isBotUserAgent(ua: string | null | undefined): boolean {
  if (!ua) return true
  return BOT_PATTERNS.some((re) => re.test(ua))
}

export function clientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  return headers.get('x-real-ip') ?? '0.0.0.0'
}

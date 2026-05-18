import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { hashVisitor, isBotUserAgent, clientIp } from '@/lib/analytics/visitor'

describe('hashVisitor', () => {
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-18T12:00:00Z'))
  })
  afterAll(() => vi.useRealTimers())

  it('returns a 64-char hex SHA-256 digest', () => {
    const hash = hashVisitor('1.2.3.4', 'Mozilla/5.0')
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('is deterministic for the same inputs on the same UTC day', () => {
    const a = hashVisitor('1.2.3.4', 'Mozilla/5.0')
    const b = hashVisitor('1.2.3.4', 'Mozilla/5.0')
    expect(a).toBe(b)
  })

  it('changes when the IP changes', () => {
    const a = hashVisitor('1.2.3.4', 'Mozilla/5.0')
    const b = hashVisitor('1.2.3.5', 'Mozilla/5.0')
    expect(a).not.toBe(b)
  })

  it('changes when the User-Agent changes', () => {
    const a = hashVisitor('1.2.3.4', 'Mozilla/5.0 A')
    const b = hashVisitor('1.2.3.4', 'Mozilla/5.0 B')
    expect(a).not.toBe(b)
  })

  it('rotates when the UTC day rolls over', () => {
    const day1 = hashVisitor('1.2.3.4', 'Mozilla/5.0')
    vi.setSystemTime(new Date('2026-05-19T00:00:01Z'))
    const day2 = hashVisitor('1.2.3.4', 'Mozilla/5.0')
    expect(day1).not.toBe(day2)
    vi.setSystemTime(new Date('2026-05-18T12:00:00Z')) // restore for other tests
  })
})

describe('isBotUserAgent', () => {
  it('returns true for null / undefined / empty', () => {
    expect(isBotUserAgent(null)).toBe(true)
    expect(isBotUserAgent(undefined)).toBe(true)
    expect(isBotUserAgent('')).toBe(true)
  })

  it.each([
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    'facebookexternalhit/1.1',
    'Mozilla/5.0 (Linux; Android 7.0;) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) Chrome-Lighthouse',
    'Pingdom.com_bot_version_1.4',
    'UptimeRobot/2.0',
    'PageSpeed Insights',
  ])('flags bot UA: %s', (ua) => {
    expect(isBotUserAgent(ua)).toBe(true)
  })

  it.each([
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/120.0',
  ])('does not flag human UA: %s', (ua) => {
    expect(isBotUserAgent(ua)).toBe(false)
  })
})

describe('clientIp', () => {
  function headers(init: Record<string, string>): Headers {
    return new Headers(init)
  }

  it('returns the first IP from x-forwarded-for', () => {
    const h = headers({ 'x-forwarded-for': '203.0.113.5, 70.41.3.18, 150.172.238.178' })
    expect(clientIp(h)).toBe('203.0.113.5')
  })

  it('trims whitespace around the first IP', () => {
    const h = headers({ 'x-forwarded-for': '  203.0.113.5  , 70.41.3.18' })
    expect(clientIp(h)).toBe('203.0.113.5')
  })

  it('falls back to x-real-ip when XFF is absent', () => {
    const h = headers({ 'x-real-ip': '198.51.100.42' })
    expect(clientIp(h)).toBe('198.51.100.42')
  })

  it('returns 0.0.0.0 when nothing is set', () => {
    const h = headers({})
    expect(clientIp(h)).toBe('0.0.0.0')
  })
})

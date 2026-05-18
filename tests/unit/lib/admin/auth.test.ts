import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const ORIGINAL_PASSWORD = process.env.ADMIN_PASSWORD

beforeEach(() => {
  process.env.ADMIN_PASSWORD = 'test-admin-password-1234'
  vi.resetModules()
})

afterEach(() => {
  if (ORIGINAL_PASSWORD === undefined) {
    delete process.env.ADMIN_PASSWORD
  } else {
    process.env.ADMIN_PASSWORD = ORIGINAL_PASSWORD
  }
})

async function loadAuth() {
  return await import('@/lib/admin/auth')
}

describe('buildSessionToken / verifySessionToken', () => {
  it('produces a token that verifies against the same secret', async () => {
    const { buildSessionToken, verifySessionToken } = await loadAuth()
    const { token, expiresAt } = buildSessionToken()
    expect(typeof token).toBe('string')
    expect(token).toContain('.')
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now())
    expect(verifySessionToken(token)).toBe(true)
  })

  it('rejects undefined / empty / malformed tokens', async () => {
    const { verifySessionToken } = await loadAuth()
    expect(verifySessionToken(undefined)).toBe(false)
    expect(verifySessionToken('')).toBe(false)
    expect(verifySessionToken('no-dot-here')).toBe(false)
    expect(verifySessionToken('admin:123.abc')).toBe(false)
  })

  it('rejects a token whose signature does not match the secret', async () => {
    const { buildSessionToken, verifySessionToken } = await loadAuth()
    const { token } = buildSessionToken()
    // Tamper with the last character of the signature
    const tampered = token.slice(0, -1) + (token.slice(-1) === 'a' ? 'b' : 'a')
    expect(verifySessionToken(tampered)).toBe(false)
  })

  it('rejects an expired token', async () => {
    vi.useFakeTimers()
    const { buildSessionToken, verifySessionToken } = await loadAuth()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const { token } = buildSessionToken()
    // Jump 30 days ahead — past the 7-day TTL
    vi.setSystemTime(new Date('2026-01-31T00:00:00Z'))
    expect(verifySessionToken(token)).toBe(false)
    vi.useRealTimers()
  })

  it('rejects when the wrong secret is configured', async () => {
    const { buildSessionToken } = await loadAuth()
    const { token } = buildSessionToken()
    // Reconfigure with a different password and reload the module
    process.env.ADMIN_PASSWORD = 'different-password-99'
    vi.resetModules()
    const { verifySessionToken } = await loadAuth()
    expect(verifySessionToken(token)).toBe(false)
  })

  it('throws on build when ADMIN_PASSWORD is missing or too short', async () => {
    process.env.ADMIN_PASSWORD = 'tooShort'
    vi.resetModules()
    const { buildSessionToken } = await loadAuth()
    expect(() => buildSessionToken()).toThrow(/12 chars/)
  })

  it('verifySessionToken returns false instead of throwing when secret is missing', async () => {
    delete process.env.ADMIN_PASSWORD
    vi.resetModules()
    const { verifySessionToken } = await loadAuth()
    expect(verifySessionToken('admin:999.aaaa')).toBe(false)
  })
})

describe('verifyPassword', () => {
  it('returns true for the configured password', async () => {
    const { verifyPassword } = await loadAuth()
    expect(verifyPassword('test-admin-password-1234')).toBe(true)
  })

  it('returns false for a wrong password', async () => {
    const { verifyPassword } = await loadAuth()
    expect(verifyPassword('wrong')).toBe(false)
    expect(verifyPassword('')).toBe(false)
  })

  it('returns false instead of throwing when secret is missing', async () => {
    delete process.env.ADMIN_PASSWORD
    vi.resetModules()
    const { verifyPassword } = await loadAuth()
    expect(verifyPassword('anything')).toBe(false)
  })
})

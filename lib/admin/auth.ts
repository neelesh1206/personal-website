import 'server-only'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'node:crypto'

const COOKIE_NAME = 'admin_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

function getSecret(): string {
  const secret = process.env.ADMIN_PASSWORD
  if (!secret || secret.length < 12) {
    throw new Error('ADMIN_PASSWORD must be set and at least 12 chars')
  }
  return secret
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export function buildSessionToken(): { token: string; expiresAt: Date } {
  const secret = getSecret()
  const expiresAt = new Date(Date.now() + MAX_AGE_SECONDS * 1000)
  const payload = `admin:${expiresAt.getTime()}`
  const sig = sign(payload, secret)
  return { token: `${payload}.${sig}`, expiresAt }
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false
  const lastDot = token.lastIndexOf('.')
  if (lastDot < 0) return false
  const payload = token.slice(0, lastDot)
  const sig = token.slice(lastDot + 1)

  let secret: string
  try {
    secret = getSecret()
  } catch {
    return false
  }

  const expected = sign(payload, secret)
  if (!safeEqual(sig, expected)) return false

  const [prefix, expiresStr] = payload.split(':')
  if (prefix !== 'admin' || !expiresStr) return false
  const expiresAt = Number(expiresStr)
  return Number.isFinite(expiresAt) && expiresAt > Date.now()
}

export function verifyPassword(input: string): boolean {
  let secret: string
  try {
    secret = getSecret()
  } catch {
    return false
  }
  return safeEqual(input, secret)
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const jar = await cookies()
  return verifySessionToken(jar.get(COOKIE_NAME)?.value)
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME
export const ADMIN_COOKIE_MAX_AGE = MAX_AGE_SECONDS

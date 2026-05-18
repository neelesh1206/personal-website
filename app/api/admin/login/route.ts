import { NextResponse, type NextRequest } from 'next/server'
import {
  ADMIN_COOKIE_MAX_AGE,
  ADMIN_COOKIE_NAME,
  buildSessionToken,
  verifyPassword,
} from '@/lib/admin/auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const password = String(form.get('password') ?? '')
  if (!verifyPassword(password)) {
    const url = new URL('/admin/login?error=1', req.url)
    return NextResponse.redirect(url, { status: 303 })
  }

  const { token } = buildSessionToken()
  const res = NextResponse.redirect(new URL('/admin', req.url), { status: 303 })
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_COOKIE_MAX_AGE,
  })
  return res
}

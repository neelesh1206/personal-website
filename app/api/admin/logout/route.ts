import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_COOKIE_NAME } from '@/lib/admin/auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/admin/login', req.url), { status: 303 })
  res.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
  return res
}

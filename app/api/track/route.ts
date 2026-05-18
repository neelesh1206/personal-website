import { NextResponse, type NextRequest } from 'next/server'
import { recordPageView } from '@/lib/analytics/queries'
import { clientIp, hashVisitor, isBotUserAgent } from '@/lib/analytics/visitor'

export const runtime = 'nodejs'

const SKIP_PATH_PREFIXES = ['/api', '/admin', '/_next', '/sitemap', '/robots']

function sanitizePath(input: unknown): string | null {
  if (typeof input !== 'string') return null
  if (!input.startsWith('/')) return null
  if (input.length > 500) return null
  // Strip query and fragment.
  return input.split('?')[0]!.split('#')[0]!
}

export async function POST(req: NextRequest) {
  let body: { path?: unknown; referrer?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const path = sanitizePath(body.path)
  if (!path) return NextResponse.json({ ok: false }, { status: 400 })
  if (SKIP_PATH_PREFIXES.some((p) => path.startsWith(p))) {
    return NextResponse.json({ ok: true, skipped: 'path' })
  }

  const ua = req.headers.get('user-agent')
  if (isBotUserAgent(ua)) {
    return NextResponse.json({ ok: true, skipped: 'bot' })
  }

  const ip = clientIp(req.headers)
  const visitorHash = hashVisitor(ip, ua ?? '')
  const country = req.headers.get('x-vercel-ip-country')
  const referrerRaw = typeof body.referrer === 'string' ? body.referrer : null
  const referrer =
    referrerRaw && referrerRaw.length <= 500 && referrerRaw.length > 0 ? referrerRaw : null

  await recordPageView({
    path,
    visitorHash,
    country: country && country.length === 2 ? country : null,
    referrer,
  })

  return NextResponse.json({ ok: true })
}

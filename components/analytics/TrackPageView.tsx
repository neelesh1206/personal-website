'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Client-side beacon that fires once per pathname change.
 *
 * Why client-side instead of middleware:
 * - Keeps Server Components fully static (no DB write blocks the render).
 * - Naturally filters out Server-Component RSC prefetches and other
 *   non-human navigations — only real browser page transitions fire useEffect.
 * - Server route does the actual dedupe + bot filtering, so this stays dumb.
 */
export function TrackPageView() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    const referrer = typeof document !== 'undefined' ? document.referrer : ''
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, referrer }),
      keepalive: true,
    }).catch(() => {
      // Analytics must never break the page.
    })
  }, [pathname])

  return null
}

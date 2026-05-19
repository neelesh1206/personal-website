'use client'

import { useEffect, useState } from 'react'

/**
 * Formats an ISO timestamp in the visitor's local timezone.
 *
 * Why a client component:
 * - Vercel servers render in UTC. Formatting server-side ships a fixed
 *   string to every visitor regardless of their location ("May 19, 3:46 AM"
 *   for a Pacific-evening fetch), which reads as tomorrow to most viewers.
 * - Formatting on the client uses the visitor's own Intl locale + TZ.
 * - SSR renders the UTC string as a fallback so the first paint isn't blank;
 *   the client re-renders with local time on hydration.
 */
export function FetchedAt({ iso }: { iso: string }) {
  const utcInitial = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(iso))
  const [text, setText] = useState(utcInitial + ' UTC')

  useEffect(() => {
    const local = new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
    // eslint-disable-next-line react-hooks/set-state-in-effect -- canonical post-hydration locale swap; runs once per iso change.
    setText(local)
  }, [iso])

  return <time dateTime={iso}>{text}</time>
}

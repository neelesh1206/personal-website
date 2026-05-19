'use client'

import { useEffect, useState } from 'react'

/**
 * Renders the current year in the visitor's local timezone.
 *
 * Why a client component:
 * - `new Date().getFullYear()` on a server is the server's TZ year (UTC on
 *   Vercel). Between ~4 PM Pacific Dec 31 and Pacific midnight, Vercel ships
 *   the next year's value to every visitor.
 * - Hydration swaps the SSR fallback (set to `serverYear`) with the visitor's
 *   local year. Both will match 99.99% of the time; the swap only flips for
 *   visitors loading the site during the UTC↔local year transition.
 */
export function CurrentYear({ serverYear }: { serverYear: number }) {
  const [year, setYear] = useState(serverYear)
  useEffect(() => {
    const local = new Date().getFullYear()
    if (local !== year) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- canonical post-hydration locale swap; only flips during the brief Dec 31 boundary.
      setYear(local)
    }
  }, [year])
  return <>{year}</>
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/admin', label: 'Submissions' },
  { href: '/admin/coding-prep', label: 'Coding Prep' },
  { href: '/admin/interview-prep', label: 'Interview Prep' },
]

export function AdminNav() {
  const pathname = usePathname()
  if (pathname === '/admin/login') return null

  return (
    <header className="sticky top-16 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <nav className="-mx-1 flex items-center gap-1 overflow-x-auto px-1">
          {TABS.map((t) => {
            const active = t.href === '/admin' ? pathname === '/admin' : pathname.startsWith(t.href)
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
                )}
              >
                {t.label}
              </Link>
            )
          })}
        </nav>
        <form action="/api/admin/logout" method="POST">
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-zinc-50"
          >
            <LogOut size={12} /> Sign out
          </button>
        </form>
      </div>
    </header>
  )
}

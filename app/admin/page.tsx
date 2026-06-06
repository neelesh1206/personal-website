import { redirect } from 'next/navigation'
import { Mail } from 'lucide-react'
import { getAllContacts } from '@/lib/db/queries'
import { isAdminAuthenticated } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin/login')

  const contacts = (await getAllContacts()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )

  // Bucket by day for the activity strip
  const byDay = new Map<string, number>()
  for (const c of contacts) {
    const key = c.createdAt.toISOString().slice(0, 10)
    byDay.set(key, (byDay.get(key) ?? 0) + 1)
  }
  const days = Array.from(byDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-30)
  const maxCount = days.reduce((m, [, n]) => Math.max(m, n), 1)

  // eslint-disable-next-line react-hooks/purity -- server-rendered: per-request `now` is intentional
  const now = Date.now()
  const last30Days = contacts.filter(
    (c) => now - c.createdAt.getTime() < 30 * 24 * 60 * 60 * 1000
  ).length
  const last7Days = contacts.filter(
    (c) => now - c.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000
  ).length

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Admin</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Contact submissions
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          Form submissions from <code>/connect</code>. For page-view analytics (visitors, referrers,
          devices, Core Web Vitals), see the{' '}
          <a
            href="https://vercel.com/neelesh1206s-projects/personal-website/analytics"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Vercel Analytics dashboard
          </a>
          .
        </p>
      </header>

      <section className="mb-8 grid grid-cols-3 gap-3">
        <Stat label="All time" value={contacts.length} />
        <Stat label="Last 30 days" value={last30Days} />
        <Stat label="Last 7 days" value={last7Days} />
      </section>

      {days.length > 0 ? (
        <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Last {days.length} days
          </h2>
          <div className="mt-3 flex h-24 items-end gap-1">
            {days.map(([day, count]) => (
              <div
                key={day}
                className="group relative flex-1"
                title={`${day}: ${count} contact${count === 1 ? '' : 's'}`}
              >
                <div
                  className="w-full rounded-t bg-indigo-500/80 transition-colors group-hover:bg-indigo-500 dark:bg-indigo-500/70"
                  style={{ height: `${(count / maxCount) * 100}%` }}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Submissions ({contacts.length})
        </h2>
        {contacts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            No contact submissions yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 hidden md:table-cell">Referrer</th>
                  <th className="px-4 py-3">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {contacts.map((c) => (
                  <tr key={c.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-zinc-500 dark:text-zinc-400">
                      {c.createdAt.toISOString().replace('T', ' ').slice(0, 16)}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                      {c.name}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`mailto:${c.email}`}
                        className="inline-flex items-center gap-1 text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        <Mail size={12} /> {c.email}
                      </a>
                    </td>
                    <td className="hidden max-w-[200px] truncate px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400 md:table-cell">
                      {c.referrer ?? '—'}
                    </td>
                    <td className="max-w-[420px] whitespace-pre-wrap px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {c.message ?? <span className="text-zinc-400 dark:text-zinc-500">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value.toLocaleString()}
      </div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
    </div>
  )
}

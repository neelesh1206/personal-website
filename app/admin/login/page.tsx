import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  if (await isAdminAuthenticated()) redirect('/admin')
  const { error } = await searchParams

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Admin
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Visitor analytics for{' '}
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          neeleshkakaraparthi.dev
        </span>
        . Owner only.
      </p>

      <form
        action="/api/admin/login"
        method="POST"
        className="mt-8 space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Password
          </span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            autoFocus
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-indigo-600 dark:focus:ring-indigo-900/50"
          />
        </label>

        {error ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
            Incorrect password.
          </p>
        ) : null}

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
        >
          Sign in
        </button>
      </form>
    </main>
  )
}

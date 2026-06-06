import { redirect } from 'next/navigation'
import { CodingPrepClient } from '@/components/admin/coding-prep/CodingPrepClient'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { getCompletedTaskIds, getNotesByDay } from '@/lib/admin/prep/queries'
import type { Library, Plan } from '@/lib/admin/prep/types'
import planJson from '@/content/coding-prep-plan.json'
import libraryJson from '@/content/coding-prep-library.json'

export const dynamic = 'force-dynamic'

export default async function CodingPrepPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin/login')

  const [completed, notesByDay] = await Promise.all([getCompletedTaskIds(), getNotesByDay()])

  const plan = planJson as unknown as Plan
  const library = libraryJson as unknown as Library

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Admin</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Coding & System Design Prep
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          {plan.meta.subtitle}
        </p>
      </header>

      <CodingPrepClient
        plan={plan}
        library={library}
        initialCompleted={Array.from(completed)}
        initialNotes={notesByDay}
      />
    </main>
  )
}

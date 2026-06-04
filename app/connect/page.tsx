import { headers } from 'next/headers'
import { Mail, MapPin } from 'lucide-react'
import { ContactForm } from '@/components/connect/ContactForm'
import { createMetadata } from '@/lib/metadata'

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

export const metadata = createMetadata({
  title: 'Connect',
  description:
    'Leave your email and I will send you my resume directly. Open to Senior Software Engineer roles in Seattle and the Bay Area.',
})

export default async function ConnectPage() {
  const h = await headers()
  const referrer = h.get('referer') ?? undefined

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <header className="mb-10">
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Connect</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Let&apos;s talk.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          Leave your email and I&apos;ll send you my resume right away. Roles, system design
          questions, or anything you read on the site — all welcome.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <section
          aria-labelledby="contact-form-heading"
          className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <h2 id="contact-form-heading" className="sr-only">
            Contact form
          </h2>
          <ContactForm referrer={referrer} />
        </section>

        <aside className="space-y-5 text-sm">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/30">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Direct
            </h3>
            <ul className="mt-3 space-y-2 text-zinc-700 dark:text-zinc-300">
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-indigo-500" />
                <a
                  href="mailto:neelesh1206@gmail.com"
                  className="hover:text-zinc-900 dark:hover:text-zinc-50"
                >
                  neelesh1206@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-indigo-500">
                  <LinkedInIcon />
                </span>
                <a
                  href="https://www.linkedin.com/in/neelesh-kakaraparthi-161b8554/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-zinc-900 dark:hover:text-zinc-50"
                >
                  linkedin.com/in/neelesh-kakaraparthi
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-indigo-500">
                  <GitHubIcon />
                </span>
                <a
                  href="https://github.com/neelesh1206"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-zinc-900 dark:hover:text-zinc-50"
                >
                  github.com/neelesh1206
                </a>
              </li>
              <li className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                <MapPin size={14} />
                Redmond, WA · Open to Seattle &amp; Bay Area
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              What happens next
            </h3>
            <ol className="mt-3 space-y-1.5 text-sm">
              <li>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">1.</span> Your details
                save to my contacts list.
              </li>
              <li>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">2.</span> My resume
                lands in your inbox seconds later.
              </li>
              <li>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">3.</span> I follow up
                personally within 24 hours.
              </li>
            </ol>
          </div>
        </aside>
      </div>
    </main>
  )
}

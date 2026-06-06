import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Instrument_Serif } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { TrackPageView } from '@/components/analytics/TrackPageView'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { defaultMetadata } from '@/lib/metadata'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  // 'optional' = fallback font wins the initial paint; Inter applies on the
  // next navigation if it isn't ready in ~100ms. Best LCP outcome on slow
  // networks (Lighthouse measures LCP at first paint). Trade-off is a brief
  // fallback-font visible on the very first cold visit only.
  display: 'optional',
  // Restrict to weights actually used in the UI: regular (400) for body,
  // medium (500) for buttons/labels, semibold (600) for stat values,
  // bold (700) for headings. Skip the long tail to shrink the font payload.
  weight: ['400', '500', '600', '700'],
  preload: true,
})

// Display serif used for big headlines, the daily quote card, and the
// italicised "rule" callouts inside routine blocks. Only one weight
// (400) ships in italic + roman — keep the payload tiny.
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
  preload: true,
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  weight: ['400', '500'],
  // Mono is only used inside <code> blocks on internal pages, never above
  // the fold on home — don't compete with Inter for preload priority.
  preload: false,
})

export const metadata: Metadata = defaultMetadata

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <ThemeProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
        <TrackPageView />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}

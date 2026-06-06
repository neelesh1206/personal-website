'use client'

import { GraduationCap, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import tracksContent from '@/content/tracks.json'

type Track = {
  id: string
  name: string
  shortName: string
  status: 'active' | 'coming-soon' | 'archived'
  tagline: string
  planContentPath: string | null
  iconName: string
  comingNote?: string
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap,
  Sparkles,
}

export function ComingNextCard() {
  const tracks = (tracksContent as { tracks: Track[] }).tracks
  const next = tracks.find((t) => t.status === 'coming-soon')
  if (!next) return null
  const Icon = ICONS[next.iconName] ?? Sparkles

  return (
    <Card className="border-zinc-200 bg-gradient-to-br from-violet-50/50 to-fuchsia-50/40 dark:border-zinc-800 dark:from-violet-950/20 dark:to-fuchsia-950/20">
      <CardContent className="flex items-start gap-3 py-5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
              Coming next
            </p>
            <span className="rounded-full bg-violet-100 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider text-violet-800 dark:bg-violet-950/60 dark:text-violet-300">
              Track 2
            </span>
          </div>
          <p
            className="mt-1 text-xl text-zinc-900 dark:text-zinc-50"
            style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
          >
            {next.name}
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{next.tagline}</p>
          {next.comingNote ? (
            <p className="mt-2 text-xs italic text-zinc-500 dark:text-zinc-400">
              {next.comingNote}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

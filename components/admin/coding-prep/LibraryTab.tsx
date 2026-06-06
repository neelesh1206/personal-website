'use client'

import { useEffect, useMemo, useState } from 'react'
import { BookOpen, ChevronDown, ChevronRight, Layers, Search } from 'lucide-react'
import type { Library, LibraryItem, LibraryTopic } from '@/lib/admin/prep/types'
import { cn } from '@/lib/utils'
import { FlashcardsHome } from './flashcards/FlashcardsHome'

type LibraryMode = 'read' | 'flashcards'

export function LibraryTab({
  library,
  sessionSize = 15,
  onXp,
}: {
  library: Library
  sessionSize?: number
  onXp?: (xp: number, levelUp: string | null) => void
}) {
  const [mode, setMode] = useState<LibraryMode>('read')
  const [dueCount, setDueCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/admin/prep/flashcards/due-count')
        if (!res.ok) return
        const json = (await res.json()) as { due: number }
        if (!cancelled) setDueCount(json.due)
      } catch {
        // ignored
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mode])

  const [query, setQuery] = useState('')
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())
  const [showRapidFire, setShowRapidFire] = useState(false)
  const [showRules, setShowRules] = useState(false)

  const normalized = query.trim().toLowerCase()
  const filtered = useMemo(() => filterLibrary(library.topics, normalized), [library, normalized])

  // Auto-open all matches when searching.
  const effectiveOpen = useMemo(() => {
    if (!normalized) return openItems
    const s = new Set<string>()
    for (const t of filtered) for (const i of t.items) s.add(i.id)
    return s
  }, [normalized, filtered, openItems])

  function toggleItem(id: string) {
    setOpenItems((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-zinc-200 bg-white px-2 py-2 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex w-full gap-1 sm:w-auto">
          <ModeTab
            active={mode === 'read'}
            onClick={() => setMode('read')}
            label="Read"
            icon={<BookOpen className="h-4 w-4" />}
          />
          <ModeTab
            active={mode === 'flashcards'}
            onClick={() => setMode('flashcards')}
            label="Flashcards"
            icon={<Layers className="h-4 w-4" />}
            counter={dueCount}
          />
        </div>
      </div>

      {mode === 'flashcards' ? (
        <FlashcardsHome
          library={library}
          sessionSize={sessionSize}
          onXp={(xp, lvl) => onXp?.(xp, lvl)}
        />
      ) : (
        <ReadingMode />
      )}
    </div>
  )

  function ReadingMode() {
    return (
      <div className="space-y-4">
        {/* Delivery rules / Rapid-fire as foldable reference */}
        <FoldableCard
          open={showRules}
          onToggle={() => setShowRules((v) => !v)}
          title="Delivery rules (read first, every time)"
          subtitle="Your rambling fix: structure, headline-first, pause before answering."
        >
          <ol className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {library.deliveryRules.map((r, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-semibold text-zinc-400 dark:text-zinc-500">{i + 1}.</span>
                <span>{r}</span>
              </li>
            ))}
          </ol>
        </FoldableCard>

        <FoldableCard
          open={showRapidFire}
          onToggle={() => setShowRapidFire((v) => !v)}
          title="Rapid-fire trivia — know these cold"
          subtitle="Fire any one in under 3 seconds. These are your sentinels for credibility."
        >
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Versions
              </p>
              <ul className="mt-2 divide-y divide-zinc-100 text-sm dark:divide-zinc-900">
                {library.rapidFire.versions.map((v) => (
                  <li
                    key={`${v.tool}-${v.version}-${v.where}`}
                    className="grid grid-cols-[120px_80px_1fr] gap-2 py-1.5"
                  >
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">{v.tool}</span>
                    <span className="font-mono tabular-nums text-zinc-700 dark:text-zinc-300">
                      {v.version}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{v.where}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Headline numbers
              </p>
              <ul className="mt-2 divide-y divide-zinc-100 text-sm dark:divide-zinc-900">
                {library.rapidFire.numbers.map((n) => (
                  <li key={n.label} className="grid grid-cols-[1fr_auto] gap-2 py-1.5">
                    <span className="text-zinc-600 dark:text-zinc-400">{n.label}</span>
                    <span className="font-mono text-right tabular-nums text-zinc-900 dark:text-zinc-50">
                      {n.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </FoldableCard>

        {/* Search */}
        <div className="sticky top-[7.5rem] z-30 -mx-4 bg-white px-4 py-2 sm:-mx-6 sm:px-6 dark:bg-zinc-950">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the library — question, answer, topic, project…"
              className="block w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-indigo-600 dark:focus:ring-indigo-900/50"
              aria-label="Search library"
            />
          </div>
          {normalized ? (
            <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              {filtered.reduce((n, t) => n + t.items.length, 0)} match
              {filtered.reduce((n, t) => n + t.items.length, 0) === 1 ? '' : 'es'} in{' '}
              {filtered.length} topic{filtered.length === 1 ? '' : 's'}
            </p>
          ) : null}
        </div>

        {/* Topics */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              No matches for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filtered.map((topic) => (
              <TopicSection
                key={topic.id}
                topic={topic}
                openItems={effectiveOpen}
                onToggleItem={toggleItem}
              />
            ))
          )}
        </div>
      </div>
    )
  }
}

function ModeTab({
  active,
  onClick,
  label,
  icon,
  counter,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon: React.ReactNode
  counter?: number | null
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors sm:flex-initial',
        active
          ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm dark:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-200'
          : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
      )}
      aria-pressed={active}
    >
      {icon}
      <span>{label}</span>
      {typeof counter === 'number' && counter > 0 ? (
        <span
          className={cn(
            'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
            active
              ? 'bg-indigo-600 text-white'
              : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
          )}
        >
          {counter}
        </span>
      ) : null}
    </button>
  )
}

function TopicSection({
  topic,
  openItems,
  onToggleItem,
}: {
  topic: LibraryTopic
  openItems: Set<string>
  onToggleItem: (id: string) => void
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-100 px-5 py-3 dark:border-zinc-900">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{topic.name}</h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{topic.anchor}</p>
      </div>
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
        {topic.items.map((item) => (
          <li key={item.id}>
            <QAItem
              item={item}
              open={openItems.has(item.id)}
              onToggle={() => onToggleItem(item.id)}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

function QAItem({
  item,
  open,
  onToggle,
}: {
  item: LibraryItem
  open: boolean
  onToggle: () => void
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
        aria-expanded={open}
      >
        <span className="flex-none text-zinc-400">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.question}</span>
      </button>
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 px-5 pb-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            <p>{item.answer}</p>
            <p className="rounded-md bg-indigo-50 p-3 text-xs leading-relaxed text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">
              <span className="font-semibold">How I used it:</span> {item.projectUsage}
            </p>
            {item.remember ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-semibold">Remember:</span> {item.remember}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function FoldableCard({
  open,
  onToggle,
  title,
  subtitle,
  children,
}: {
  open: boolean
  onToggle: () => void
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
        aria-expanded={open}
      >
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        </div>
        <span className="flex-none text-zinc-400">
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </span>
      </button>
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-zinc-100 px-5 pb-5 dark:border-zinc-900">{children}</div>
        </div>
      </div>
    </section>
  )
}

function filterLibrary(topics: LibraryTopic[], q: string): LibraryTopic[] {
  if (!q) return topics
  const out: LibraryTopic[] = []
  for (const t of topics) {
    const topicHit = t.name.toLowerCase().includes(q) || t.anchor.toLowerCase().includes(q)
    const items = t.items.filter(
      (i) =>
        i.question.toLowerCase().includes(q) ||
        i.answer.toLowerCase().includes(q) ||
        i.projectUsage.toLowerCase().includes(q) ||
        (i.remember ?? '').toLowerCase().includes(q)
    )
    if (topicHit || items.length > 0) {
      out.push({ ...t, items: items.length > 0 ? items : t.items })
    }
  }
  return out
}

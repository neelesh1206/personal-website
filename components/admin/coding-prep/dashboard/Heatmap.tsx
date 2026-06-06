'use client'

import { cn } from '@/lib/utils'

type Entry = { date: string; value: number }

export function Heatmap({
  entries,
  weeks = 16,
  className,
}: {
  entries: Entry[]
  weeks?: number
  className?: string
}) {
  const byDate = new Map(entries.map((e) => [e.date, e.value]))
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const cells: { date: string; value: number; isFuture: boolean }[] = []
  const totalDays = weeks * 7
  const start = new Date(today)
  // Align: start should be a Sunday `totalDays-1` ago
  start.setUTCDate(today.getUTCDate() - (totalDays - 1))
  const day = start.getUTCDay()
  start.setUTCDate(start.getUTCDate() - day)
  const totalCells = weeks * 7
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(start)
    d.setUTCDate(start.getUTCDate() + i)
    const key = d.toISOString().slice(0, 10)
    cells.push({
      date: key,
      value: byDate.get(key) ?? 0,
      isFuture: d > today,
    })
  }

  const cellSize = 11
  const gap = 2
  const colWidth = cellSize + gap
  const rowHeight = cellSize + gap

  return (
    <div className={cn('overflow-x-auto', className)}>
      <svg width={weeks * colWidth} height={7 * rowHeight} role="img" aria-label="Activity heatmap">
        {cells.map((c, i) => {
          const col = Math.floor(i / 7)
          const row = i % 7
          const intensity = c.isFuture ? -1 : Math.min(c.value, 4)
          return (
            <rect
              key={c.date}
              x={col * colWidth}
              y={row * rowHeight}
              width={cellSize}
              height={cellSize}
              rx={2}
              className={cn(
                intensity === -1 && 'fill-zinc-100 dark:fill-zinc-900',
                intensity === 0 && 'fill-zinc-200 dark:fill-zinc-800',
                intensity === 1 && 'fill-indigo-200 dark:fill-indigo-900',
                intensity === 2 && 'fill-indigo-400 dark:fill-indigo-700',
                intensity === 3 && 'fill-indigo-500 dark:fill-indigo-500',
                intensity === 4 && 'fill-indigo-700 dark:fill-indigo-400'
              )}
            >
              <title>{`${c.date}: ${c.value}`}</title>
            </rect>
          )
        })}
      </svg>
    </div>
  )
}

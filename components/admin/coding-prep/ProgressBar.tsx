import { cn } from '@/lib/utils'

const TONE: Record<string, string> = {
  indigo: 'bg-indigo-600 dark:bg-indigo-500',
  emerald: 'bg-emerald-600 dark:bg-emerald-500',
}

export function ProgressBar({
  completed,
  total,
  tone = 'indigo',
  className = '',
}: {
  completed: number
  total: number
  tone?: 'indigo' | 'emerald'
  className?: string
}) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)
  return (
    <div className={cn('w-full', className)}>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn('h-full transition-all duration-300', TONE[tone] ?? TONE.indigo)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
        <span>
          {completed} / {total}
        </span>
        <span>{pct}%</span>
      </div>
    </div>
  )
}

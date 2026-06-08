'use client'

import { Fragment } from 'react'
import { cn } from '@/lib/utils'

/**
 * Tiny markdown subset for interview-prep answers:
 *   - Blank-line separated paragraphs.
 *   - "- item" bullet lists.
 *   - **bold**
 *   - *(pause)* / *(slow down — payoff)* / *(any italic in parens)* → muted italic.
 *   - "literal" inline _other_ italic via *single asterisks* — kept simple.
 *
 * No HTML injection — every chunk goes through React text nodes.
 */

type InlinePiece =
  | { kind: 'text'; value: string }
  | { kind: 'pause'; value: string }
  | { kind: 'bold'; value: string }
  | { kind: 'italic'; value: string }

// Order matters — pause is the most specific, must match first.
const TOKEN_RE = /(\*\([^*]+?\)\*)|(\*\*[^*]+?\*\*)|(\*[^*\n]+?\*)/g

function tokenize(line: string): InlinePiece[] {
  const out: InlinePiece[] = []
  let cursor = 0
  for (const m of line.matchAll(TOKEN_RE)) {
    if (m.index === undefined) continue
    if (m.index > cursor) {
      out.push({ kind: 'text', value: line.slice(cursor, m.index) })
    }
    const [whole] = m
    if (whole.startsWith('*(') && whole.endsWith(')*')) {
      out.push({ kind: 'pause', value: whole.slice(2, -2) })
    } else if (whole.startsWith('**') && whole.endsWith('**')) {
      out.push({ kind: 'bold', value: whole.slice(2, -2) })
    } else if (whole.startsWith('*') && whole.endsWith('*')) {
      out.push({ kind: 'italic', value: whole.slice(1, -1) })
    }
    cursor = m.index + whole.length
  }
  if (cursor < line.length) out.push({ kind: 'text', value: line.slice(cursor) })
  return out
}

function Inline({ pieces }: { pieces: InlinePiece[] }) {
  return (
    <>
      {pieces.map((p, i) => {
        if (p.kind === 'pause') {
          return (
            <span
              key={i}
              className="mx-0.5 text-[0.86em] italic text-zinc-400 dark:text-zinc-500"
              aria-label={`pause cue: ${p.value}`}
            >
              ({p.value})
            </span>
          )
        }
        if (p.kind === 'bold') {
          return (
            <strong key={i} className="font-semibold text-zinc-900 dark:text-zinc-50">
              {p.value}
            </strong>
          )
        }
        if (p.kind === 'italic') {
          return (
            <em key={i} className="italic text-zinc-700 dark:text-zinc-300">
              {p.value}
            </em>
          )
        }
        return <Fragment key={i}>{p.value}</Fragment>
      })}
    </>
  )
}

function isBulletLine(s: string): boolean {
  return /^\s*-\s+/.test(s)
}

export function MarkdownAnswer({ markdown, className }: { markdown: string; className?: string }) {
  // Split into blocks by blank lines. Each block is either a paragraph
  // or a contiguous list of "- " lines.
  const blocks: Array<{ kind: 'p' | 'ul'; lines: string[] }> = []
  const raw = markdown.replace(/\r\n/g, '\n').split(/\n{2,}/)
  for (const chunk of raw) {
    const lines = chunk.split('\n').map((l) => l.trimEnd())
    if (lines.length === 0) continue
    if (lines.every((l) => l.trim() === '')) continue
    if (lines.every((l) => l.trim() === '' || isBulletLine(l))) {
      const items = lines.filter(isBulletLine).map((l) => l.replace(/^\s*-\s+/, ''))
      blocks.push({ kind: 'ul', lines: items })
    } else {
      blocks.push({ kind: 'p', lines })
    }
  }

  return (
    <div
      className={cn(
        'space-y-4 text-[15px] leading-7 text-zinc-700 sm:text-base dark:text-zinc-300',
        className
      )}
    >
      {blocks.map((b, i) => {
        if (b.kind === 'ul') {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-5 marker:text-zinc-400">
              {b.lines.map((item, j) => (
                <li key={j}>
                  <Inline pieces={tokenize(item)} />
                </li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i}>
            <Inline pieces={tokenize(b.lines.join(' '))} />
          </p>
        )
      })}
    </div>
  )
}

'use client'

/**
 * Game-feel primitives. Two effects, both opt-in via the
 * `sound_enabled` setting (off by default).
 *
 * - `fireConfetti()` — canvas-confetti burst, two waves from the two
 *   lower corners. Visual only, no sound, always plays (it's a one-off
 *   reward gesture, not a recurring noise).
 * - `playTone(kind)` — programmatic Web Audio chime. No mp3 dependency.
 *   `kind = 'tick'` is a soft click for block completion; `'levelup'`
 *   is a short two-note ascending chord. Both are gated by the
 *   sound_enabled boolean — call sites can pass it through.
 */

import confetti from 'canvas-confetti'

let _audioCtx: AudioContext | null = null
function ensureAudio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (_audioCtx) return _audioCtx
  // Webkit prefix kept for older Safari compatibility.
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return null
  try {
    _audioCtx = new Ctx()
    return _audioCtx
  } catch {
    return null
  }
}

export function fireConfetti(): void {
  if (typeof window === 'undefined') return
  const defaults = { spread: 70, ticks: 80, gravity: 0.9, decay: 0.93, scalar: 0.95 }
  // Two waves from the lower corners — feels like applause from both
  // sides rather than a single dump.
  confetti({
    ...defaults,
    particleCount: 50,
    angle: 60,
    origin: { x: 0, y: 0.85 },
    colors: ['#6366f1', '#8b5cf6', '#f59e0b', '#10b981'],
  })
  confetti({
    ...defaults,
    particleCount: 50,
    angle: 120,
    origin: { x: 1, y: 0.85 },
    colors: ['#6366f1', '#8b5cf6', '#f59e0b', '#10b981'],
  })
}

export type ToneKind = 'tick' | 'levelup' | 'block-complete'

/**
 * Play a short chime. Returns a Promise that resolves when the tone
 * finishes (~80–500 ms depending on kind). Silently no-ops when
 * `enabled` is false, when there's no AudioContext, or when the
 * Promise is rejected (browser autoplay policy).
 */
export async function playTone(kind: ToneKind, enabled: boolean): Promise<void> {
  if (!enabled) return
  const ctx = ensureAudio()
  if (!ctx) return
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume()
    } catch {
      return
    }
  }

  const now = ctx.currentTime
  const master = ctx.createGain()
  master.gain.value = 0.06 // gentle — this is a productivity tool, not a game
  master.connect(ctx.destination)

  const audio = ctx
  function note(freq: number, start: number, duration: number, peak = 0.7) {
    const osc = audio.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const g = audio.createGain()
    g.gain.setValueAtTime(0, start)
    g.gain.linearRampToValueAtTime(peak, start + 0.005)
    g.gain.exponentialRampToValueAtTime(0.001, start + duration)
    osc.connect(g)
    g.connect(master)
    osc.start(start)
    osc.stop(start + duration + 0.01)
  }

  if (kind === 'tick') {
    note(1320, now, 0.06, 0.5) // short high click
    await new Promise((r) => window.setTimeout(r, 80))
  } else if (kind === 'block-complete') {
    note(880, now, 0.12, 0.7)
    note(1108, now + 0.07, 0.14, 0.6)
    await new Promise((r) => window.setTimeout(r, 220))
  } else if (kind === 'levelup') {
    // A → C# → E ascending triad (A major) — recognizably "good news"
    note(440, now, 0.18, 0.8)
    note(554, now + 0.1, 0.18, 0.75)
    note(659, now + 0.22, 0.32, 0.85)
    await new Promise((r) => window.setTimeout(r, 520))
  }
}

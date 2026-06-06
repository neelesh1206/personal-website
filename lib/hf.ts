import 'server-only'
import { InferenceClient } from '@huggingface/inference'

/**
 * HuggingFace Inference helper for the daily coding-prep summary.
 *
 * Mirrors the MarketMind pattern (pipeline/processors/summarizer.py):
 * - chat_completion API (OpenAI-compatible; routes cleanly across HF
 *   Inference Providers)
 * - Default model Mistral-Nemo-Instruct-2407 (12B params, good at short
 *   structured outputs)
 * - Labeled-line output, parsed leniently
 * - Returns null on any failure so the caller falls back to the template
 */

// HF Inference Provider router catalog moved on from the Mistral
// instruct models — Mistral-Nemo, Mistral-7B-v0.3, Mistral-Small-24B
// all now return `model_not_supported` from /v1/chat/completions.
// Llama-3.1-8B-Instruct is a confirmed-working chat model on the
// router, fast enough for the morning-quote picker on the page render
// path, and plenty for our 2–3 sentence structured outputs. Override
// per-environment with HUGGINGFACE_SUMMARY_MODEL.
const DEFAULT_MODEL = 'meta-llama/Llama-3.1-8B-Instruct'

export type DaySummaryInput = {
  date: string
  studyStreak: number
  trainStreak: number
  problemsSolved: number
  applicationsCount: number
  trainedToday: boolean
  morningAnchorRead: boolean
  readAloud: boolean
  journalFinished: string
  journalAvoided: string
  journalWin: string
  journalDeviation: string
  mood: number | null
  newlyUnlocked: string[]
  tomorrowFocus: string
}

export type DaySummaryOutput = {
  narrative: string
  tomorrowEdge: string
}

const PROMPT = (
  i: DaySummaryInput
) => `You are a tough, supportive coach writing the end-of-day note for a senior engineer running a 10-day interview-prep program. Voice: direct, kind, no fluff, no emoji, no headings.

Output EXACTLY two labeled lines in this format — no preamble, no extra text:

NARRATIVE: <2-3 sentences. Reflect honestly on what got done and what was avoided. Mention the streak if it's worth mentioning. Be specific to the journal text, not generic.>
TOMORROW: <one sentence, max 25 words. A concrete edge for tomorrow that addresses what was avoided/deviated today and ties into tomorrow's plan focus.>

Today's data:
- Date: ${i.date}
- Study streak: ${i.studyStreak} day(s); gym streak: ${i.trainStreak} day(s)
- Problems solved: ${i.problemsSolved}; applications sent: ${i.applicationsCount}
- Trained: ${i.trainedToday ? 'yes' : 'no'}; morning anchor: ${i.morningAnchorRead ? 'read' : 'skipped'}; read-aloud: ${i.readAloud ? 'yes' : 'no'}
- Mood: ${i.mood ?? 'unspecified'}/5
- Finished today: ${i.journalFinished || '(blank)'}
- Avoided / stuck on: ${i.journalAvoided || '(blank)'}
- One win: ${i.journalWin || '(blank)'}
- Deviation: ${i.journalDeviation || '(blank)'}
- Tomorrow's plan focus: ${i.tomorrowFocus}
${i.newlyUnlocked.length ? `- Badges unlocked today: ${i.newlyUnlocked.join(', ')}` : ''}`

const LABEL_RE = /^\s*(NARRATIVE|TOMORROW)\s*:\s*(.+?)\s*$/i

export async function generatePrepSummary(
  input: DaySummaryInput,
  onError?: (msg: string) => void
): Promise<DaySummaryOutput | null> {
  const apiKey = process.env.HUGGINGFACE_API_KEY
  if (!apiKey) {
    onError?.('HUGGINGFACE_API_KEY not set')
    return null
  }

  const model = process.env.HUGGINGFACE_SUMMARY_MODEL ?? DEFAULT_MODEL
  const provider = process.env.HUGGINGFACE_PROVIDER as
    | 'auto'
    | 'hf-inference'
    | 'together'
    | 'fireworks-ai'
    | 'nebius'
    | undefined

  try {
    const client = new InferenceClient(apiKey)
    const res = await client.chatCompletion({
      model,
      provider: provider && provider !== 'auto' ? provider : undefined,
      messages: [{ role: 'user', content: PROMPT(input) }],
      max_tokens: 220,
      temperature: 0.4,
    })
    const raw = res.choices?.[0]?.message?.content ?? ''
    if (typeof raw !== 'string' || !raw.trim()) {
      onError?.('empty response')
      return null
    }
    const parsed = parseLabeledOutput(raw)
    if (!parsed) onError?.(`unparseable response: ${raw.slice(0, 200)}`)
    return parsed
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    onError?.(msg)
    console.error('hf generatePrepSummary failed', err)
    return null
  }
}

/* ------------------------------------------------------------------ *
 * Morning quote picker.
 *
 * Given a small pool of curated quotes and the user's recent context
 * (yesterday's journal, streaks, today's plan focus), the model returns
 *
 *   QUOTE_ID: <one id from the candidate list>
 *   REFLECTION: <one sentence connecting that quote to today>
 *
 * Why this design — we never let the model invent the quote text or
 * attribution (Mistral occasionally fabricates plausible-but-fake
 * quotes attributed to real people). The model only chooses among
 * pre-curated rows. The reflection is the only generative part.
 * ------------------------------------------------------------------ */

export type QuotePickInput = {
  candidates: Array<{ id: string; text: string; author: string; tags: string[] }>
  planDayLabel: string
  studyStreak: number
  gymStreak: number
  yesterday?: {
    finished: string
    avoided: string
    win: string
    deviation: string
    mood: number | null
  } | null
}

export type QuotePickOutput = {
  quoteId: string
  reflection: string
}

const QUOTE_LABEL_RE = /^\s*(QUOTE_ID|REFLECTION)\s*:\s*(.+?)\s*$/i

export async function pickDailyQuote(input: QuotePickInput): Promise<QuotePickOutput | null> {
  const apiKey = process.env.HUGGINGFACE_API_KEY
  if (!apiKey) return null
  if (!input.candidates.length) return null

  const model = process.env.HUGGINGFACE_SUMMARY_MODEL ?? DEFAULT_MODEL
  const provider = process.env.HUGGINGFACE_PROVIDER as
    | 'auto'
    | 'hf-inference'
    | 'together'
    | 'fireworks-ai'
    | 'nebius'
    | undefined

  const allowedIds = new Set(input.candidates.map((c) => c.id))
  const prompt = buildQuotePickPrompt(input)

  try {
    const client = new InferenceClient(apiKey)
    const res = await client.chatCompletion({
      model,
      provider: provider && provider !== 'auto' ? provider : undefined,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 140,
      temperature: 0.5,
    })
    const raw = res.choices?.[0]?.message?.content ?? ''
    if (typeof raw !== 'string' || !raw.trim()) return null

    const parsed = parseQuoteOutput(raw)
    if (!parsed) return null

    // Defensive: reject any id the model invented.
    if (!allowedIds.has(parsed.quoteId)) {
      console.warn('hf pickDailyQuote returned unknown id', parsed.quoteId)
      return null
    }
    return parsed
  } catch (err) {
    console.error('hf pickDailyQuote failed', err)
    return null
  }
}

function buildQuotePickPrompt(i: QuotePickInput): string {
  const candidatesBlock = i.candidates
    .map((c) => `- [${c.id}] ${c.author}: "${c.text}" (tags: ${c.tags.join(', ')})`)
    .join('\n')

  const yesterdayBlock = i.yesterday
    ? `Yesterday's journal:
- Finished: ${i.yesterday.finished || '(blank)'}
- Avoided / stuck on: ${i.yesterday.avoided || '(blank)'}
- One win: ${i.yesterday.win || '(blank)'}
- Deviation: ${i.yesterday.deviation || '(blank)'}
- Mood: ${i.yesterday.mood ?? 'unspecified'}/5`
    : 'No journal from yesterday (first day or skipped).'

  return `You are choosing the morning anchor quote for a senior engineer running a 10-day interview-prep program. Voice: direct, kind, no fluff. No emoji. No fabrication.

Pick EXACTLY ONE quote id from the CANDIDATES list below and write a one-sentence reflection (max 25 words) connecting that quote to the user's recent experience and today's focus.

Output EXACTLY two labeled lines — no preamble:

QUOTE_ID: <one id verbatim from the list — no other characters>
REFLECTION: <one sentence, max 25 words, naming a specific thing from yesterday or today that the quote speaks to. Do NOT repeat the quote text.>

Today's focus: ${i.planDayLabel}
Study streak: ${i.studyStreak} day(s); gym streak: ${i.gymStreak} day(s).

${yesterdayBlock}

CANDIDATES:
${candidatesBlock}`
}

function parseQuoteOutput(raw: string): QuotePickOutput | null {
  let quoteId = ''
  let reflection = ''
  for (const line of raw.split(/\r?\n/)) {
    const m = QUOTE_LABEL_RE.exec(line)
    if (!m) continue
    const key = m[1]!.toUpperCase()
    let value = m[2]!.trim().replace(/^["']|["']$/g, '')
    if (key === 'QUOTE_ID') {
      // Strip brackets, surrounding punctuation, anything that isn't id-like
      value = value
        .replace(/^\[|\]$/g, '')
        .replace(/[^a-z0-9-]/gi, '')
        .toLowerCase()
      quoteId = value
    } else if (key === 'REFLECTION') {
      reflection = value.replace(/\.$/, '').slice(0, 220)
    }
  }
  if (!quoteId) return null
  return { quoteId, reflection }
}

/* ------------------------------------------------------------------ *
 * Optional AI re-plan — adjusts ONLY the load + tone, never the
 * curriculum, never the discipline metrics. Strict JSON in / strict
 * JSON out. Silent fallback on any failure.
 * ------------------------------------------------------------------ */

export type ReplanInput = {
  currentDay: number | null
  planDayTitle: string
  loadMode: 'full' | 'core' | 're-entry' | 'maintenance'
  defaultSprints: number
  defaultAppTarget: number
  completedYesterday: string[]
  missedYesterday: boolean
  daysMissed: number
  recentJournal: Array<{
    date: string
    finished: string
    avoided: string
    win: string
    mood: number | null
  }>
  myWins: string[]
}

export type ReplanOutput = {
  sprints: number
  appTarget: number
  systemDesign: 'full' | 'collapsed' | 'hidden'
  encouragementLine: string
  focusHint: string
}

export async function replanDay(
  input: ReplanInput,
  onError?: (msg: string) => void
): Promise<ReplanOutput | null> {
  const apiKey = process.env.HUGGINGFACE_API_KEY
  if (!apiKey) {
    onError?.('HUGGINGFACE_API_KEY not set')
    return null
  }
  const model = process.env.HUGGINGFACE_SUMMARY_MODEL ?? DEFAULT_MODEL
  const provider = process.env.HUGGINGFACE_PROVIDER as
    | 'auto'
    | 'hf-inference'
    | 'together'
    | 'fireworks-ai'
    | 'nebius'
    | undefined

  const journalBlock =
    input.recentJournal
      .slice(0, 3)
      .map(
        (r) =>
          `- ${r.date} (mood ${r.mood ?? '?'}): finished=${r.finished || '-'} | avoided=${r.avoided || '-'} | win=${r.win || '-'}`
      )
      .join('\n') || '- (no recent journal)'

  const winsBlock =
    input.myWins.length > 0 ? input.myWins.map((w) => `- ${w}`).join('\n') : '- (none on file)'

  const prompt = `You are tuning a fixed study plan for a senior engineer. Output ONLY valid JSON matching the schema below. No markdown, no preface, no commentary outside the JSON. You may ONLY adjust load (sprints, appTarget, systemDesign) and tone (two strings). You MUST NOT invent new topics, problems, or curriculum. You MUST NOT reference streaks, badges, XP, or levels. Never use shame language ("you missed", "you failed"). If the user missed days, the tone should be warm, calm, and forward-looking, optionally name-checking one of their wins for grounding.

Schema (return EXACTLY this shape):
{"sprints": <int 1..3>, "appTarget": <int 0..5>, "systemDesign": <"full"|"collapsed"|"hidden">, "encouragementLine": "<one sentence, max 22 words>", "focusHint": "<one sentence, max 18 words>"}

Context:
- Today's plan day: ${input.currentDay ?? 'maintenance'} — ${input.planDayTitle}
- Suggested load mode (deterministic baseline): ${input.loadMode}
- Default sprints: ${input.defaultSprints}, default appTarget: ${input.defaultAppTarget}
- Yesterday completed: ${input.completedYesterday.join(', ') || 'nothing logged'}
- Missed yesterday: ${input.missedYesterday}
- Consecutive missed days back: ${input.daysMissed}
- Recent journal:
${journalBlock}
- User's real wins (for grounding, name-check at most one):
${winsBlock}

Return ONLY the JSON.`

  try {
    const client = new InferenceClient(apiKey)
    const res = await client.chatCompletion({
      model,
      provider: provider && provider !== 'auto' ? provider : undefined,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 220,
      temperature: 0.3,
    })
    const raw = res.choices?.[0]?.message?.content ?? ''
    if (typeof raw !== 'string' || !raw.trim()) {
      onError?.('empty response')
      return null
    }
    return parseReplanJson(raw, onError)
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    onError?.(msg)
    console.error('hf replanDay failed', err)
    return null
  }
}

function parseReplanJson(raw: string, onError?: (msg: string) => void): ReplanOutput | null {
  // Extract the JSON object — be lenient if model added a stray prefix.
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start < 0 || end < 0 || end < start) {
    onError?.(`no JSON object in response: ${raw.slice(0, 200)}`)
    return null
  }
  const jsonStr = raw.slice(start, end + 1)
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonStr)
  } catch (err) {
    onError?.(`json parse failed: ${(err as Error).message}`)
    return null
  }
  if (typeof parsed !== 'object' || parsed === null) {
    onError?.('parsed is not an object')
    return null
  }
  const p = parsed as Record<string, unknown>
  const sprints = clampInt(p.sprints, 1, 3)
  const appTarget = clampInt(p.appTarget, 0, 5)
  const sd = String(p.systemDesign ?? 'full')
  const systemDesign: ReplanOutput['systemDesign'] =
    sd === 'full' || sd === 'collapsed' || sd === 'hidden' ? sd : 'full'
  const enc = String(p.encouragementLine ?? '')
    .trim()
    .slice(0, 240)
  const focus = String(p.focusHint ?? '')
    .trim()
    .slice(0, 200)
  // Defensive: strip any model-leaked shame language.
  if (/missed yesterday|you failed|broke the chain/i.test(enc + ' ' + focus)) {
    onError?.('shame language detected — rejecting')
    return null
  }
  if (sprints === null || appTarget === null) {
    onError?.('sprints / appTarget out of range')
    return null
  }
  return { sprints, appTarget, systemDesign, encouragementLine: enc, focusHint: focus }
}

function clampInt(v: unknown, lo: number, hi: number): number | null {
  const n = typeof v === 'number' ? v : Number.parseInt(String(v), 10)
  if (!Number.isFinite(n)) return null
  return Math.max(lo, Math.min(hi, Math.floor(n)))
}

function parseLabeledOutput(raw: string): DaySummaryOutput | null {
  let narrative = ''
  let tomorrow = ''
  for (const line of raw.split(/\r?\n/)) {
    const m = LABEL_RE.exec(line)
    if (!m) continue
    const key = m[1]!.toUpperCase()
    const value = m[2]!
      .trim()
      .replace(/^["']|["']$/g, '')
      .replace(/\.$/, '')
    if (key === 'NARRATIVE') narrative = value
    else if (key === 'TOMORROW') tomorrow = value
  }
  if (!narrative && !tomorrow) return null
  return { narrative, tomorrowEdge: tomorrow }
}

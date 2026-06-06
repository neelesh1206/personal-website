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

const DEFAULT_MODEL = 'mistralai/Mistral-Nemo-Instruct-2407'

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
  input: DaySummaryInput
): Promise<DaySummaryOutput | null> {
  const apiKey = process.env.HUGGINGFACE_API_KEY
  if (!apiKey) return null

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
    if (typeof raw !== 'string' || !raw.trim()) return null
    return parseLabeledOutput(raw)
  } catch (err) {
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

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

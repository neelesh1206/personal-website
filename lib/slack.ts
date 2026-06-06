import 'server-only'

/**
 * Slack incoming-webhook helper. Mirrors the MarketMind composite-action
 * pattern: post Block Kit JSON to SLACK_WEBHOOK_URL, no-op silently when
 * the env var is missing so local/dev doesn't error.
 */

export type SlackBlock = Record<string, unknown>

export type SlackMessage = {
  text: string // fallback for notifications
  blocks?: SlackBlock[]
}

export async function postSlack(message: SlackMessage): Promise<{ ok: boolean; reason?: string }> {
  const url = process.env.SLACK_WEBHOOK_URL
  if (!url) return { ok: false, reason: 'SLACK_WEBHOOK_URL not configured' }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('Slack post failed', res.status, body)
      return { ok: false, reason: `HTTP ${res.status}` }
    }
    return { ok: true }
  } catch (err) {
    console.error('Slack post threw', err)
    return { ok: false, reason: (err as Error).message }
  }
}

export function section(text: string): SlackBlock {
  return { type: 'section', text: { type: 'mrkdwn', text } }
}

export function header(text: string): SlackBlock {
  return { type: 'header', text: { type: 'plain_text', text, emoji: true } }
}

export function divider(): SlackBlock {
  return { type: 'divider' }
}

export function context(parts: string[]): SlackBlock {
  return {
    type: 'context',
    elements: parts.map((p) => ({ type: 'mrkdwn', text: p })),
  }
}

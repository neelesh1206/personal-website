import { NextResponse, type NextRequest } from 'next/server'
import { getResend } from '@/lib/email/resend'
import { postSlack, header, section, divider, context } from '@/lib/slack'
import {
  getOrInitDailyLog,
  getDailyLog,
  getCompletedTaskIds,
  getSettings,
  todayKey,
} from '@/lib/admin/prep/queries'
import { slideCurrentPlanDay, pickLoadMode, buildLoadProfile } from '@/lib/admin/prep/plan-adjust'
import { completionFromLog } from '@/lib/admin/prep/day-completion'
import { resolveDailyQuote } from '@/lib/admin/prep/resolve-daily-quote'
import { buildMorningBrief } from '@/lib/admin/prep/morning-brief'
import {
  codingItems,
  planDaysWithAllItemsCompleted,
  todaysCodingPattern,
  todaysSysDesignTopic,
  todaysSysDesignAnchor,
} from '@/lib/admin/prep/plan-helpers'
import planContent from '@/content/coding-prep-plan.json'
import type { Plan } from '@/lib/admin/prep/types'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    return await runMorningBrief()
  } catch (err) {
    console.error('prep-morning-brief unhandled', err)
    return NextResponse.json(
      {
        error: 'Unhandled error in morning brief',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack?.split('\n').slice(0, 8) : undefined,
      },
      { status: 500 }
    )
  }
}

async function runMorningBrief() {
  const today = todayKey()
  const plan = planContent as unknown as Plan
  const settings = await getSettings()
  const todayLog = await getOrInitDailyLog(today)
  const completed = await getCompletedTaskIds()

  // Plan-day slide — same logic as the page. Driven by prep_progress
  // (the plan-task checkboxes the user actually ticks), not by daily-
  // log counters.
  const completedPlanDays = planDaysWithAllItemsCompleted(plan, completed)
  const slide = slideCurrentPlanDay({
    planStartDate: settings.plan_start_date,
    todayKey: today,
    completedDays: completedPlanDays,
    totalDays: plan.days.length,
  })

  const yesterdayKey = (() => {
    const d = new Date(
      Date.UTC(
        Number.parseInt(today.slice(0, 4), 10),
        Number.parseInt(today.slice(5, 7), 10) - 1,
        Number.parseInt(today.slice(8, 10), 10)
      )
    )
    d.setUTCDate(d.getUTCDate() - 1)
    return d.toISOString().slice(0, 10)
  })()
  const yesterdayLogRow = await getDailyLog(yesterdayKey)
  const yesterdayCompletion = yesterdayLogRow ? completionFromLog(yesterdayLogRow) : null
  const loadMode = pickLoadMode({
    yesterday: yesterdayCompletion,
    isMaintenance: slide.isMaintenance,
  })
  const loadProfile = buildLoadProfile(loadMode)

  // Calendar day → is the slide carrying forward?
  const calendarDay = (() => {
    if (!settings.plan_start_date) return null
    const start = Date.UTC(
      Number.parseInt(settings.plan_start_date.slice(0, 4), 10),
      Number.parseInt(settings.plan_start_date.slice(5, 7), 10) - 1,
      Number.parseInt(settings.plan_start_date.slice(8, 10), 10)
    )
    const t = Date.UTC(
      Number.parseInt(today.slice(0, 4), 10),
      Number.parseInt(today.slice(5, 7), 10) - 1,
      Number.parseInt(today.slice(8, 10), 10)
    )
    return Math.floor((t - start) / (24 * 3600 * 1000)) + 1
  })()
  const isCarryingForward =
    calendarDay !== null &&
    slide.planDay !== null &&
    calendarDay > slide.planDay &&
    !slide.isMaintenance

  const planDay = slide.planDay ? (plan.days.find((d) => d.day === slide.planDay) ?? null) : null

  // Daily quote — calls AI if HUGGINGFACE_API_KEY is set, otherwise
  // deterministic. Persists to prep_daily_log so the page render later
  // today reuses the same choice.
  const ctxStreaks = {
    study: 0, // morning brief doesn't depend on streak; pass placeholders
    train: 0,
  }
  const resolvedQuote = await resolveDailyQuote({
    todayKey: today,
    todayLog,
    planDayLabel: planDay ? `Day ${planDay.day}: ${planDay.title}` : null,
    planDayTheme: planDay?.title,
    studyStreak: ctxStreaks.study,
    gymStreak: ctxStreaks.train,
  })

  const brief = buildMorningBrief({
    date: today,
    planDayNum: slide.planDay,
    planDayTitle: planDay?.title ?? null,
    isMaintenance: slide.isMaintenance,
    isCarryingForward,
    loadProfile,
    codingPattern: planDay ? todaysCodingPattern(planDay) : null,
    codingTaskCount: planDay ? codingItems(planDay).length : 0,
    systemDesignTopic: planDay ? todaysSysDesignTopic(planDay) : null,
    systemDesignAnchor: planDay ? todaysSysDesignAnchor(planDay) : null,
    yesterdayAvoided: yesterdayLogRow?.journalAvoided?.trim() || undefined,
  })

  const subject = `${brief.subjectPrefix} · ${today} · ${brief.todayLabel}`

  // Email
  const adminEmail = process.env.ADMIN_EMAIL
  const fromAddr = process.env.RESEND_FROM ?? 'onboarding@resend.dev'
  if (adminEmail && process.env.RESEND_API_KEY) {
    const html = renderEmail({
      date: today,
      brief,
      quote: resolvedQuote.quote,
      quoteReflection: resolvedQuote.reflection,
    })
    try {
      await getResend().emails.send({ from: fromAddr, to: adminEmail, subject, html })
    } catch (err) {
      console.error('morning brief email failed', err)
    }
  }

  // Slack
  if (process.env.SLACK_WEBHOOK_URL) {
    await postSlack({
      text: subject,
      blocks: [
        header(`${brief.headerEmoji} Good morning — ${today}`),
        section(`_${brief.openingLine}_`),
        section(
          `> _"${resolvedQuote.quote.text}"_\n— *${resolvedQuote.quote.author}* · ${resolvedQuote.quote.role}`
        ),
        ...(resolvedQuote.reflection
          ? [section(`*Why this, today:* ${resolvedQuote.reflection}`)]
          : []),
        divider(),
        section(`*${brief.todayLabel}*`),
        section(
          brief.focusLines
            .map((l) => `${l.emoji} ${l.label}${l.detail ? ` — ${l.detail}` : ''}`)
            .join('\n')
        ),
        ...(brief.edgeLine ? [section(`*Edge today:* ${brief.edgeLine}`)] : []),
        context(['Reply by opening neeleshkakaraparthi.dev/admin/coding-prep']),
      ],
    })
  }

  return NextResponse.json({
    ok: true,
    date: today,
    todayLabel: brief.todayLabel,
    loadMode: loadProfile.mode,
    quoteId: resolvedQuote.quote.id,
    diagnostics: {
      has_admin_email: !!adminEmail,
      has_resend_key: !!process.env.RESEND_API_KEY,
      has_slack_webhook: !!process.env.SLACK_WEBHOOK_URL,
      has_hf_key: !!process.env.HUGGINGFACE_API_KEY,
    },
  })
}

function renderEmail(p: {
  date: string
  brief: ReturnType<typeof buildMorningBrief>
  quote: { text: string; author: string; role: string }
  quoteReflection: string
}) {
  const { brief, quote } = p
  const focus = brief.focusLines
    .map(
      (l) =>
        `<li style="margin:6px 0">${l.emoji} <strong>${escape(l.label)}</strong>${l.detail ? ` — <span style="color:#52525b">${escape(l.detail)}</span>` : ''}</li>`
    )
    .join('')
  return `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Inter,sans-serif;color:#09090b;max-width:560px;margin:0 auto;padding:24px">
    <h2 style="margin:0 0 4px">${brief.headerEmoji} Good morning — ${p.date}</h2>
    <p style="margin:0 0 18px;color:#4f46e5;font-style:italic">${escape(brief.openingLine)}</p>

    <blockquote style="border-left:3px solid #f59e0b;margin:0 0 14px;padding:8px 12px;background:#fffbeb;color:#3f3f46;font-style:italic;font-family:Georgia,serif">
      &ldquo;${escape(quote.text)}&rdquo;
      <div style="margin-top:6px;color:#52525b;font-style:normal;font-size:13px">— ${escape(quote.author)} · ${escape(quote.role)}</div>
    </blockquote>
    ${p.quoteReflection ? `<p style="margin:0 0 18px;color:#3f3f46;font-size:14px"><strong>Why this, today:</strong> ${escape(p.quoteReflection)}</p>` : ''}

    <h3 style="margin:0 0 6px">${escape(brief.todayLabel)}</h3>
    <ul style="padding-left:18px;margin:0 0 14px;list-style:none">${focus}</ul>

    ${brief.edgeLine ? `<p style="margin:14px 0 0;padding:10px 12px;background:#eef2ff;border-radius:8px;color:#312e81"><strong>Edge today:</strong> ${escape(brief.edgeLine)}</p>` : ''}

    <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0">
    <p style="color:#71717a;font-size:12px">Open <a href="https://neeleshkakaraparthi.dev/admin/coding-prep" style="color:#4f46e5;text-decoration:none">/admin/coding-prep</a> to start.</p>
  </body></html>`
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

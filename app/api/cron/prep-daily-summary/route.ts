import { NextResponse, type NextRequest } from 'next/server'
import { getResend } from '@/lib/email/resend'
import { postSlack, header, section, divider, context } from '@/lib/slack'
import {
  getOrInitDailyLog,
  getDailyLogs,
  getBadges,
  todayKey,
  getSettings,
} from '@/lib/admin/prep/queries'
import { refreshBadges } from '@/lib/admin/prep/refresh-badges'
import { computeBadgeContext, BADGE_INDEX } from '@/lib/admin/prep/badges'
import { generatePrepSummary, type DaySummaryOutput } from '@/lib/hf'
import { gradeDay, buildCompletionLines, type CompletionLine } from '@/lib/admin/prep/day-grade'
import planContent from '@/content/coding-prep-plan.json'

export const runtime = 'nodejs'

type PlanFile = {
  days: Array<{
    day: number
    title: string
    coding: { tasks: Array<{ id: string }> }
    systemDesign: { tasks: Array<{ id: string }> }
    wrapup: Array<{ id: string }>
  }>
}

function planTotalTasks(): number {
  return (planContent as unknown as PlanFile).days.reduce(
    (s, d) => s + d.coding.tasks.length + d.systemDesign.tasks.length + d.wrapup.length,
    0
  )
}

function nextDayFocus(planStartDate: string | undefined, tomorrow: Date): string {
  if (!planStartDate) return 'Follow the routine. The structure does the work.'
  const start = new Date(planStartDate)
  start.setUTCHours(0, 0, 0, 0)
  const diff = Math.floor((tomorrow.getTime() - start.getTime()) / (24 * 3600 * 1000))
  const dayNum = diff + 1
  const plan = planContent as unknown as PlanFile
  const day = plan.days.find((d) => d.day === dayNum)
  if (!day) return 'Free practice day. Pick a shaky pattern.'
  return `Day ${day.day}: ${day.title}`
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    return await runDailySummary()
  } catch (err) {
    console.error('prep-daily-summary unhandled', err)
    return NextResponse.json(
      {
        error: 'Unhandled error in daily summary',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack?.split('\n').slice(0, 8) : undefined,
      },
      { status: 500 }
    )
  }
}

async function runDailySummary() {
  const today = todayKey()
  const log = await getOrInitDailyLog(today)
  await refreshBadges()
  const ctx = await computeBadgeContext(planTotalTasks())
  const badges = await getBadges()
  const recentLogs = await getDailyLogs(7)
  const settings = await getSettings()

  const tomorrow = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  const tomorrowFocus = nextDayFocus(settings.plan_start_date, tomorrow)

  const newlyUnlocked = badges
    .filter((b) => b.unlockedAt.toISOString().slice(0, 10) === today)
    .map((b) => BADGE_INDEX[b.badgeId]?.name ?? b.badgeId)

  const grade = gradeDay({
    rewardEarned: log.rewardEarned,
    studyStreak: ctx.studyStreak,
    problemsSolved: log.problemsSolved,
    applicationsCount: log.applicationsCount,
    morningAnchorRead: log.morningAnchorRead,
    trainedToday: log.trainedToday,
    readAloud: log.readAloud,
    newlyUnlockedCount: newlyUnlocked.length,
  })

  const completionLines: CompletionLine[] = buildCompletionLines({
    morningAnchorRead: log.morningAnchorRead,
    problemsSolved: log.problemsSolved,
    trainedToday: log.trainedToday,
    readAloud: log.readAloud,
    applicationsCount: log.applicationsCount,
    rewardEarned: log.rewardEarned,
    newlyUnlocked,
  })
  // Legacy plain-text list kept for the templated email body + JSON
  // response — the new emoji-tagged list flows into Slack + the
  // styled email block.
  const completions: string[] = completionLines.map((l) => `${l.emoji} ${l.label}`)

  const subject = `${grade.subjectPrefix} — ${today} · ${log.problemsSolved} solved · ${log.applicationsCount} apps`

  // AI summary — best-effort. Falls back to the templated rollup if the
  // model call fails or HUGGINGFACE_API_KEY is unset.
  let hfError: string | null = null
  const ai: DaySummaryOutput | null = await generatePrepSummary(
    {
      date: today,
      studyStreak: ctx.studyStreak,
      trainStreak: ctx.trainStreak,
      problemsSolved: log.problemsSolved,
      applicationsCount: log.applicationsCount,
      trainedToday: log.trainedToday,
      morningAnchorRead: log.morningAnchorRead,
      readAloud: log.readAloud,
      journalFinished: log.journalFinished,
      journalAvoided: log.journalAvoided,
      journalWin: log.journalWin,
      journalDeviation: log.journalDeviation,
      mood: log.mood ?? null,
      newlyUnlocked: badges
        .filter((b) => b.unlockedAt.toISOString().slice(0, 10) === today)
        .map((b) => BADGE_INDEX[b.badgeId]?.name ?? b.badgeId),
      tomorrowFocus,
    },
    (msg) => {
      hfError = msg
    }
  )

  // Email
  const adminEmail = process.env.ADMIN_EMAIL
  const fromAddr = process.env.RESEND_FROM ?? 'onboarding@resend.dev'
  if (adminEmail && process.env.RESEND_API_KEY) {
    const html = renderEmail({
      date: today,
      log,
      ctx,
      completions,
      newlyUnlocked,
      tomorrowFocus,
      ai,
      headerEmoji: grade.headerEmoji,
      openingLine: grade.openingLine,
    })
    try {
      await getResend().emails.send({
        from: fromAddr,
        to: adminEmail,
        subject,
        html,
      })
    } catch (err) {
      console.error('daily summary email failed', err)
    }
  }

  // Slack
  if (process.env.SLACK_WEBHOOK_URL) {
    await postSlack({
      text: subject,
      blocks: [
        header(`${grade.headerEmoji} Daily prep — ${today}`),
        section(`_${grade.openingLine}_`),
        ...(ai?.narrative ? [section(`> ${ai.narrative}`)] : []),
        section(
          `*Streak:* ${ctx.studyStreak} day${ctx.studyStreak === 1 ? '' : 's'}   ` +
            `*Gym:* ${ctx.trainStreak} day${ctx.trainStreak === 1 ? '' : 's'}   ` +
            `*Mood:* ${log.mood ?? '—'}/5`
        ),
        section(
          `*Done today*\n${completions.length ? completions.map((c) => `• ${c}`).join('\n') : '_nothing logged_'}`
        ),
        ...(log.journalFinished || log.journalWin
          ? [
              section(
                `*Journal*\n${log.journalFinished ? `_Finished:_ ${log.journalFinished}\n` : ''}${log.journalWin ? `_Win:_ ${log.journalWin}` : ''}`
              ),
            ]
          : []),
        ...(newlyUnlocked.length
          ? [section(`:trophy: *Badges unlocked today:* ${newlyUnlocked.join(', ')}`)]
          : []),
        divider(),
        section(
          ai?.tomorrowEdge
            ? `*Tomorrow:* ${tomorrowFocus}\n*Edge:* ${ai.tomorrowEdge}`
            : `*Tomorrow:* ${tomorrowFocus}`
        ),
        context([`7-day completion: ${recentLogs.length}/7 logged`]),
      ],
    })
  }

  return NextResponse.json({
    ok: true,
    date: today,
    streak: ctx.studyStreak,
    completions,
    newlyUnlocked,
    tomorrowFocus,
    ai,
    diagnostics: {
      has_admin_email: !!process.env.ADMIN_EMAIL,
      has_resend_key: !!process.env.RESEND_API_KEY,
      has_slack_webhook: !!process.env.SLACK_WEBHOOK_URL,
      has_hf_key: !!process.env.HUGGINGFACE_API_KEY,
      hf_model: process.env.HUGGINGFACE_SUMMARY_MODEL ?? 'default',
      hf_provider: process.env.HUGGINGFACE_PROVIDER ?? 'auto',
      hf_error: hfError,
    },
  })
}

function renderEmail(p: {
  date: string
  log: {
    morningAnchorRead: boolean
    trainedToday: boolean
    readAloud: boolean
    rewardEarned: boolean
    problemsSolved: number
    applicationsCount: number
    mood: number | null
    journalFinished: string
    journalAvoided: string
    journalWin: string
    journalDeviation: string
    noDeviation: boolean
  }
  ctx: {
    studyStreak: number
    trainStreak: number
    totalProblems: number
    totalApplications: number
  }
  completions: string[]
  newlyUnlocked: string[]
  tomorrowFocus: string
  ai: DaySummaryOutput | null
  headerEmoji: string
  openingLine: string
}) {
  const { log, ctx, ai } = p
  const li = (s: string) => `<li style="margin:4px 0">${s}</li>`
  const journal = [
    log.journalFinished && `<p><strong>Finished:</strong> ${escape(log.journalFinished)}</p>`,
    log.journalAvoided && `<p><strong>Avoided:</strong> ${escape(log.journalAvoided)}</p>`,
    log.journalWin && `<p><strong>Win:</strong> ${escape(log.journalWin)}</p>`,
    log.journalDeviation && `<p><strong>Deviation:</strong> ${escape(log.journalDeviation)}</p>`,
  ]
    .filter(Boolean)
    .join('')

  const coachBlock = ai?.narrative
    ? `<blockquote style="border-left:3px solid #6366f1;margin:0 0 16px;padding:8px 12px;background:#f4f4f5;color:#3f3f46;font-style:italic">${escape(ai.narrative)}</blockquote>`
    : ''
  const tomorrowEdge = ai?.tomorrowEdge
    ? `<p style="margin:4px 0 0;color:#4338ca"><strong>Edge:</strong> ${escape(ai.tomorrowEdge)}</p>`
    : ''

  return `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Inter,sans-serif;color:#09090b;max-width:560px;margin:0 auto;padding:24px">
    <h2 style="margin:0 0 4px">${p.headerEmoji} Daily prep — ${p.date}</h2>
    <p style="margin:0 0 14px;color:#4f46e5;font-style:italic">${escape(p.openingLine)}</p>
    <p style="color:#52525b;margin:0 0 16px">Streak: <strong>${ctx.studyStreak}d</strong> · Gym: <strong>${ctx.trainStreak}d</strong> · Mood: <strong>${log.mood ?? '—'}/5</strong></p>
    ${coachBlock}
    <h3>Done today</h3>
    <ul style="padding-left:18px">${p.completions.map(li).join('') || '<li>—</li>'}</ul>
    ${journal ? `<h3>Journal</h3>${journal}` : ''}
    ${p.newlyUnlocked.length ? `<h3>🏅 Badges unlocked</h3><p>${p.newlyUnlocked.join(', ')}</p>` : ''}
    <h3>Tomorrow</h3><p>${escape(p.tomorrowFocus)}</p>${tomorrowEdge}
    <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0">
    <p style="color:#71717a;font-size:12px">Totals: ${ctx.totalProblems} problems · ${ctx.totalApplications} applications${ai ? ' · Coach: HF/Mistral-Nemo' : ''}</p>
  </body></html>`
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

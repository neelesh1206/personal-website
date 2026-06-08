import {
  pgTable,
  serial,
  bigserial,
  varchar,
  text,
  char,
  date,
  timestamp,
  uniqueIndex,
  index,
  boolean,
  integer,
  smallint,
  jsonb,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const contacts = pgTable('contacts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  message: text('message'),
  referrer: varchar('referrer', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type Contact = typeof contacts.$inferSelect
export type NewContact = typeof contacts.$inferInsert

/**
 * Privacy-conscious page-view log.
 *
 * - visitor_hash is SHA-256(ip + ua + daily-salt) → resets every day, so we
 *   never store a stable identifier or PII.
 * - UNIQUE (path, visitor_hash, view_date) lets us insert with ON CONFLICT
 *   DO NOTHING and naturally dedupe one visit per day per visitor per path.
 */
export const pageViews = pgTable(
  'page_views',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    path: varchar('path', { length: 500 }).notNull(),
    visitorHash: char('visitor_hash', { length: 64 }).notNull(),
    viewDate: date('view_date').notNull().defaultNow(),
    country: char('country', { length: 2 }),
    referrer: varchar('referrer', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('uq_page_views_visitor_day').on(table.path, table.visitorHash, table.viewDate),
    index('idx_page_views_created_at').on(table.createdAt),
  ]
)

export type PageView = typeof pageViews.$inferSelect
export type NewPageView = typeof pageViews.$inferInsert

/**
 * Single-tenant — the only authenticated user is the site owner. No
 * user_id column; auth is the cookie gate on /admin.
 *
 * Per-task progress for the 10-day coding/system-design prep plan.
 * Keyed by the task_id strings declared in content/coding-prep-plan.json.
 */
export const prepProgress = pgTable('prep_progress', {
  taskId: varchar('task_id', { length: 64 }).primaryKey(),
  completed: timestamp('completed').notNull().defaultNow(),
})

export type PrepProgressRow = typeof prepProgress.$inferSelect
export type NewPrepProgress = typeof prepProgress.$inferInsert

/**
 * Per-day free-text notes for the 10-day prep plan. Keyed by day number 1-10.
 */
export const prepNotes = pgTable('prep_notes', {
  day: char('day', { length: 2 }).primaryKey(), // '01' .. '10' — char keeps sort order stable
  body: text('body').notNull().default(''),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type PrepNoteRow = typeof prepNotes.$inferSelect
export type NewPrepNote = typeof prepNotes.$inferInsert

/* ---------------------------------------------------------------- *
 * "Today" routine + journal + applications + badges + settings.
 *
 * Single-tenant. All keyed by calendar date (YYYY-MM-DD) or a generated
 * surrogate id. Designed so the existing prep_progress (10-day plan
 * tasks) remains independent — those map to plan-day task IDs; these
 * map to calendar dates.
 * ---------------------------------------------------------------- */

/** Key-value settings. value is JSONB so we can store strings, numbers, arrays. */
export const prepSettings = pgTable('prep_settings', {
  key: varchar('key', { length: 64 }).primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type PrepSettingRow = typeof prepSettings.$inferSelect
export type NewPrepSetting = typeof prepSettings.$inferInsert

/**
 * One row per calendar date. Used for the routine checkboxes (anchor /
 * trained / read-aloud / reward), the day's rollup counters, and the
 * end-of-session journal fields. Calendar date is the natural key —
 * one row per day, period.
 */
export const prepDailyLog = pgTable('prep_daily_log', {
  logDate: date('log_date').primaryKey(),
  morningAnchorRead: boolean('morning_anchor_read').notNull().default(false),
  trainedToday: boolean('trained_today').notNull().default(false),
  readAloud: boolean('read_aloud').notNull().default(false),
  rewardEarned: boolean('reward_earned').notNull().default(false),
  rewardStartedAt: timestamp('reward_started_at'),
  applicationsCount: integer('applications_count').notNull().default(0),
  problemsSolved: integer('problems_solved').notNull().default(0),
  mood: smallint('mood'),
  journalFinished: text('journal_finished').notNull().default(''),
  journalAvoided: text('journal_avoided').notNull().default(''),
  journalWin: text('journal_win').notNull().default(''),
  journalDeviation: text('journal_deviation').notNull().default(''),
  noDeviation: boolean('no_deviation').notNull().default(false),
  // Plan adjustment — load mode picked for today. 'full' = both Pomodoro
  // sprints + all app targets + full system-design block; 'core' = 1
  // sprint + reduced apps; 're-entry' = 1 sprint + 1 app, soft copy;
  // 'maintenance' = post-Day-10 free-practice mode.
  loadMode: varchar('load_mode', { length: 16 }).notNull().default('full'),
  adjustedByAi: boolean('adjusted_by_ai').notNull().default(false),
  // Denormalized — which plan day this calendar day is anchored to.
  // Slides: stays at K+1 until day K is fully complete.
  currentPlanDay: smallint('current_plan_day'),
  // Daily quote — picked once per day. The id references a quote in
  // content/coding-prep-quotes.json. The reflection is the AI-generated
  // one-sentence "why this quote, today" connector that ties the chosen
  // quote to the user's recent journal entries and plan-day focus.
  // Cached so refreshes don't re-trigger the HF call and the quote stays
  // anchored to the day in the activity feed.
  dailyQuoteId: varchar('daily_quote_id', { length: 64 }),
  dailyQuoteReflection: text('daily_quote_reflection').notNull().default(''),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type PrepDailyLogRow = typeof prepDailyLog.$inferSelect
export type NewPrepDailyLog = typeof prepDailyLog.$inferInsert

/**
 * Routine checklist tasks keyed by stable id. Separate from prep_progress
 * (which is 10-day plan tasks) so editing the routine never breaks plan
 * progress. IDs are calendar-date-scoped so the same task on different
 * days has different rows.
 */
export const prepTodayTasks = pgTable('prep_today_tasks', {
  taskId: varchar('task_id', { length: 128 }).primaryKey(),
  completedAt: timestamp('completed_at').notNull().defaultNow(),
})

export type PrepTodayTaskRow = typeof prepTodayTasks.$inferSelect

/** Pomodoro sessions. One row per started session, completion is best-effort. */
export const prepPomodoros = pgTable('prep_pomodoros', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  durationSeconds: integer('duration_seconds').notNull(),
  kind: varchar('kind', { length: 16 }).notNull().default('focus'), // 'focus' | 'break'
})

export type PrepPomodoroRow = typeof prepPomodoros.$inferSelect
export type NewPrepPomodoro = typeof prepPomodoros.$inferInsert

/** Job applications. */
export const prepApplications = pgTable('prep_applications', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  sentAt: timestamp('sent_at').notNull().defaultNow(),
  company: varchar('company', { length: 200 }).notNull(),
  role: varchar('role', { length: 200 }).notNull().default(''),
  status: varchar('status', { length: 32 }).notNull().default('applied'), // 'applied' | 'replied' | 'interview' | 'rejected' | 'offer'
  notes: text('notes').notNull().default(''),
})

export type PrepApplicationRow = typeof prepApplications.$inferSelect
export type NewPrepApplication = typeof prepApplications.$inferInsert

/** "Re-solved from blank" log. Drives The Re-Solver badge. */
export const prepResolves = pgTable('prep_resolves', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  problemLabel: varchar('problem_label', { length: 200 }).notNull(),
  resolvedAt: timestamp('resolved_at').notNull().defaultNow(),
})

export type PrepResolveRow = typeof prepResolves.$inferSelect
export type NewPrepResolve = typeof prepResolves.$inferInsert

/** English / words-learned log. */
export const prepWords = pgTable('prep_words', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  logDate: date('log_date').notNull().defaultNow(),
  word: varchar('word', { length: 100 }).notNull(),
  meaning: text('meaning').notNull().default(''),
})

export type PrepWordRow = typeof prepWords.$inferSelect
export type NewPrepWord = typeof prepWords.$inferInsert

/** Unlocked badges — one row per badge, recorded once. */
export const prepBadges = pgTable('prep_badges', {
  badgeId: varchar('badge_id', { length: 64 }).primaryKey(),
  unlockedAt: timestamp('unlocked_at').notNull().defaultNow(),
  meta: jsonb('meta'), // optional: e.g. {streak: 3, problemsSolved: 1}
})

export type PrepBadgeRow = typeof prepBadges.$inferSelect
export type NewPrepBadge = typeof prepBadges.$inferInsert

/**
 * Recruiter-screen interview prep — Q&A reference for /admin/interview-prep.
 * Single-tenant, admin-only. Content is sensitive (recruiter names,
 * internal Walmart system details, layoff context) — DB-backed
 * specifically because the JSON should never live in the public repo.
 */
export const prepInterviewQuestions = pgTable(
  'prep_interview_questions',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    question: text('question').notNull(),
    cues: jsonb('cues')
      .notNull()
      .default(sql`'[]'::jsonb`),
    answer: text('answer').notNull().default(''),
    followUps: jsonb('follow_ups')
      .notNull()
      .default(sql`'[]'::jsonb`),
    cueLine: text('cue_line').notNull().default(''),
    sortOrder: smallint('sort_order').notNull().default(0),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('idx_prep_interview_sort').on(table.sortOrder)]
)

export type PrepInterviewQuestionRow = typeof prepInterviewQuestions.$inferSelect
export type NewPrepInterviewQuestion = typeof prepInterviewQuestions.$inferInsert

/**
 * Reference-library flashcards — SM-2-lite scheduling state, one row
 * per card id (the natural key from content/coding-prep-library.json's
 * topics[].items[].id). The library JSON stays the source of truth for
 * content; this table only stores the *progress* (what the user knows
 * vs hasn't seen). We never persist the question/answer here.
 *
 * Mastered = streak_correct >= 4; the deck drops mastered cards to
 * occasional review (next_due_at pushed far out).
 */
export const prepFlashcards = pgTable(
  'prep_flashcards',
  {
    cardId: varchar('card_id', { length: 64 }).primaryKey(),
    lastGrade: varchar('last_grade', { length: 16 }),
    lastSeen: timestamp('last_seen'),
    timesSeen: integer('times_seen').notNull().default(0),
    timesMissed: integer('times_missed').notNull().default(0),
    timesCorrect: integer('times_correct').notNull().default(0),
    streakCorrect: smallint('streak_correct').notNull().default(0),
    intervalDays: smallint('interval_days').notNull().default(0),
    easeFactor: integer('ease_factor_x100').notNull().default(250), // 2.50 stored as int x100 to avoid float drift
    nextDueAt: timestamp('next_due_at').notNull().defaultNow(),
  },
  (table) => [index('idx_prep_flashcards_due').on(table.nextDueAt)]
)

export type PrepFlashcardRow = typeof prepFlashcards.$inferSelect
export type NewPrepFlashcard = typeof prepFlashcards.$inferInsert

/**
 * XP ledger — append-only. Every grant is one row; revocations are
 * matching negative-XP rows so SUM(xp) is the canonical total. The
 * UNIQUE (action, source_id) constraint makes grants idempotent —
 * re-running a mutation can't double-credit. Source IDs encode the
 * thing that produced the XP, e.g. `task:d1-c-1`, `app:42`,
 * `anchor:2026-06-06`, `fullday:2026-06-06`.
 */
export const prepXpEvents = pgTable(
  'prep_xp_events',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    occurredAt: timestamp('occurred_at').notNull().defaultNow(),
    action: varchar('action', { length: 32 }).notNull(),
    sourceId: varchar('source_id', { length: 80 }).notNull(),
    xp: integer('xp').notNull(),
  },
  (table) => [
    uniqueIndex('uq_prep_xp_action_source').on(table.action, table.sourceId),
    index('idx_prep_xp_occurred_at').on(table.occurredAt),
  ]
)

export type PrepXpEventRow = typeof prepXpEvents.$inferSelect
export type NewPrepXpEvent = typeof prepXpEvents.$inferInsert

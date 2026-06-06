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

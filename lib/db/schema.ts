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

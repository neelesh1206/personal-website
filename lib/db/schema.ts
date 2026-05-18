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

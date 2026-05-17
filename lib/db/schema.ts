import { pgTable, serial, varchar, text, timestamp } from 'drizzle-orm/pg-core'

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

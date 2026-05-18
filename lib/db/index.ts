import { neon } from '@neondatabase/serverless'
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from './schema'

type Schema = typeof schema
type DB = NeonHttpDatabase<Schema>

let _db: DB | null = null

function getDb(): DB {
  if (_db) return _db
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Add it to .env.local (or your hosting provider environment variables).'
    )
  }
  const sql = neon(url)
  _db = drizzle(sql, { schema })
  return _db
}

export const db = new Proxy({} as DB, {
  get(_target, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>
    const value = real[prop]
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(real)
      : value
  },
}) as DB

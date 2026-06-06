import { NextResponse, type NextRequest } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { addWord, getWords } from '@/lib/admin/prep/queries'

export const runtime = 'nodejs'

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const rows = await getWords()
  return NextResponse.json({ words: rows })
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: { word?: unknown; meaning?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const word = typeof body.word === 'string' ? body.word.trim() : ''
  if (!word) return NextResponse.json({ error: 'word required' }, { status: 400 })
  const meaning = typeof body.meaning === 'string' ? body.meaning.slice(0, 1000) : ''
  const row = await addWord(word.slice(0, 100), meaning)
  return NextResponse.json({ ok: true, word: row })
}

// Browser-side helper for the Hardcover link. All traffic goes through the
// /api/hardcover function (which holds the secret token) — see
// api/hardcover.ts. Nothing here ever sees the Hardcover token.

import { supabase } from '@/lib/supabaseClient'

export interface HcRead {
  startedAt?: string // YYYY-MM-DD
  finishedAt?: string // YYYY-MM-DD
}

/** One book in your Hardcover library, flattened to what Ad Astra needs. */
export interface HcEntry {
  userBookId: number
  bookId: number
  editionId?: number
  title: string
  authors: string[]
  /** Hardcover status: 1 want to read, 2 reading, 3 read, 4 did not finish, 5 paused. */
  statusId: number
  rating?: number
  isbn13?: string
  isbn10?: string
  asin?: string
  editionFormat?: string
  physicalFormat?: string
  readingFormat?: string
  editionPages?: number
  reads: HcRead[]
  /** Mood tag names, most-tagged first. */
  moods: string[]
}

export const HC_STATUS_LABELS: Record<number, string> = {
  1: 'Want to read',
  2: 'Reading',
  3: 'Read',
  4: 'Did not finish',
  5: 'Paused',
}

type Json = Record<string, unknown>

const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined)
const num = (v: unknown): number | undefined => {
  const n = typeof v === 'string' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined
}
const day = (v: unknown): string | undefined => str(v)?.slice(0, 10)

/** Hardcover's cached_tags is { Genre: [{tag,count,…}], Mood: [...], … }. */
function tagNames(cached: unknown, category: string): string[] {
  if (!cached || typeof cached !== 'object') return []
  const list = (cached as Json)[category]
  if (!Array.isArray(list)) return []
  return list.map((t) => str((t as Json)?.tag)).filter((t): t is string => !!t)
}

function authorNames(cached: unknown): string[] {
  if (!Array.isArray(cached)) return []
  return cached
    .map((c) => str(((c as Json)?.author as Json | undefined)?.name))
    .filter((n): n is string => !!n)
}

export function normalizeHcEntry(raw: Json): HcEntry | undefined {
  const book = raw.book as Json | undefined
  const edition = raw.edition as Json | null | undefined
  const userBookId = num(raw.id)
  const bookId = num(book?.id)
  const title = str(book?.title)
  if (userBookId == null || bookId == null || !title) return undefined
  const reads = Array.isArray(raw.user_book_reads)
    ? (raw.user_book_reads as Json[]).map((r) => ({ startedAt: day(r.started_at), finishedAt: day(r.finished_at) }))
    : []
  return {
    userBookId,
    bookId,
    editionId: num(raw.edition_id) ?? num(edition?.id),
    title,
    authors: authorNames(book?.cached_contributors),
    statusId: num(raw.status_id) ?? 0,
    rating: num(raw.rating),
    isbn13: str(edition?.isbn_13),
    isbn10: str(edition?.isbn_10),
    asin: str(edition?.asin)?.toUpperCase(),
    editionFormat: str(edition?.edition_format),
    physicalFormat: str(edition?.physical_format),
    readingFormat: str((edition?.reading_format as Json | null | undefined)?.format),
    editionPages: num(edition?.pages),
    reads,
    moods: tagNames(book?.cached_tags, 'Mood'),
  }
}

/** "Paperback · 416 pp" style summary of an edition's format and length. */
export function editionDetail(e: {
  readingFormat?: string
  physicalFormat?: string
  editionFormat?: string
  pages?: number
}): string {
  const kind = e.physicalFormat ?? e.editionFormat
  const parts = [e.readingFormat && e.readingFormat !== kind ? e.readingFormat : undefined, kind]
  const text = parts.filter(Boolean).join(' ')
  return [text || undefined, e.pages ? `${e.pages} pp` : undefined].filter(Boolean).join(' · ')
}

export interface HcEdition {
  detail: string
  pages?: number
}

/** Format and page count for each of the given ISBNs / ASINs, keyed by the code you asked about
 *  (upper-case). Codes Hardcover doesn't know are simply absent. */
export async function fetchEditionsByCode(codes: string[]): Promise<Map<string, HcEdition>> {
  const out = new Map<string, HcEdition>()
  const wanted = Array.from(new Set(codes.map((c) => c.toUpperCase())))
  if (wanted.length === 0) return out
  if (!supabase) throw new Error('Hardcover needs the Supabase (signed-in) version of the app.')
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Not signed in.')

  for (let i = 0; i < wanted.length; i += 100) {
    const chunk = wanted.slice(i, i + 100)
    const res = await fetch('/api/hardcover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ op: 'editions', codes: chunk }),
    })
    const json = (await res.json().catch(() => undefined)) as { ok?: boolean; error?: string; editions?: Json[] } | undefined
    if (!res.ok || !json?.ok) throw new Error(json?.error ?? `Hardcover request failed (HTTP ${res.status})`)
    for (const ed of json.editions ?? []) {
      const info: HcEdition = {
        detail: editionDetail({
          readingFormat: str((ed.reading_format as Json | null | undefined)?.format),
          physicalFormat: str(ed.physical_format),
          editionFormat: str(ed.edition_format),
          pages: num(ed.pages),
        }),
        pages: num(ed.pages),
      }
      for (const code of [str(ed.isbn_13), str(ed.isbn_10), str(ed.asin)]) {
        if (code && !out.has(code.toUpperCase())) out.set(code.toUpperCase(), info)
      }
    }
  }
  return out
}

/** Fetches your whole Hardcover library through the server function. */
export async function fetchHardcoverLibrary(): Promise<{ username?: string; entries: HcEntry[] }> {
  if (!supabase) throw new Error('Hardcover needs the Supabase (signed-in) version of the app.')
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Not signed in.')

  const res = await fetch('/api/hardcover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ op: 'library' }),
  })
  let json: { ok?: boolean; error?: string; user?: { username?: string }; items?: Json[] } | undefined
  try {
    json = await res.json()
  } catch {
    // Vercel returned a page instead of JSON — almost always "function not deployed yet".
    throw new Error(`The Hardcover function didn't answer (HTTP ${res.status}). Has the latest deploy finished?`)
  }
  if (!res.ok || !json?.ok) throw new Error(json?.error ?? `Hardcover request failed (HTTP ${res.status})`)
  const entries = (json.items ?? []).map(normalizeHcEntry).filter((e): e is HcEntry => !!e)
  return { username: json.user?.username, entries }
}

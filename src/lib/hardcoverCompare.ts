// One-time comparison of what Ad Astra has vs what Hardcover has, book by
// book. Pure functions only — nothing here writes anything. Each difference
// carries the exact patch that "use Hardcover's" would apply, so the UI can
// show it, and the person approves it, before anything in Ad Astra changes.
//
// Only books that are Reading / Paused / Read / DNF are compared; TBR books
// are ignored. A difference is only raised when there is something real to
// choose between: Hardcover never blanks something Ad Astra has, and a
// value that's missing on Hardcover is simply left for the later sync.

import type { Book, BookReadStatus } from '@/types/library'
import { appDayKey } from '@/lib/appDate'
import { MOOD_SCORES, moodsOf } from '@/lib/moods'
import type { HcEntry, HcRead } from '@/lib/hardcover'

export const REVIEWED_STATUSES: BookReadStatus[] = ['reading', 'paused', 'read', 'dnf']

/** Hardcover tags moods by popularity; keep the top few, like StoryGraph's headline moods. */
export const HC_MOOD_LIMIT = 3

export type FieldKey = 'dates' | 'isbn' | 'rating' | 'moods'
export const FIELD_LABELS: Record<FieldKey, string> = {
  dates: 'Dates read',
  isbn: 'Edition / ISBN',
  rating: 'Overall rating',
  moods: 'Moods',
}

export type MatchHow = 'linked' | 'isbn' | 'title'

export interface FieldDiff {
  field: FieldKey
  adLabel: string
  hcLabel: string
  /** What choosing Hardcover's value writes to the book. */
  patch: Partial<Book>
}

export interface CompareRow {
  book: Book
  entry: HcEntry
  how: MatchHow
  diffs: FieldDiff[]
}

export interface CompareResult {
  rows: CompareRow[]
  /** Eligible books with no counterpart in the Hardcover library. */
  unmatched: Book[]
}

// --- ISBN helpers ---------------------------------------------------------

function cleanIsbn(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const s = raw.replace(/[\s-]/g, '').toUpperCase()
  if (/^97[89]\d{10}$/.test(s) || /^\d{9}[\dX]$/.test(s)) return s
  return undefined
}

/** ISBN-10 → ISBN-13 so editions can be matched regardless of which form each side has. */
export function toIsbn13(raw: string | undefined): string | undefined {
  const s = cleanIsbn(raw)
  if (!s) return undefined
  if (s.length === 13) return s
  const body = '978' + s.slice(0, 9)
  let sum = 0
  for (let i = 0; i < 12; i++) sum += Number(body[i]) * (i % 2 === 0 ? 1 : 3)
  return body + String((10 - (sum % 10)) % 10)
}

// --- title helpers --------------------------------------------------------

function norm(s: string | undefined): string {
  return (s ?? '')
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/^(the|a|an)\s+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function mainTitle(s: string): string {
  return norm(s.split(/[:–—]/)[0])
}

function lastName(name: string | undefined): string {
  const parts = norm(name).split(' ').filter(Boolean)
  return parts[parts.length - 1] ?? ''
}

// --- matching -------------------------------------------------------------

function matchBooks(books: Book[], entries: HcEntry[]) {
  const used = new Set<number>()
  const matched: { book: Book; entry: HcEntry; how: MatchHow }[] = []
  const left: Book[] = []

  const byUserBook = new Map(entries.map((e) => [e.userBookId, e]))
  const byBookId = new Map<number, HcEntry>()
  for (const e of entries) if (!byBookId.has(e.bookId)) byBookId.set(e.bookId, e)
  const byIsbn = new Map<string, HcEntry>()
  for (const e of entries) {
    for (const code of [toIsbn13(e.isbn13), toIsbn13(e.isbn10)]) if (code && !byIsbn.has(code)) byIsbn.set(code, e)
  }

  const take = (book: Book, entry: HcEntry | undefined, how: MatchHow): boolean => {
    if (!entry || used.has(entry.userBookId)) return false
    used.add(entry.userBookId)
    matched.push({ book, entry, how })
    return true
  }

  // Pass 1: already-linked books, then ISBN.
  const pending: Book[] = []
  for (const book of books) {
    const linked =
      (book.hardcoverUserBookId != null ? byUserBook.get(book.hardcoverUserBookId) : undefined) ??
      (book.hardcoverBookId != null ? byBookId.get(book.hardcoverBookId) : undefined)
    if (take(book, linked, 'linked')) continue
    const code = toIsbn13(book.isbn)
    if (code && take(book, byIsbn.get(code), 'isbn')) continue
    pending.push(book)
  }

  // Pass 2: title (exact, then title-before-the-colon) with a matching author surname.
  for (const book of pending) {
    const wantFull = norm(book.title)
    const wantMain = mainTitle(book.title)
    const wantLast = lastName(book.author)
    const free = entries.filter((e) => !used.has(e.userBookId))
    const authorOk = (e: HcEntry) => !wantLast || e.authors.length === 0 || e.authors.some((a) => lastName(a) === wantLast)
    const hit =
      free.find((e) => norm(e.title) === wantFull && authorOk(e)) ??
      free.find((e) => wantMain.length > 3 && mainTitle(e.title) === wantMain && authorOk(e))
    if (!take(book, hit, 'title')) left.push(book)
  }

  return { matched, unmatched: left }
}

// --- differences ----------------------------------------------------------

const toStamp = (dayKey: string) => `${dayKey}T00:00:00.000Z` // date-only values are stored at 00:00 UTC (see appDate.ts)
const roundHalf = (n: number) => Math.round(n * 2) / 2
const fmtDay = (d: string | undefined) => d ?? '—'

/** Hardcover can hold several reads (re-reads); compare against the latest finished one. */
function primaryRead(reads: HcRead[]): HcRead | undefined {
  const finished = reads.filter((r) => r.finishedAt)
  if (finished.length > 0) return [...finished].sort((a, b) => (a.finishedAt! < b.finishedAt! ? -1 : 1))[finished.length - 1]
  return reads[reads.length - 1]
}

function diffDates(book: Book, entry: HcEntry): FieldDiff | undefined {
  const read = primaryRead(entry.reads)
  if (!read) return undefined
  const adStart = book.startedAt ? appDayKey(book.startedAt) : undefined
  const adEnd = book.completedAt ? appDayKey(book.completedAt) : undefined
  const startDiffers = !!read.startedAt && read.startedAt !== adStart
  const endDiffers = !!read.finishedAt && read.finishedAt !== adEnd
  if (!startDiffers && !endDiffers) return undefined
  const patch: Partial<Book> = {}
  if (read.startedAt) patch.startedAt = toStamp(read.startedAt)
  if (read.finishedAt) patch.completedAt = toStamp(read.finishedAt)
  const extra = entry.reads.length > 1 ? ` (${entry.reads.length} reads on Hardcover — latest shown)` : ''
  return {
    field: 'dates',
    adLabel: `Started ${fmtDay(adStart)} · Finished ${fmtDay(adEnd)}`,
    hcLabel: `Started ${fmtDay(read.startedAt)} · Finished ${fmtDay(read.finishedAt)}${extra}`,
    patch,
  }
}

function diffIsbn(book: Book, entry: HcEntry): FieldDiff | undefined {
  const hc13 = toIsbn13(entry.isbn13) ?? toIsbn13(entry.isbn10)
  if (!hc13) return undefined
  if (toIsbn13(book.isbn) === hc13) return undefined
  const detail = [entry.editionFormat, entry.editionPages ? `${entry.editionPages} pp` : undefined].filter(Boolean).join(' · ')
  return {
    field: 'isbn',
    adLabel: book.isbn ? book.isbn : 'none on file',
    hcLabel: detail ? `${hc13} · ${detail}` : hc13,
    patch: { isbn: hc13, ...(entry.editionId != null ? { hardcoverEditionId: entry.editionId } : {}) },
  }
}

function diffRating(book: Book, entry: HcEntry): FieldDiff | undefined {
  const hc = entry.rating
  if (hc == null || hc <= 0) return undefined
  // Hardcover only stores half stars, so a quarter-star rating that rounds to
  // Hardcover's value is the same rating, not a conflict.
  if (book.rating != null && roundHalf(book.rating) === hc) return undefined
  return {
    field: 'rating',
    adLabel: book.rating != null ? `${book.rating} ★` : 'not rated',
    hcLabel: `${hc} ★`,
    patch: { rating: hc },
  }
}

const normTag = (t: string) => t.trim().toLowerCase()

function diffMoods(book: Book, entry: HcEntry): FieldDiff | undefined {
  const hcMoods = Array.from(new Set(entry.moods.map(normTag))).slice(0, HC_MOOD_LIMIT)
  if (hcMoods.length === 0) return undefined
  const ad = moodsOf(book)
  if (ad.length === hcMoods.length && ad.every((m) => hcMoods.includes(m))) return undefined
  // Replace only the mood tags; every other tag on the book stays put.
  const kept = book.tags.filter((t) => !(normTag(t) in MOOD_SCORES))
  return {
    field: 'moods',
    adLabel: ad.length ? ad.join(', ') : 'none',
    hcLabel: hcMoods.join(', '),
    patch: { tags: [...kept, ...hcMoods] },
  }
}

export function compareLibraries(books: Book[], entries: HcEntry[]): CompareResult {
  const eligible = books.filter((b) => REVIEWED_STATUSES.includes(b.readStatus))
  const { matched, unmatched } = matchBooks(eligible, entries)
  const rows: CompareRow[] = matched.map(({ book, entry, how }) => ({
    book,
    entry,
    how,
    diffs: [diffDates(book, entry), diffIsbn(book, entry), diffRating(book, entry), diffMoods(book, entry)].filter(
      (d): d is FieldDiff => !!d,
    ),
  }))
  return { rows, unmatched }
}

/** The link fields saved with a row so the later sync knows which Hardcover entry is which.
 *  The Hardcover edition is only linked when it is the edition the book ends up on: either
 *  the ISBNs already agreed (no difference raised) or the person picked Hardcover's. */
export function linkPatch(row: CompareRow, picks: Partial<Record<FieldKey, 'ad' | 'hc'>>): Partial<Book> {
  const isbnDiff = row.diffs.find((d) => d.field === 'isbn')
  const editionIsSettled = !isbnDiff || picks.isbn === 'hc'
  return {
    hardcoverBookId: row.entry.bookId,
    hardcoverUserBookId: row.entry.userBookId,
    ...(editionIsSettled && row.entry.editionId != null ? { hardcoverEditionId: row.entry.editionId } : {}),
  }
}

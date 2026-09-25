import type { Book, ReadingLog } from '@/types/library'
import { lengthBucketFor } from '@/types/library'
import { progressInPages } from './readingStats'

// --- Progress display -------------------------------------------------

export interface BookProgress {
  latestLog?: ReadingLog
  /** Equivalent pages read so far, if derivable. */
  pages: number | null
  /** Equivalent total pages for this book (its totalPages field). */
  totalPages: number | null
  /** 0-100, if derivable (either logged directly or via pages/totalPages). */
  percent: number | null
  /** What unit the *next* log entry for this book should be taken in. */
  unit: 'page' | 'percent'
  /** True when we have a % log but can't convert to pages because
   *  totalPages isn't set yet — the log form should ask for an estimate. */
  needsPageEstimate: boolean
}

/** Current progress snapshot for a book, from its most recent reading log. */
export function getBookProgress(book: Book, logs: ReadingLog[]): BookProgress {
  const unit: 'page' | 'percent' = book.format === 'print' || book.format === 'tbd' ? 'page' : 'percent'
  const bookLogs = logs
    .filter((l) => l.bookId === book.id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  const latestLog = bookLogs[0]

  if (!latestLog) {
    return { latestLog: undefined, pages: null, totalPages: book.totalPages ?? null, percent: null, unit, needsPageEstimate: false }
  }

  const pages = progressInPages(book, latestLog)
  const needsPageEstimate = latestLog.percentComplete != null && book.totalPages == null

  let percent: number | null = null
  if (latestLog.percentComplete != null) {
    percent = latestLog.percentComplete
  } else if (pages != null && book.totalPages) {
    percent = Math.round((pages / book.totalPages) * 100)
  }

  return {
    latestLog,
    pages,
    totalPages: book.totalPages ?? null,
    percent,
    unit,
    needsPageEstimate,
  }
}

/** Most recent activity date for a book — last reading log, else startedAt,
 *  else updatedAt. Used to order the "In Progress" shelf, top-of-shelf =
 *  most recently touched. */
export function lastActivityDate(book: Book, logs: ReadingLog[]): string {
  const bookLogs = logs.filter((l) => l.bookId === book.id)
  if (bookLogs.length > 0) {
    return bookLogs.reduce((latest, l) => (l.date > latest ? l.date : latest), bookLogs[0].date)
  }
  return book.startedAt ?? book.updatedAt
}

// --- Tag spines ---------------------------------------------------------

/** Every "spine" a book should appear under on the tag shelf: its own
 *  tags, its genre, and an auto-generated length bucket. Deduped, and
 *  genre/length are just folded in as tags rather than kept separate —
 *  from the shelf's point of view they're all just categories to browse. */
export function spinesFor(book: Book): string[] {
  const spines = new Set<string>(book.tags)
  if (book.genre) spines.add(book.genre)
  const bucket = lengthBucketFor(book.totalPages)
  if (bucket) spines.add(bucket)
  return Array.from(spines)
}

/** All distinct spines across a set of books, with how many books are on
 *  each — used to render the tag shelf and skip empty categories. */
export function allSpines(books: Book[]): { label: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const book of books) {
    for (const spine of spinesFor(book)) {
      counts.set(spine, (counts.get(spine) ?? 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

// --- Next Reads -----------------------------------------------------

/** Simple seeded RNG (mulberry32) so the random picks below are stable
 *  for a given seed rather than reshuffling on every render. */
function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return h
}

/** Picks the "Next Reads" shelf: your manually pinned (isNextUp) TBR books
 *  first, then fills any remaining slots (up to `count`) with a random
 *  pick from the rest of the TBR pool. The random fill is seeded by the
 *  day + the pool's book IDs, so it stays put across re-renders and only
 *  rotates once a day rather than shuffling on every interaction. */
export function pickNextReads(books: Book[], count = 4): Book[] {
  const tbr = books.filter((b) => b.readStatus === 'want_to_read')
  const pinned = tbr.filter((b) => b.isNextUp)
  const rest = tbr.filter((b) => !b.isNextUp)

  const picks = [...pinned].slice(0, count)
  const remainingSlots = count - picks.length
  if (remainingSlots <= 0) return picks

  const seed = hashString(new Date().toDateString() + rest.map((b) => b.id).sort().join(','))
  const rng = mulberry32(seed)
  const shuffled = [...rest]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return [...picks, ...shuffled.slice(0, remainingSlots)]
}

// --- Shelf layout ---------------------------------------------------

/** Chunk a flat list into shelf rows for display. */
export function toShelfRows<T>(items: T[], perRow = 3): T[][] {
  const rows: T[][] = []
  for (let i = 0; i < items.length; i += perRow) {
    rows.push(items.slice(i, i + perRow))
  }
  return rows
}

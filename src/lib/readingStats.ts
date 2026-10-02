import { addDays, appDayKey, appToday, weekdayOf } from './appDate'
import type { Book, ReadingLog } from '@/types/library'

// --- Core conversion: turn whatever progress marker was logged (current
// page, audiobook position, or percent) into a common "pages" unit, using
// the book's totalPages/totalMinutes where needed. Returns null when it
// can't be determined (e.g. percent logged but no totalPages known). ---
export function progressInPages(book: Book, log: ReadingLog): number | null {
  if (log.currentPage != null) return log.currentPage
  if (log.percentComplete != null && book.totalPages) {
    return (log.percentComplete / 100) * book.totalPages
  }
  if (log.currentTimeMinutes != null && book.totalMinutes && book.totalPages) {
    return (log.currentTimeMinutes / book.totalMinutes) * book.totalPages
  }
  return null
}

export interface DerivedLog {
  log: ReadingLog
  book: Book
  pagesRead: number | null // derived delta since the previous log for this book
  speedPagesPerHour: number | null
}

/** Every log entry with its derived "pages read" (delta vs. the previous
 *  entry for that book) and reading speed. This is what all the stats
 *  below are built from — nothing here is typed in by the user. */
export function deriveLogs(books: Book[], logs: ReadingLog[]): DerivedLog[] {
  const bookById = new Map(books.map((b) => [b.id, b]))
  const byBook = new Map<string, ReadingLog[]>()
  for (const l of logs) {
    byBook.set(l.bookId, [...(byBook.get(l.bookId) ?? []), l])
  }

  const result: DerivedLog[] = []
  for (const [bookId, bookLogs] of byBook) {
    const book = bookById.get(bookId)
    if (!book) continue
    const sorted = [...bookLogs].sort(
      (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
    )
    let previousPages = 0
    for (const log of sorted) {
      const currentPages = progressInPages(book, log)
      let pagesRead: number | null = null
      if (currentPages != null) {
        pagesRead = Math.max(0, Math.round(currentPages - previousPages))
        previousPages = currentPages
      }
      const speedPagesPerHour =
        pagesRead != null && log.minutesSpentReading
          ? Math.round((pagesRead / log.minutesSpentReading) * 60)
          : null
      result.push({ log, book, pagesRead, speedPagesPerHour })
    }
  }
  return result
}

/** start / end are app-day keys (YYYY-MM-DD, inclusive). */
function inRange(dateStr: string, start: string, end: string): boolean {
  const key = appDayKey(dateStr)
  return key >= start && key <= end
}

export function pagesReadInRange(derived: DerivedLog[], start: string, end: string): number {
  return derived
    .filter((d) => inRange(d.log.date, start, end))
    .reduce((sum, d) => sum + (d.pagesRead ?? 0), 0)
}

/** Books whose completedAt falls in range — status/rating now live on the
 *  book itself (Phase 6), not on a per-log completion flag. */
export function booksCompletedInRange(books: Book[], start: string, end: string): number {
  return books.filter(
    (b) => b.readStatus === 'read' && b.completedAt && inRange(b.completedAt, start, end),
  ).length
}

/** Consecutive app days up to today with at least one reading log entry. */
export function currentStreakDays(logs: ReadingLog[], today: Date = new Date()): number {
  const days = new Set(logs.map((l) => appDayKey(l.date)))
  let streak = 0
  let cursor = appToday(today)
  while (days.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

// --- Insights panel aggregations ---

export interface DayBucket {
  label: string
  pages: number
}

/** Pages read per day for the last N days (including empty days). */
export function pagesByDay(derived: DerivedLog[], days = 14): DayBucket[] {
  const today = appToday()
  const buckets: DayBucket[] = []
  for (let i = days - 1; i >= 0; i--) {
    const key = addDays(today, -i)
    const pages = derived
      .filter((x) => appDayKey(x.log.date) === key)
      .reduce((sum, x) => sum + (x.pagesRead ?? 0), 0)
    buckets.push({ label: key.slice(5), pages })
  }
  return buckets
}

/** Pages read per month for the current year. */
export function pagesByMonth(derived: DerivedLog[], year = Number(appToday().slice(0, 4))): DayBucket[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months.map((label, i) => {
    const mm = String(i + 1).padStart(2, '0')
    const start = `${year}-${mm}-01`
    const end = `${year}-${mm}-${String(new Date(Date.UTC(year, i + 1, 0)).getUTCDate()).padStart(2, '0')}`
    return { label, pages: pagesReadInRange(derived, start, end) }
  })
}

/** Books completed per month for the current year. */
export function booksByMonth(books: Book[], year = Number(appToday().slice(0, 4))): DayBucket[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months.map((label, i) => {
    const mm = String(i + 1).padStart(2, '0')
    const start = `${year}-${mm}-01`
    const end = `${year}-${mm}-${String(new Date(Date.UTC(year, i + 1, 0)).getUTCDate()).padStart(2, '0')}`
    return { label, pages: booksCompletedInRange(books, start, end) }
  })
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** How many log entries were made on each day of the week. */
export function dayOfWeekFrequency(logs: ReadingLog[]): DayBucket[] {
  const counts = new Array(7).fill(0)
  for (const l of logs) {
    counts[weekdayOf(appDayKey(l.date))] += 1
  }
  return DAY_NAMES.map((label, i) => ({ label, pages: counts[i] }))
}

export function mostFrequentDayOfWeek(logs: ReadingLog[]): string | null {
  if (logs.length === 0) return null
  const freq = dayOfWeekFrequency(logs)
  return freq.reduce((best, cur) => (cur.pages > best.pages ? cur : best)).label
}

/** Average pages/hour across all log entries with a known speed. */
export function averageReadingSpeed(derived: DerivedLog[]): number | null {
  const withSpeed = derived.filter((d) => d.speedPagesPerHour != null)
  if (withSpeed.length === 0) return null
  const total = withSpeed.reduce((sum, d) => sum + (d.speedPagesPerHour ?? 0), 0)
  return Math.round(total / withSpeed.length)
}

export interface Breakdown {
  label: string
  count: number
  percent: number
}

function breakdownBy<T>(items: T[], keyOf: (item: T) => string | undefined): Breakdown[] {
  const counts = new Map<string, number>()
  let total = 0
  for (const item of items) {
    const key = keyOf(item)
    if (!key) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
    total += 1
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count, percent: total ? Math.round((count / total) * 100) : 0 }))
    .sort((a, b) => b.count - a.count)
}

export function formatBreakdown(books: Book[]): Breakdown[] {
  return breakdownBy(books, (b) => b.format)
}

export function genreBreakdown(books: Book[]): Breakdown[] {
  return breakdownBy(books, (b) => b.genre)
}

export function ownershipBreakdown(books: Book[]): Breakdown[] {
  return breakdownBy(books, (b) => b.ownership)
}

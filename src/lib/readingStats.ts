import type { Book, ReadingSession } from '@/types/reading'

// --- Core conversion: turn whatever progress marker was logged (current
// page, audiobook position, or percent) into a common "pages" unit, using
// the book's totalPages/totalMinutes where needed. Returns null when it
// can't be determined (e.g. percent logged but no totalPages known). ---
export function progressInPages(book: Book, session: ReadingSession): number | null {
  if (session.currentPage != null) return session.currentPage
  if (session.percentComplete != null && book.totalPages) {
    return (session.percentComplete / 100) * book.totalPages
  }
  if (session.currentTimeMinutes != null && book.totalMinutes && book.totalPages) {
    return (session.currentTimeMinutes / book.totalMinutes) * book.totalPages
  }
  return null
}

export interface DerivedSession {
  session: ReadingSession
  book: Book
  pagesRead: number | null // derived delta since the previous session of this book
  speedPagesPerHour: number | null
}

/** Every session with its derived "pages read" (delta vs. the previous
 *  session for that book) and reading speed. This is what all the stats
 *  below are built from — nothing here is typed in by the user. */
export function deriveSessions(books: Book[], sessions: ReadingSession[]): DerivedSession[] {
  const bookById = new Map(books.map((b) => [b.id, b]))
  const byBook = new Map<string, ReadingSession[]>()
  for (const s of sessions) {
    byBook.set(s.bookId, [...(byBook.get(s.bookId) ?? []), s])
  }

  const result: DerivedSession[] = []
  for (const [bookId, bookSessions] of byBook) {
    const book = bookById.get(bookId)
    if (!book) continue
    const sorted = [...bookSessions].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
    let previousPages = 0
    for (const session of sorted) {
      const currentPages = progressInPages(book, session)
      let pagesRead: number | null = null
      if (currentPages != null) {
        pagesRead = Math.max(0, Math.round(currentPages - previousPages))
        previousPages = currentPages
      }
      const speedPagesPerHour =
        pagesRead != null && session.minutesSpentReading
          ? Math.round((pagesRead / session.minutesSpentReading) * 60)
          : null
      result.push({ session, book, pagesRead, speedPagesPerHour })
    }
  }
  return result
}

function inRange(dateStr: string, start: Date, end: Date): boolean {
  const d = new Date(dateStr)
  return d >= start && d <= end
}

export function pagesReadInRange(derived: DerivedSession[], start: Date, end: Date): number {
  return derived
    .filter((d) => inRange(d.session.date, start, end))
    .reduce((sum, d) => sum + (d.pagesRead ?? 0), 0)
}

export function booksCompletedInRange(
  sessions: ReadingSession[],
  start: Date,
  end: Date,
): number {
  return sessions.filter((s) => s.completionStatus === 'completed' && inRange(s.date, start, end)).length
}

/** Consecutive days up to today with at least one reading session logged. */
export function currentStreakDays(sessions: ReadingSession[], today: Date = new Date()): number {
  const days = new Set(sessions.map((s) => s.date.slice(0, 10)))
  let streak = 0
  const cursor = new Date(today)
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// --- Insights panel aggregations ---

export interface DayBucket {
  label: string
  pages: number
}

/** Pages read per day for the last N days (including empty days). */
export function pagesByDay(derived: DerivedSession[], days = 14): DayBucket[] {
  const today = new Date()
  const buckets: DayBucket[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const pages = derived
      .filter((x) => x.session.date.slice(0, 10) === key)
      .reduce((sum, x) => sum + (x.pagesRead ?? 0), 0)
    buckets.push({ label: key.slice(5), pages })
  }
  return buckets
}

/** Pages read per month for the current year. */
export function pagesByMonth(derived: DerivedSession[], year = new Date().getFullYear()): DayBucket[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months.map((label, i) => {
    const start = new Date(year, i, 1)
    const end = new Date(year, i + 1, 0, 23, 59, 59)
    return { label, pages: pagesReadInRange(derived, start, end) }
  })
}

/** Books completed per month for the current year. */
export function booksByMonth(sessions: ReadingSession[], year = new Date().getFullYear()): DayBucket[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months.map((label, i) => {
    const start = new Date(year, i, 1)
    const end = new Date(year, i + 1, 0, 23, 59, 59)
    return { label, pages: booksCompletedInRange(sessions, start, end) }
  })
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** How many sessions were logged on each day of the week. */
export function dayOfWeekFrequency(sessions: ReadingSession[]): DayBucket[] {
  const counts = new Array(7).fill(0)
  for (const s of sessions) {
    counts[new Date(s.date).getDay()] += 1
  }
  return DAY_NAMES.map((label, i) => ({ label, pages: counts[i] }))
}

export function mostFrequentDayOfWeek(sessions: ReadingSession[]): string | null {
  if (sessions.length === 0) return null
  const freq = dayOfWeekFrequency(sessions)
  return freq.reduce((best, cur) => (cur.pages > best.pages ? cur : best)).label
}

/** Average pages/hour across all sessions with a known speed. */
export function averageReadingSpeed(derived: DerivedSession[]): number | null {
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

export function sourceBreakdown(books: Book[]): Breakdown[] {
  return breakdownBy(books, (b) => b.source)
}

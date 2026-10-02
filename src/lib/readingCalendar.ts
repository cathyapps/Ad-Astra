import type { Book, ReadingLog } from '@/types/library'
import { appDayKey, appToday } from './appDate'

// All dates here are handled as "YYYY-MM-DD" keys (never through the
// local-timezone Date parser), so a log dated the 5th always lands on the
// 5th regardless of the device's timezone.

export const dayKey = (iso: string): string => appDayKey(iso)

export const todayKey = (): string => appToday()

export function keyToUtcMs(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export interface MonthCell {
  key: string
  day: number
  inMonth: boolean
}

/** Sunday-first month grid, padded with adjacent-month days to full weeks. */
export function buildMonthGrid(year: number, month: number): MonthCell[] {
  const first = new Date(Date.UTC(year, month, 1))
  const lead = first.getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const total = Math.ceil((lead + daysInMonth) / 7) * 7
  const cells: MonthCell[] = []
  for (let i = 0; i < total; i++) {
    const d = new Date(Date.UTC(year, month, 1 - lead + i))
    const key = d.toISOString().slice(0, 10)
    cells.push({ key, day: d.getUTCDate(), inMonth: d.getUTCMonth() === month })
  }
  return cells
}

export function logsByDay(logs: ReadingLog[]): Map<string, ReadingLog[]> {
  const map = new Map<string, ReadingLog[]>()
  for (const l of logs) {
    const k = dayKey(l.date)
    map.set(k, [...(map.get(k) ?? []), l])
  }
  return map
}

export interface BookSpan {
  book: Book
  start: string
  end: string
  /** Still being read (no finish date) — the bar runs to today. */
  ongoing: boolean
}

/** Start-to-finish span for each book that has any dates. Start is the
 *  book's start date, else its first reading log, else its finish date;
 *  end is its finish date, or today if it's still being read. */
export function getBookSpans(books: Book[], logs: ReadingLog[]): BookSpan[] {
  const firstLog = new Map<string, string>()
  for (const l of logs) {
    const k = dayKey(l.date)
    const cur = firstLog.get(l.bookId)
    if (!cur || k < cur) firstLog.set(l.bookId, k)
  }
  const today = todayKey()
  const spans: BookSpan[] = []
  for (const book of books) {
    if (book.readStatus === 'want_to_read') continue
    const finished = book.completedAt ? dayKey(book.completedAt) : undefined
    const start = (book.startedAt ? dayKey(book.startedAt) : undefined) ?? firstLog.get(book.id) ?? finished
    if (!start) continue
    const active = book.readStatus === 'reading' || book.readStatus === 'paused'
    const ongoing = !finished && active
    let end = finished ?? (ongoing ? today : start)
    let from = start
    if (end < from) [from, end] = [end, from]
    spans.push({ book, start: from, end, ongoing })
  }
  return spans.sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end))
}

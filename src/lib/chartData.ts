import type { Book, ReadingLog } from '@/types/library'
import type { ChartConfig, MetricKey, MetricsTimeframe } from '@/types/charts'
import { deriveLogs, type DerivedLog } from './readingStats'

export interface ChartPoint {
  label: string
  value: number
}

const TIME_AXES: MetricKey[] = ['date_day', 'date_week', 'date_month', 'day_of_week']
const CATEGORY_AXES: MetricKey[] = ['genre', 'format', 'ownership']

export function timeframeRange(timeframe: MetricsTimeframe, now: Date = new Date()): { start: Date; end: Date } {
  const end = now
  const start = new Date(now)
  switch (timeframe) {
    case '7d':
      start.setDate(start.getDate() - 6)
      break
    case '30d':
      start.setDate(start.getDate() - 29)
      break
    case '90d':
      start.setDate(start.getDate() - 89)
      break
    case 'ytd':
      start.setMonth(0, 1)
      break
    case '1y':
      start.setFullYear(start.getFullYear() - 1)
      break
    case 'all':
      start.setFullYear(2000)
      break
  }
  start.setHours(0, 0, 0, 0)
  return { start, end }
}

function inRange(dateStr: string, start: Date, end: Date): boolean {
  const d = new Date(dateStr)
  return d >= start && d <= end
}

function dayKey(dateStr: string): string {
  return dateStr.slice(0, 10)
}
function weekKey(dateStr: string): string {
  const d = new Date(dateStr)
  const firstDayOfYear = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - firstDayOfYear.getTime()) / 86400000 + firstDayOfYear.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${week}`
}
function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7)
}
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
function dayOfWeekKey(dateStr: string): string {
  return DAY_NAMES[new Date(dateStr).getDay()]
}

function timeKeyFor(xAxis: MetricKey, dateStr: string): string {
  switch (xAxis) {
    case 'date_day':
      return dayKey(dateStr)
    case 'date_week':
      return weekKey(dateStr)
    case 'date_month':
      return monthKey(dateStr)
    case 'day_of_week':
      return dayOfWeekKey(dateStr)
    default:
      return dateStr
  }
}

function categoryKeyFor(xAxis: MetricKey, book: Book): string | undefined {
  switch (xAxis) {
    case 'genre':
      return book.genre
    case 'format':
      return book.format
    case 'ownership':
      return book.ownership
    default:
      return undefined
  }
}

function aggregateY(yAxis: MetricKey, logs: DerivedLog[], books: Book[]): number {
  switch (yAxis) {
    case 'pages_read':
      return logs.reduce((sum, d) => sum + (d.pagesRead ?? 0), 0)
    case 'minutes_spent':
      return logs.reduce((sum, d) => sum + (d.log.minutesSpentReading ?? 0), 0)
    case 'books_completed':
      return books.filter((b) => b.readStatus === 'read').length
    case 'reading_speed': {
      const withSpeed = logs.filter((d) => d.speedPagesPerHour != null)
      if (withSpeed.length === 0) return 0
      return Math.round(withSpeed.reduce((sum, d) => sum + (d.speedPagesPerHour ?? 0), 0) / withSpeed.length)
    }
    case 'book_count':
      return new Set([...logs.map((d) => d.book.id), ...books.map((b) => b.id)]).size
    default:
      return 0
  }
}

/** Turns a saved ChartConfig into plottable {label, value} points, using
 *  the reading log derivations from readingStats.ts — nothing here is a
 *  precomputed stat, it's all aggregated fresh from books + logs. */
export function computeChartData(
  config: ChartConfig,
  books: Book[],
  logs: ReadingLog[],
  timeframe: MetricsTimeframe,
): ChartPoint[] {
  const { start, end } = timeframeRange(timeframe)
  const allDerived = deriveLogs(books, logs)
  const derivedInRange = allDerived.filter((d) => inRange(d.log.date, start, end))

  if (TIME_AXES.includes(config.xAxis)) {
    const buckets = new Map<string, DerivedLog[]>()
    for (const d of derivedInRange) {
      const key = timeKeyFor(config.xAxis, d.log.date)
      buckets.set(key, [...(buckets.get(key) ?? []), d])
    }
    // books_completed by time bucket needs the book's completedAt, not log dates.
    if (config.yAxis === 'books_completed') {
      const completedBuckets = new Map<string, Book[]>()
      for (const b of books) {
        if (b.readStatus !== 'read' || !b.completedAt || !inRange(b.completedAt, start, end)) continue
        const key = timeKeyFor(config.xAxis, b.completedAt)
        completedBuckets.set(key, [...(completedBuckets.get(key) ?? []), b])
      }
      const keys =
        config.xAxis === 'day_of_week'
          ? DAY_NAMES
          : Array.from(new Set([...buckets.keys(), ...completedBuckets.keys()])).sort()
      return keys.map((label) => ({ label, value: (completedBuckets.get(label) ?? []).length }))
    }
    const keys = config.xAxis === 'day_of_week' ? DAY_NAMES : Array.from(buckets.keys()).sort()
    return keys.map((label) => ({
      label,
      value: aggregateY(config.yAxis, buckets.get(label) ?? [], []),
    }))
  }

  if (CATEGORY_AXES.includes(config.xAxis)) {
    const bookGroups = new Map<string, Book[]>()
    for (const b of books) {
      const key = categoryKeyFor(config.xAxis, b)
      if (!key) continue
      bookGroups.set(key, [...(bookGroups.get(key) ?? []), b])
    }
    return Array.from(bookGroups.entries())
      .map(([label, groupBooks]) => {
        const bookIds = new Set(groupBooks.map((b) => b.id))
        const groupLogs = derivedInRange.filter((d) => bookIds.has(d.book.id))
        return { label, value: aggregateY(config.yAxis, groupLogs, groupBooks) }
      })
      .sort((a, b) => b.value - a.value)
  }

  return []
}

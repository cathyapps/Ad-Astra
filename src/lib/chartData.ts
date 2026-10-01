import type { Book, ReadingLog } from '@/types/library'
import type { ChartConfig, MetricKey, MetricsTimeframe } from '@/types/charts'
import { deriveLogs, type DerivedLog } from './readingStats'
import { averageMood, moodsOf } from './moods'

export interface ChartPoint {
  label: string
  value: number
  /** A representative calendar date (YYYY-MM-DD) for points on a date axis.
   *  Lets the chart renderer thin out / regroup axis labels without
   *  changing the points themselves. */
  date?: string
}

const TIME_AXES: MetricKey[] = ['date_day', 'date_week', 'date_month', 'day_of_week']
const CATEGORY_AXES: MetricKey[] = ['genre', 'format', 'ownership', 'mood']

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
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function dayOfWeekKey(dateStr: string): string {
  return DAY_NAMES[new Date(dateStr).getDay()]
}

/** The bucket key (e.g. "2024-05") stays sortable and unique across
 *  years; this turns it into what's actually shown on the axis. Only
 *  date_month gets special treatment — a bare month name reads far
 *  better than "2024-05", and there's no risk of collapsing distinct
 *  points together since the bucketing key each label maps back to is
 *  still year-qualified. */
function displayLabel(xAxis: MetricKey, key: string): string {
  if (xAxis === 'date_month') {
    const monthIndex = Number(key.slice(5, 7)) - 1
    return MONTH_NAMES[monthIndex] ?? key
  }
  return key
}

/** Representative date for a time bucket (used only for axis labelling). */
function bucketDate(xAxis: MetricKey, key: string, logs: DerivedLog[], completed: Book[]): string | undefined {
  if (xAxis === 'date_day') return key
  if (xAxis === 'date_month') return `${key}-01`
  if (xAxis === 'date_week') {
    const dates = [
      ...logs.map((d) => dayKey(d.log.date)),
      ...completed.flatMap((b) => (b.completedAt ? [dayKey(b.completedAt)] : [])),
    ].sort()
    return dates[0]
  }
  return undefined
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

function aggregateY(yAxis: MetricKey, logs: DerivedLog[], books: Book[], start: Date, end: Date): number {
  switch (yAxis) {
    case 'pages_read':
      return logs.reduce((sum, d) => sum + (d.pagesRead ?? 0), 0)
    case 'minutes_spent':
      return logs.reduce((sum, d) => sum + (d.log.minutesSpentReading ?? 0), 0)
    case 'books_completed':
      return books.filter((b) => b.readStatus === 'read' && b.completedAt && inRange(b.completedAt, start, end)).length
    case 'reading_speed': {
      const withSpeed = logs.filter((d) => d.speedPagesPerHour != null)
      if (withSpeed.length === 0) return 0
      return Math.round(withSpeed.reduce((sum, d) => sum + (d.speedPagesPerHour ?? 0), 0) / withSpeed.length)
    }
    case 'book_count':
      return new Set([...logs.map((d) => d.book.id), ...books.map((b) => b.id)]).size
    case 'avg_mood':
      return averageMood(books) ?? 0
    default:
      return 0
  }
}

/** Chronological order for bucket keys. Day/month keys sort correctly as
 *  text; week keys ("2024-W10") don't (W10 would land before W2), so those
 *  sort by their bucket's date instead. */
function sortedKeys(xAxis: MetricKey, keys: string[], dateOf: (key: string) => string | undefined): string[] {
  if (xAxis !== 'date_week') return keys.sort()
  return keys.sort((a, b) => (dateOf(a) ?? '').localeCompare(dateOf(b) ?? ''))
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
    // books_completed / avg_mood by time bucket need the book's completedAt,
    // not log dates.
    if (config.yAxis === 'books_completed' || config.yAxis === 'avg_mood') {
      const completedBuckets = new Map<string, Book[]>()
      for (const b of books) {
        if (b.readStatus !== 'read' || !b.completedAt || !inRange(b.completedAt, start, end)) continue
        const key = timeKeyFor(config.xAxis, b.completedAt)
        completedBuckets.set(key, [...(completedBuckets.get(key) ?? []), b])
      }
      const keys =
        config.xAxis === 'day_of_week'
          ? DAY_NAMES
          : sortedKeys(config.xAxis, Array.from(new Set([...buckets.keys(), ...completedBuckets.keys()])), (k) =>
              bucketDate(config.xAxis, k, buckets.get(k) ?? [], completedBuckets.get(k) ?? []),
            )
      const dateOf = (key: string) =>
        bucketDate(config.xAxis, key, buckets.get(key) ?? [], completedBuckets.get(key) ?? [])
      if (config.yAxis === 'avg_mood') {
        // Only buckets that have at least one book with a mood tag get a
        // point — an empty month isn't a "neutral" month.
        return keys.flatMap((key) => {
          const avg = averageMood(completedBuckets.get(key) ?? [])
          return avg == null ? [] : [{ label: displayLabel(config.xAxis, key), value: avg, date: dateOf(key) }]
        })
      }
      return keys.map((key) => ({
        label: displayLabel(config.xAxis, key),
        value: (completedBuckets.get(key) ?? []).length,
        date: dateOf(key),
      }))
    }
    const keys =
      config.xAxis === 'day_of_week'
        ? DAY_NAMES
        : sortedKeys(config.xAxis, Array.from(buckets.keys()), (k) =>
            bucketDate(config.xAxis, k, buckets.get(k) ?? [], []),
          )
    return keys.map((key) => ({
      label: displayLabel(config.xAxis, key),
      value: aggregateY(config.yAxis, buckets.get(key) ?? [], [], start, end),
      date: bucketDate(config.xAxis, key, buckets.get(key) ?? [], []),
    }))
  }

  if (CATEGORY_AXES.includes(config.xAxis)) {
    // Only books that had activity in the selected timeframe count: a
    // reading log in range, or a start / finish date in range. Without
    // this the genre / format / ownership / mood charts ignored the
    // timeframe and always showed the whole library.
    const activeIds = new Set(derivedInRange.map((d) => d.book.id))
    for (const b of books) {
      if (b.completedAt && inRange(b.completedAt, start, end)) activeIds.add(b.id)
      if (b.startedAt && inRange(b.startedAt, start, end)) activeIds.add(b.id)
    }
    const activeBooks = books.filter((b) => activeIds.has(b.id))

    const bookGroups = new Map<string, Book[]>()
    for (const b of activeBooks) {
      // A book can carry several moods; it counts once under each of them.
      const keys = config.xAxis === 'mood' ? moodsOf(b) : [categoryKeyFor(config.xAxis, b)]
      for (const key of keys) {
        if (!key) continue
        bookGroups.set(key, [...(bookGroups.get(key) ?? []), b])
      }
    }
    return Array.from(bookGroups.entries())
      .map(([label, groupBooks]) => {
        const bookIds = new Set(groupBooks.map((b) => b.id))
        const groupLogs = derivedInRange.filter((d) => bookIds.has(d.book.id))
        return { label, value: aggregateY(config.yAxis, groupLogs, groupBooks, start, end) }
      })
      .sort((a, b) => b.value - a.value)
  }

  return []
}

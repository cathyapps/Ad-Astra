import type { Book, ReadingLog } from '@/types/library'
import type { ChartConfig, MetricKey, MetricsTimeframe } from '@/types/charts'
import { CATEGORY_X_AXES, METRIC_UNITS, TIME_X_AXES } from '@/types/charts'
import { deriveLogs, type DerivedLog } from './readingStats'
import { averageMood, bookMoodScore, moodsOf } from './moods'
import { isNonFiction } from './categorySpines'
import { addDays, addYears, appDayKey, appToday, weekdayOf } from './appDate'

// ---------------------------------------------------------------------
// Shapes handed to the chart renderer and the "data behind this chart"
// pop-up.
// ---------------------------------------------------------------------

/** One row of underlying data: a book (and, for log-based charts, the
 *  day it was read). Tapping a chart segment lists these. */
export interface ChartRecord {
  key: string
  book: Book
  date?: string
  /** e.g. "+34 pages", "4.25★", "Finished 2026-09-20" */
  detail: string
}

export interface ChartPoint {
  /** Unique bucket key (e.g. "2024-05"); `label` is what the axis shows. */
  key: string
  label: string
  value: number
  /** Second series (dual-axis graphs). */
  value2?: number
  /** A representative calendar date (YYYY-MM-DD) for points on a date axis,
   *  so axis labels can be thinned / regrouped without changing the points. */
  date?: string
  records: ChartRecord[]
}

export interface ScatterDot {
  categoryIndex: number
  value: number
  /** How many underlying data points this marker stands for (similar
   *  values — within 5% — are merged into one bigger, brighter marker). */
  count: number
  label: string
  records: ChartRecord[]
}

export interface HeatCell {
  col: number
  row: number
  value: number
  records: ChartRecord[]
}

export type ChartResult =
  | { kind: 'points'; points: ChartPoint[] }
  | { kind: 'scatter'; categories: { label: string; date?: string }[]; dots: ScatterDot[] }
  | { kind: 'heatmap'; cols: string[]; rows: string[]; cells: HeatCell[] }
  | { kind: 'number'; value: number; value2?: number; records: ChartRecord[] }

// ---------------------------------------------------------------------
// Timeframe + date helpers (Eastern time, 3 AM day rollover — appDate.ts)
// ---------------------------------------------------------------------

/** Start and end of a timeframe as app-day keys (YYYY-MM-DD, inclusive). */
export function timeframeRange(timeframe: MetricsTimeframe, now: Date = new Date()): { start: string; end: string } {
  const end = appToday(now)
  switch (timeframe) {
    case '7d':
      return { start: addDays(end, -6), end }
    case '30d':
      return { start: addDays(end, -29), end }
    case '90d':
      return { start: addDays(end, -89), end }
    case 'ytd':
      return { start: `${end.slice(0, 4)}-01-01`, end }
    case '1y':
      return { start: addYears(end, -1), end }
    case 'all':
      return { start: '2000-01-01', end }
  }
}

function inRange(dateStr: string, start: string, end: string): boolean {
  const key = appDayKey(dateStr)
  return key >= start && key <= end
}

const dayKey = appDayKey
const daysBetween = (a: string, b: string) => (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000

function weekKey(dateStr: string): string {
  const key = appDayKey(dateStr)
  const year = Number(key.slice(0, 4))
  const jan1 = `${year}-01-01`
  const week = Math.ceil((daysBetween(jan1, key) + weekdayOf(jan1) + 1) / 7)
  return `${year}-W${week}`
}
const monthKey = (dateStr: string) => appDayKey(dateStr).slice(0, 7)
const yearKey = (dateStr: string) => appDayKey(dateStr).slice(0, 4)

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** The bucket key (e.g. "2024-05") stays sortable and unique across
 *  years; this turns it into what's shown on the axis. */
function displayLabel(xAxis: MetricKey, key: string): string {
  if (xAxis === 'date_month') return MONTH_NAMES[Number(key.slice(5, 7)) - 1] ?? key
  return key
}

/** Representative date for a time bucket (used for axis labelling). */
function bucketDate(xAxis: MetricKey, key: string, dates: string[]): string | undefined {
  if (xAxis === 'date_day') return key
  if (xAxis === 'date_month') return `${key}-01`
  if (xAxis === 'date_year') return `${key}-01-01`
  if (xAxis === 'date_week') return [...dates].sort()[0]
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
    case 'date_year':
      return yearKey(dateStr)
    case 'day_of_week':
      return DAY_NAMES[weekdayOf(appDayKey(dateStr))]
    default:
      return dateStr
  }
}

// ---------------------------------------------------------------------
// Categories (one entry per book)
// ---------------------------------------------------------------------

export const STATUS_LABELS: Record<Book['readStatus'], string> = {
  want_to_read: 'Want to Read',
  reading: 'Reading',
  paused: 'Paused',
  read: 'Read',
  dnf: 'Did Not Finish',
}

const PACE_BY_TAG: Record<string, string> = { 'slow-paced': 'Slow', 'medium-paced': 'Medium', 'fast-paced': 'Fast' }
const PACE_ORDER = ['Slow', 'Medium', 'Fast']
const LENGTH_ORDER = ['Under 300', '300–499', '500+']

const fmtNum = (v: number) => (Number.isInteger(v) ? String(v) : String(Number(v.toFixed(2))))

function pageBucket(pages: number): string {
  if (pages < 100) return 'Under 100'
  if (pages >= 900) return '900+'
  const lo = Math.floor(pages / 100) * 100
  return `${lo}–${lo + 99}`
}

/** The category label(s) a book falls under on a category axis. */
function categoryKeys(axis: MetricKey, book: Book): string[] {
  const one = (v: string | undefined | null) => (v ? [v] : [])
  switch (axis) {
    case 'genre':
      return one(book.genre)
    case 'format':
      return one(book.format)
    case 'ownership':
      return one(book.ownership)
    case 'mood':
      return moodsOf(book) // a book counts once under each of its moods
    case 'pace': {
      const tag = book.tags.map((t) => t.trim().toLowerCase()).find((t) => t in PACE_BY_TAG)
      return one(tag && PACE_BY_TAG[tag])
    }
    case 'fiction_type': {
      const nf = isNonFiction(book)
      return [nf === undefined ? 'Unknown' : nf ? 'Nonfiction' : 'Fiction']
    }
    case 'status':
      return [STATUS_LABELS[book.readStatus]]
    case 'author':
      return one(book.author)
    case 'rating':
      return [book.rating != null ? `${fmtNum(book.rating)}★` : 'No rating']
    case 'page_count':
      return book.totalPages ? [pageBucket(book.totalPages)] : []
    case 'length':
      return book.totalPages ? [book.totalPages < 300 ? 'Under 300' : book.totalPages < 500 ? '300–499' : '500+'] : []
    case 'publish_year':
      return book.publishYear ? [String(book.publishYear)] : []
    case 'decade':
      return book.publishYear ? [`${Math.floor(book.publishYear / 10) * 10}s`] : []
    default:
      return []
  }
}

/** Axes with a natural order (ratings low→high, page ranges, years…) sort
 *  that way; the rest sort biggest-first. */
const CATEGORY_ORDER: Partial<Record<MetricKey, (label: string) => number>> = {
  rating: (l) => (l === 'No rating' ? -1 : parseFloat(l)),
  page_count: (l) => (l === 'Under 100' ? 0 : parseInt(l, 10)),
  length: (l) => LENGTH_ORDER.indexOf(l),
  pace: (l) => PACE_ORDER.indexOf(l),
  publish_year: (l) => Number(l),
  decade: (l) => parseInt(l, 10),
}

// ---------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------

const LOG_METRICS = new Set<MetricKey>(['pages_read', 'minutes_spent', 'hours_read', 'reading_speed'])
/** Counted only for books finished inside the timeframe. */
const FINISHED_METRICS = new Set<MetricKey>(['books_completed', 'book_pages', 'avg_days_to_finish', 'books_pace'])
/** Totals read as 0 when nothing matches; averages are left out instead. */
const COUNT_METRICS = new Set<MetricKey>([
  'pages_read',
  'minutes_spent',
  'hours_read',
  'books_completed',
  'book_pages',
  'book_count',
  'books_pace',
])

interface Ctx {
  start: string
  end: string
  /** Days the timeframe spans — what "books per year at this pace" divides by. */
  days: number
}

function daysToFinish(b: Book): number | undefined {
  if (!b.startedAt || !b.completedAt) return undefined
  const d = daysBetween(appDayKey(b.startedAt), appDayKey(b.completedAt))
  return d >= 0 ? d : undefined
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined)
const round = (v: number, dp: number) => Math.round(v * 10 ** dp) / 10 ** dp

function aggregateLogs(metric: MetricKey, logs: DerivedLog[]): number {
  switch (metric) {
    case 'pages_read':
      return logs.reduce((sum, d) => sum + (d.pagesRead ?? 0), 0)
    case 'minutes_spent':
      return logs.reduce((sum, d) => sum + (d.log.minutesSpentReading ?? 0), 0)
    case 'hours_read':
      return round(logs.reduce((sum, d) => sum + (d.log.minutesSpentReading ?? 0), 0) / 60, 2)
    case 'reading_speed': {
      const speeds = logs.flatMap((d) => (d.speedPagesPerHour != null ? [d.speedPagesPerHour] : []))
      return Math.round(mean(speeds) ?? 0)
    }
    default:
      return 0
  }
}

function aggregateBooks(metric: MetricKey, books: Book[], ctx: Ctx): number | undefined {
  switch (metric) {
    case 'books_completed':
    case 'book_count':
      return books.length
    case 'book_pages':
      return books.reduce((sum, b) => sum + (b.totalPages ?? 0), 0)
    case 'avg_rating': {
      const m = mean(books.flatMap((b) => (b.rating != null ? [b.rating] : [])))
      return m == null ? undefined : round(m, 2)
    }
    case 'avg_page_count': {
      const m = mean(books.flatMap((b) => (b.totalPages ? [b.totalPages] : [])))
      return m == null ? undefined : Math.round(m)
    }
    case 'avg_days_to_finish': {
      const m = mean(books.flatMap((b) => daysToFinish(b) ?? []))
      return m == null ? undefined : round(m, 1)
    }
    case 'avg_mood':
      return averageMood(books)
    case 'books_pace':
      return Math.round((books.length / ctx.days) * 365)
    default:
      return undefined
  }
}

/** One number for a metric over some logs + books. Undefined = "no data"
 *  (an average with nothing to average), so charts can leave it out. */
function metricValue(metric: MetricKey, logs: DerivedLog[], books: Book[], ctx: Ctx): number | undefined {
  if (LOG_METRICS.has(metric)) return aggregateLogs(metric, logs)
  if (metric === 'book_count') return new Set([...logs.map((d) => d.book.id), ...books.map((b) => b.id)]).size
  return aggregateBooks(metric, books, ctx)
}

// ---- records ----

function bookDetail(metric: MetricKey, b: Book): string {
  switch (metric) {
    case 'books_completed':
    case 'books_pace':
      return b.completedAt ? `Finished ${dayKey(b.completedAt)}` : STATUS_LABELS[b.readStatus]
    case 'book_pages':
    case 'avg_page_count':
      return b.totalPages ? `${b.totalPages} pages` : '—'
    case 'avg_rating':
      return b.rating != null ? `${fmtNum(b.rating)}★` : 'No rating'
    case 'avg_mood': {
      const moods = moodsOf(b)
      return moods.length ? moods.join(', ') : 'No mood tags'
    }
    case 'avg_days_to_finish': {
      const d = daysToFinish(b)
      return d != null ? `${fmtNum(d)} days` : '—'
    }
    default:
      return STATUS_LABELS[b.readStatus]
  }
}

function logDetail(metric: MetricKey, d: DerivedLog): string {
  switch (metric) {
    case 'pages_read':
      return d.pagesRead != null ? `+${d.pagesRead} pages` : 'Logged progress'
    case 'minutes_spent':
      return d.log.minutesSpentReading != null ? `${d.log.minutesSpentReading} min` : '—'
    case 'hours_read':
      return d.log.minutesSpentReading != null ? `${round(d.log.minutesSpentReading / 60, 2)} hrs` : '—'
    case 'reading_speed':
      return d.speedPagesPerHour != null ? `${Math.round(d.speedPagesPerHour)} pages/hr` : '—'
    default:
      return 'Logged progress'
  }
}

const logRecords = (metric: MetricKey, logs: DerivedLog[]): ChartRecord[] =>
  logs.map((d) => ({ key: d.log.id, book: d.book, date: dayKey(d.log.date), detail: logDetail(metric, d) }))

const bookRecords = (metric: MetricKey, books: Book[]): ChartRecord[] =>
  books.map((b) => ({
    key: b.id,
    book: b,
    date: b.completedAt ? dayKey(b.completedAt) : undefined,
    detail: bookDetail(metric, b),
  }))

/** Per-book rows for log-based metrics on category charts ("Book — +350 pages"). */
function perBookLogRecords(metric: MetricKey, logs: DerivedLog[]): ChartRecord[] {
  const byBook = new Map<string, DerivedLog[]>()
  for (const d of logs) byBook.set(d.book.id, [...(byBook.get(d.book.id) ?? []), d])
  return Array.from(byBook.values()).map((ls) => {
    const v = aggregateLogs(metric, ls)
    const unit = METRIC_UNITS[metric]
    return { key: ls[0].book.id, book: ls[0].book, detail: `${fmtNum(v)}${unit ? ` ${unit}` : ''}` }
  })
}

/** Human-readable value, e.g. "6,559 pages", "4.06 ★", "14 days". */
export function formatMetric(metric: MetricKey, value: number): string {
  const unit = METRIC_UNITS[metric]
  const num = Number.isInteger(value) ? value.toLocaleString() : String(Number(value.toFixed(2)))
  return unit ? `${num} ${unit}` : num
}

// ---------------------------------------------------------------------
// Chart computation
// ---------------------------------------------------------------------

interface Data {
  start: string
  end: string
  ctx: Ctx
  derivedInRange: DerivedLog[]
  finishedInRange: Book[]
  activeBooks: Book[]
}

function prepare(books: Book[], logs: ReadingLog[], timeframe: MetricsTimeframe): Data {
  const { start, end } = timeframeRange(timeframe)
  const derivedInRange = deriveLogs(books, logs).filter((d) => inRange(d.log.date, start, end))
  const finishedInRange = books.filter(
    (b) => b.readStatus === 'read' && b.completedAt && inRange(b.completedAt, start, end),
  )
  // Books with any activity in the timeframe: a log, a start or a finish.
  const activeIds = new Set(derivedInRange.map((d) => d.book.id))
  for (const b of books) {
    if (b.completedAt && inRange(b.completedAt, start, end)) activeIds.add(b.id)
    if (b.startedAt && inRange(b.startedAt, start, end)) activeIds.add(b.id)
  }
  const activeBooks = books.filter((b) => activeIds.has(b.id))

  // "At this pace" needs the length of the period; for all-time, from the
  // first activity rather than from the year 2000.
  let rangeStart = start
  if (timeframe === 'all') {
    const firsts = [...derivedInRange.map((d) => dayKey(d.log.date)), ...finishedInRange.map((b) => dayKey(b.completedAt as string))]
    if (firsts.length) rangeStart = firsts.sort()[0]
  }
  const ctx: Ctx = { start, end, days: Math.max(1, daysBetween(rangeStart, end) + 1) }
  return { start, end, ctx, derivedInRange, finishedInRange, activeBooks }
}

const isTimeAxis = (x: MetricKey) => TIME_X_AXES.includes(x)
const isCategoryAxis = (x: MetricKey) => CATEGORY_X_AXES.includes(x)

function sortTimeKeys(xAxis: MetricKey, keys: string[], datesOf: (k: string) => string[]): string[] {
  if (xAxis === 'day_of_week') return DAY_NAMES
  if (xAxis !== 'date_week') return keys.sort()
  return keys.sort((a, b) => (bucketDate(xAxis, a, datesOf(a)) ?? '').localeCompare(bucketDate(xAxis, b, datesOf(b)) ?? ''))
}

function groupBy<T>(items: T[], keyOf: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>()
  for (const it of items) {
    const k = keyOf(it)
    m.set(k, [...(m.get(k) ?? []), it])
  }
  return m
}

/** Books grouped by category (with their in-range logs), in display order. */
function categoryGroups(axis: MetricKey, d: Data) {
  const groups = new Map<string, Book[]>()
  for (const b of d.activeBooks) {
    for (const k of categoryKeys(axis, b)) groups.set(k, [...(groups.get(k) ?? []), b])
  }
  const order = CATEGORY_ORDER[axis]
  const entries = Array.from(groups.entries())
  if (order) entries.sort((a, b) => order(a[0]) - order(b[0]))
  else entries.sort((a, b) => b[1].length - a[1].length)
  return entries.map(([label, groupBooks]) => {
    const ids = new Set(groupBooks.map((b) => b.id))
    return { label, books: groupBooks, logs: d.derivedInRange.filter((x) => ids.has(x.book.id)) }
  })
}

function finishedOnly(metric: MetricKey, books: Book[], d: Data): Book[] {
  if (!FINISHED_METRICS.has(metric)) return books
  const done = new Set(d.finishedInRange.map((b) => b.id))
  return books.filter((b) => done.has(b.id))
}

function computePoints(xAxis: MetricKey, yAxis: MetricKey, d: Data): ChartPoint[] {
  if (isTimeAxis(xAxis)) {
    const logBased = LOG_METRICS.has(yAxis) || yAxis === 'book_count'
    const logBuckets = groupBy(d.derivedInRange, (x) => timeKeyFor(xAxis, x.log.date))
    const bookBuckets = logBased
      ? new Map<string, Book[]>()
      : groupBy(d.finishedInRange, (b) => timeKeyFor(xAxis, b.completedAt as string))
    const datesOf = (k: string) => [
      ...(logBuckets.get(k) ?? []).map((x) => dayKey(x.log.date)),
      ...(bookBuckets.get(k) ?? []).flatMap((b) => (b.completedAt ? [dayKey(b.completedAt)] : [])),
    ]
    const keys = sortTimeKeys(xAxis, Array.from(new Set([...logBuckets.keys(), ...bookBuckets.keys()])), datesOf)

    return keys.flatMap((key) => {
      const logs = logBuckets.get(key) ?? []
      const bks = bookBuckets.get(key) ?? []
      const value = metricValue(yAxis, logs, bks, d.ctx)
      if (value == null) return [] // an empty month isn't a "zero" average
      return [
        {
          key,
          label: displayLabel(xAxis, key),
          value,
          date: bucketDate(xAxis, key, datesOf(key)),
          records: logBased ? logRecords(yAxis, logs) : bookRecords(yAxis, bks),
        },
      ]
    })
  }

  if (isCategoryAxis(xAxis)) {
    return categoryGroups(xAxis, d).flatMap((g) => {
      const basis = finishedOnly(yAxis, g.books, d)
      const value = metricValue(yAxis, g.logs, basis, d.ctx)
      if (value == null) return []
      const records = LOG_METRICS.has(yAxis) ? perBookLogRecords(yAxis, g.logs) : bookRecords(yAxis, basis)
      return [{ key: g.label, label: g.label, value, records }]
    })
  }
  return []
}

/** Merge two metric series on the same x axis for the dual-axis graph. */
function computeDual(config: ChartConfig, d: Data): ChartPoint[] {
  const first = computePoints(config.xAxis, config.yAxis, d)
  const second = computePoints(config.xAxis, config.yAxis2 ?? config.yAxis, d)
  const secondByKey = new Map(second.map((p) => [p.key, p]))
  const firstKeys = new Set(first.map((p) => p.key))
  const keys = [...first.map((p) => p.key), ...second.filter((p) => !firstKeys.has(p.key)).map((p) => p.key)]
  const byKey = new Map([...second, ...first].map((p) => [p.key, p]))
  const merged = keys.map((key) => {
    const a = first.find((p) => p.key === key)
    const b = secondByKey.get(key)
    const base = byKey.get(key) as ChartPoint
    const seen = new Set<string>()
    const records = [...(a?.records ?? []), ...(b?.records ?? [])].filter((r) => {
      const id = `${r.key}|${r.date ?? ''}`
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })
    return {
      ...base,
      value: a ? a.value : COUNT_METRICS.has(config.yAxis) ? 0 : Number.NaN,
      value2: b ? b.value : COUNT_METRICS.has(config.yAxis2 ?? config.yAxis) ? 0 : Number.NaN,
      records,
    }
  })
  return isTimeAxis(config.xAxis) && config.xAxis !== 'day_of_week'
    ? merged.sort((a, b) => (a.date ?? a.key).localeCompare(b.date ?? b.key))
    : merged
}

// ---- scatter: every data point, similar ones merged ----

function clusterDots(raw: Omit<ScatterDot, 'count'>[]): ScatterDot[] {
  const maxAbs = Math.max(0, ...raw.map((r) => Math.abs(r.value)))
  const tolerance = maxAbs * 0.05
  const out: ScatterDot[] = []
  for (const group of groupBy(raw, (r) => String(r.categoryIndex)).values()) {
    const sorted = [...group].sort((a, b) => a.value - b.value)
    let cluster: Omit<ScatterDot, 'count'>[] = []
    const flush = () => {
      if (!cluster.length) return
      const value = round((mean(cluster.map((c) => c.value)) as number), 2)
      out.push({
        categoryIndex: cluster[0].categoryIndex,
        value,
        count: cluster.length,
        label: cluster.length === 1 ? cluster[0].label : `${cluster.length} data points`,
        records: cluster.flatMap((c) => c.records),
      })
      cluster = []
    }
    for (const r of sorted) {
      if (cluster.length && r.value - cluster[0].value > tolerance) flush()
      cluster.push(r)
    }
    flush()
  }
  return out
}

function computeScatter(config: ChartConfig, d: Data): ChartResult {
  const { xAxis, yAxis } = config
  const raw: Omit<ScatterDot, 'count'>[] = []

  if (isTimeAxis(xAxis)) {
    // One data point per calendar day, placed in its day / week / month / year column.
    const logBased = LOG_METRICS.has(yAxis) || yAxis === 'book_count'
    const logsByDay = groupBy(d.derivedInRange, (x) => dayKey(x.log.date))
    const booksByDay = logBased ? new Map<string, Book[]>() : groupBy(d.finishedInRange, (b) => dayKey(b.completedAt as string))
    const days = Array.from(new Set([...logsByDay.keys(), ...booksByDay.keys()])).sort()
    const categories: { label: string; date?: string }[] =
      xAxis === 'day_of_week' ? DAY_NAMES.map((l) => ({ label: l })) : []
    const indexOf = new Map<string, number>(xAxis === 'day_of_week' ? DAY_NAMES.map((l, i) => [l, i]) : [])
    for (const day of days) {
      const logs = logsByDay.get(day) ?? []
      const bks = booksByDay.get(day) ?? []
      const value = metricValue(yAxis, logs, bks, d.ctx)
      if (value == null || (logBased && logs.length === 0)) continue
      const key = timeKeyFor(xAxis, day)
      if (!indexOf.has(key)) {
        indexOf.set(key, categories.length)
        categories.push({ label: displayLabel(xAxis, key), date: bucketDate(xAxis, key, [day]) })
      }
      raw.push({
        categoryIndex: indexOf.get(key) as number,
        value,
        label: day,
        records: logBased ? logRecords(yAxis, logs) : bookRecords(yAxis, bks),
      })
    }
    return { kind: 'scatter', categories, dots: clusterDots(raw) }
  }

  // Category axes: one data point per book.
  const groups = categoryGroups(xAxis, d)
  groups.forEach((g, categoryIndex) => {
    for (const b of finishedOnly(yAxis, g.books, d)) {
      const bookLogs = g.logs.filter((x) => x.book.id === b.id)
      let value: number | undefined
      if (LOG_METRICS.has(yAxis)) value = bookLogs.length ? aggregateLogs(yAxis, bookLogs) : undefined
      else value = aggregateBooks(yAxis, [b], d.ctx)
      if (value == null) continue
      raw.push({
        categoryIndex,
        value,
        label: b.title,
        records: LOG_METRICS.has(yAxis) ? perBookLogRecords(yAxis, bookLogs) : bookRecords(yAxis, [b]),
      })
    }
  })
  return { kind: 'scatter', categories: groups.map((g) => ({ label: g.label })), dots: clusterDots(raw) }
}

// ---- heatmap ----

const HEATMAP_LIMIT = 8

function computeHeatmap(config: ChartConfig, d: Data): ChartResult {
  const rowAxis = config.groupAxis ?? 'mood'
  const cols = categoryGroups(config.xAxis, d).slice(0, HEATMAP_LIMIT)
  const rows = categoryGroups(rowAxis, d).slice(0, HEATMAP_LIMIT)
  const cells: HeatCell[] = []
  cols.forEach((c, col) => {
    const colIds = new Set(c.books.map((b) => b.id))
    rows.forEach((r, row) => {
      const books = r.books.filter((b) => colIds.has(b.id))
      if (!books.length) return
      const ids = new Set(books.map((b) => b.id))
      const logs = d.derivedInRange.filter((x) => ids.has(x.book.id))
      const basis = finishedOnly(config.yAxis, books, d)
      const value = metricValue(config.yAxis, logs, basis, d.ctx)
      if (value == null) return
      cells.push({
        col,
        row,
        value,
        records: LOG_METRICS.has(config.yAxis) ? perBookLogRecords(config.yAxis, logs) : bookRecords(config.yAxis, basis),
      })
    })
  })
  return { kind: 'heatmap', cols: cols.map((c) => c.label), rows: rows.map((r) => r.label), cells }
}

// ---- number card ----

function computeNumber(config: ChartConfig, d: Data): ChartResult {
  const one = (metric: MetricKey) => {
    const books = FINISHED_METRICS.has(metric) ? d.finishedInRange : d.activeBooks
    const value = metricValue(metric, d.derivedInRange, books, d.ctx) ?? 0
    const records = LOG_METRICS.has(metric) ? perBookLogRecords(metric, d.derivedInRange) : bookRecords(metric, books)
    return { value, records }
  }
  const a = one(config.yAxis)
  const b = config.yAxis2 ? one(config.yAxis2) : undefined
  const seen = new Set(a.records.map((r) => r.key))
  return {
    kind: 'number',
    value: a.value,
    value2: b?.value,
    records: [...a.records, ...(b ? b.records.filter((r) => !seen.has(r.key)) : [])],
  }
}

/** Turns a saved ChartConfig into what the renderer draws. Everything is
 *  aggregated fresh from books + reading logs for the chosen timeframe. */
export function computeChart(
  config: ChartConfig,
  books: Book[],
  logs: ReadingLog[],
  timeframe: MetricsTimeframe,
): ChartResult {
  const d = prepare(books, logs, timeframe)
  switch (config.chartType) {
    case 'number':
      return computeNumber(config, d)
    case 'heatmap':
      return computeHeatmap(config, d)
    case 'scatter':
      return computeScatter(config, d)
    case 'dual':
      return { kind: 'points', points: computeDual(config, d) }
    default:
      return { kind: 'points', points: computePoints(config.xAxis, config.yAxis, d) }
  }
}

// ---------------------------------------------------------------------
// "View the data behind this chart"
// ---------------------------------------------------------------------

export interface DrillRow {
  id: string
  label: string
  value: string
  records: ChartRecord[]
}

export function pointToRow(config: ChartConfig, p: ChartPoint): DrillRow {
  const second = config.chartType === 'dual' && config.yAxis2 && Number.isFinite(p.value2 ?? NaN)
  const first = Number.isFinite(p.value) ? formatMetric(config.yAxis, p.value) : '—'
  return {
    id: p.key,
    label: p.date && config.xAxis === 'date_week' ? `${p.key} (from ${p.date})` : p.key,
    value: second ? `${first} · ${formatMetric(config.yAxis2 as MetricKey, p.value2 as number)}` : first,
    records: p.records,
  }
}

export function dotToRow(config: ChartConfig, r: Extract<ChartResult, { kind: 'scatter' }>, dot: ScatterDot, i: number): DrillRow {
  return {
    id: `${dot.categoryIndex}-${i}`,
    label: `${r.categories[dot.categoryIndex]?.label ?? ''} · ${dot.label}`,
    value: formatMetric(config.yAxis, dot.value),
    records: dot.records,
  }
}

export function cellToRow(config: ChartConfig, r: Extract<ChartResult, { kind: 'heatmap' }>, c: HeatCell): DrillRow {
  return {
    id: `${c.col}-${c.row}`,
    label: `${r.cols[c.col]} × ${r.rows[c.row]}`,
    value: formatMetric(config.yAxis, c.value),
    records: c.records,
  }
}

/** Every row of data behind a chart, for the pop-up opened from its title. */
export function drillRows(config: ChartConfig, result: ChartResult): DrillRow[] {
  switch (result.kind) {
    case 'points':
      return result.points.map((p) => pointToRow(config, p))
    case 'scatter':
      return result.dots.map((dot, i) => dotToRow(config, result, dot, i))
    case 'heatmap':
      return result.cells.map((c) => cellToRow(config, result, c))
    case 'number':
      return [{ id: 'all', label: 'All data', value: formatMetric(config.yAxis, result.value), records: result.records }]
  }
}

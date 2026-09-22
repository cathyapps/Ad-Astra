// Dynamic chart builder types — Phase 6. A saved chart is just a
// type/x-axis/y-axis/title on a named view (the default view is
// 'default'). The actual data crunching (turning a MetricKey into
// numbers) lives in src/lib/chartData.ts, alongside the reading stats —
// this file just defines the vocabulary so the picker UI and the store
// agree on what's valid.

export type ChartType = 'bar' | 'line' | 'scatter' | 'pie'

export const CHART_TYPES: ChartType[] = ['bar', 'line', 'scatter', 'pie']

export const CHART_TYPE_LABELS: Record<ChartType, string> = {
  bar: 'Bar Chart',
  line: 'Line Graph',
  scatter: 'Scatter Plot',
  pie: 'Pie Chart',
}

// Every axis a chart can be built from. Time buckets (day/week/month)
// and categorical breakdowns (genre/format/etc.) work as an X axis;
// numeric aggregates (pages, minutes, books, speed) work as a Y axis or
// as the pie "value".
export type MetricKey =
  | 'date_day'
  | 'date_week'
  | 'date_month'
  | 'day_of_week'
  | 'genre'
  | 'format'
  | 'ownership'
  | 'pages_read'
  | 'minutes_spent'
  | 'books_completed'
  | 'reading_speed'
  | 'book_count'

export const METRIC_LABELS: Record<MetricKey, string> = {
  date_day: 'Date (day)',
  date_week: 'Date (week)',
  date_month: 'Date (month)',
  day_of_week: 'Day of week',
  genre: 'Genre',
  format: 'Format',
  ownership: 'Ownership',
  pages_read: 'Pages read',
  minutes_spent: 'Minutes spent reading',
  books_completed: 'Books completed',
  reading_speed: 'Reading speed (pages/hour)',
  book_count: 'Book count',
}

// Which metrics make sense as an X axis vs a Y axis. Time/categorical
// metrics bucket the data; numeric metrics are what gets aggregated
// into each bucket.
export const X_AXIS_METRICS: MetricKey[] = [
  'date_day',
  'date_week',
  'date_month',
  'day_of_week',
  'genre',
  'format',
  'ownership',
]

export const Y_AXIS_METRICS: MetricKey[] = [
  'pages_read',
  'minutes_spent',
  'books_completed',
  'reading_speed',
  'book_count',
]

export const DEFAULT_VIEW_NAME = 'default'

export interface ChartConfig {
  id: string
  viewName: string
  title: string
  chartType: ChartType
  xAxis: MetricKey
  yAxis: MetricKey
  sortIndex: number
  createdAt: string
  updatedAt: string
}

export type MetricsTimeframe = '7d' | '30d' | '90d' | 'ytd' | '1y' | 'all'

export const TIMEFRAME_LABELS: Record<MetricsTimeframe, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  ytd: 'Year to date',
  '1y': 'Last 12 months',
  all: 'All time',
}

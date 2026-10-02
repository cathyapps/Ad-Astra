// Dynamic chart builder types. A saved chart is a type + axes + title on
// a named view (the default view is 'default'). The data crunching (turning
// a MetricKey into numbers) lives in src/lib/chartData.ts — this file just
// defines the vocabulary so the picker UI and the store agree on what's
// valid.

export type ChartType = 'bar' | 'hbar' | 'line' | 'dual' | 'scatter' | 'pie' | 'heatmap' | 'number'

export const CHART_TYPES: ChartType[] = ['bar', 'hbar', 'line', 'dual', 'scatter', 'pie', 'heatmap', 'number']

export const CHART_TYPE_LABELS: Record<ChartType, string> = {
  bar: 'Bar Chart',
  hbar: 'Horizontal Bar Chart',
  line: 'Line Graph',
  dual: 'Dual-Axis Line Graph',
  scatter: 'Scatter Plot',
  pie: 'Pie Chart',
  heatmap: 'Heatmap',
  number: 'Number Card',
}

// Every axis a chart can be built from. Time buckets and categorical
// breakdowns work as an X axis; numeric aggregates work as a Y axis or as
// the pie "value".
export type MetricKey =
  // time buckets
  | 'date_day'
  | 'date_week'
  | 'date_month'
  | 'date_year'
  | 'day_of_week'
  // categories (one entry per book)
  | 'genre'
  | 'format'
  | 'ownership'
  | 'mood'
  | 'pace'
  | 'fiction_type'
  | 'status'
  | 'author'
  | 'rating'
  | 'page_count'
  | 'length'
  | 'publish_year'
  | 'decade'
  // numbers
  | 'pages_read'
  | 'minutes_spent'
  | 'hours_read'
  | 'books_completed'
  | 'book_pages'
  | 'reading_speed'
  | 'book_count'
  | 'avg_mood'
  | 'avg_rating'
  | 'avg_page_count'
  | 'avg_days_to_finish'
  | 'books_pace'

export const METRIC_LABELS: Record<MetricKey, string> = {
  date_day: 'Date (day)',
  date_week: 'Date (week)',
  date_month: 'Date (month)',
  date_year: 'Date (year)',
  day_of_week: 'Day of week',
  genre: 'Genre',
  format: 'Format',
  ownership: 'Ownership',
  mood: 'Mood',
  pace: 'Pace (slow / medium / fast)',
  fiction_type: 'Fiction / Nonfiction',
  status: 'Reading status',
  author: 'Author',
  rating: 'Star rating',
  page_count: 'Page count (100-page ranges)',
  length: 'Length (short / medium / long)',
  publish_year: 'Publication year',
  decade: 'Publication decade',
  pages_read: 'Pages read',
  minutes_spent: 'Minutes spent reading',
  hours_read: 'Hours spent reading',
  books_completed: 'Books completed',
  book_pages: 'Pages in finished books',
  reading_speed: 'Reading speed (pages/hour)',
  book_count: 'Book count',
  avg_mood: 'Average mood (dark ↔ light)',
  avg_rating: 'Average star rating',
  avg_page_count: 'Average book length (pages)',
  avg_days_to_finish: 'Average days to finish',
  books_pace: 'Books per year at this pace',
}

/** Short unit shown after a value (number cards, data pop-ups). */
export const METRIC_UNITS: Partial<Record<MetricKey, string>> = {
  pages_read: 'pages',
  minutes_spent: 'min',
  hours_read: 'hours',
  books_completed: 'books',
  book_pages: 'pages',
  reading_speed: 'pages/hr',
  book_count: 'books',
  avg_rating: '★',
  avg_page_count: 'pages',
  avg_days_to_finish: 'days',
  books_pace: 'books/year',
}

export const TIME_X_AXES: MetricKey[] = ['date_day', 'date_week', 'date_month', 'date_year', 'day_of_week']

export const CATEGORY_X_AXES: MetricKey[] = [
  'genre',
  'format',
  'ownership',
  'mood',
  'pace',
  'fiction_type',
  'status',
  'author',
  'rating',
  'page_count',
  'length',
  'publish_year',
  'decade',
]

export const X_AXIS_METRICS: MetricKey[] = [...TIME_X_AXES, ...CATEGORY_X_AXES]

export const Y_AXIS_METRICS: MetricKey[] = [
  'pages_read',
  'minutes_spent',
  'hours_read',
  'books_completed',
  'book_pages',
  'reading_speed',
  'book_count',
  'avg_mood',
  'avg_rating',
  'avg_page_count',
  'avg_days_to_finish',
  'books_pace',
]

export const DEFAULT_VIEW_NAME = 'default'

export interface ChartConfig {
  id: string
  viewName: string
  title: string
  chartType: ChartType
  xAxis: MetricKey
  yAxis: MetricKey
  /** Second Y metric: the right-hand axis of a dual-axis graph, or the
   *  small secondary figure on a number card. */
  yAxis2?: MetricKey
  /** Second category axis: the rows of a heatmap. */
  groupAxis?: MetricKey
  sortIndex: number
  createdAt: string
  updatedAt: string
}

/** What the "new chart" / "edit chart" form hands back. */
export interface ChartInput {
  title: string
  chartType: ChartType
  xAxis: MetricKey
  yAxis: MetricKey
  yAxis2?: MetricKey
  groupAxis?: MetricKey
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

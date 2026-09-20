import type { Book, ReadingSession } from '@/types/reading'
import {
  averageReadingSpeed,
  booksByMonth,
  dayOfWeekFrequency,
  deriveSessions,
  formatBreakdown,
  genreBreakdown,
  mostFrequentDayOfWeek,
  pagesByDay,
  pagesByMonth,
  sourceBreakdown,
  type Breakdown,
  type DayBucket,
} from '@/lib/readingStats'

interface Props {
  books: Book[]
  sessions: ReadingSession[]
}

function MiniBarChart({ title, buckets, unit }: { title: string; buckets: DayBucket[]; unit?: string }) {
  const max = Math.max(1, ...buckets.map((b) => b.pages))
  return (
    <div className="border border-hairline rounded-xl p-3 bg-card">
      <h3 className="text-xs uppercase tracking-wide text-moon-dim mb-3">{title}</h3>
      <div className="flex items-end gap-1 h-24">
        {buckets.map((b) => (
          <div key={b.label} className="flex-1 flex flex-col items-center justify-end gap-1">
            <div
              className="w-full bg-cosmic rounded-t"
              style={{ height: `${(b.pages / max) * 100}%`, minHeight: b.pages > 0 ? '3px' : '0' }}
              title={`${b.label}: ${b.pages}${unit ?? ''}`}
            />
            <span className="text-[9px] text-moon-dim rotate-0 whitespace-nowrap">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BreakdownBars({ title, items }: { title: string; items: Breakdown[] }) {
  return (
    <div className="border border-hairline rounded-xl p-3 bg-card">
      <h3 className="text-xs uppercase tracking-wide text-moon-dim mb-3">{title}</h3>
      {items.length === 0 && <p className="text-xs text-moon-dim">Not enough data yet.</p>}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-xs text-moon-dim mb-1">
              <span className="capitalize">{item.label}</span>
              <span>
                {item.count} ({item.percent}%)
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-hairline overflow-hidden">
              <div className="h-full bg-gold" style={{ width: `${item.percent}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ReadingInsights({ books, sessions }: Props) {
  const derived = deriveSessions(books, sessions)
  const speed = averageReadingSpeed(derived)
  const favoriteDay = mostFrequentDayOfWeek(sessions)
  const booksReadTotal = books.filter((b) => b.status === 'read').length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="border border-hairline rounded-xl p-3 bg-card text-center">
          <div className="text-lg text-moon font-display">{booksReadTotal}</div>
          <div className="text-[10px] text-moon-dim uppercase tracking-wide">Books read</div>
        </div>
        <div className="border border-hairline rounded-xl p-3 bg-card text-center">
          <div className="text-lg text-moon font-display">{speed ?? '—'}</div>
          <div className="text-[10px] text-moon-dim uppercase tracking-wide">Pages/hour avg</div>
        </div>
        <div className="border border-hairline rounded-xl p-3 bg-card text-center">
          <div className="text-lg text-moon font-display">{favoriteDay ?? '—'}</div>
          <div className="text-[10px] text-moon-dim uppercase tracking-wide">Top reading day</div>
        </div>
      </div>

      <MiniBarChart title="Pages read — last 14 days" buckets={pagesByDay(derived, 14)} unit="p" />
      <MiniBarChart title="Books completed this year" buckets={booksByMonth(sessions)} />
      <MiniBarChart title="Pages by month this year" buckets={pagesByMonth(derived)} unit="p" />
      <MiniBarChart title="Reading by day of week" buckets={dayOfWeekFrequency(sessions)} />

      <BreakdownBars title="Format" items={formatBreakdown(books)} />
      <BreakdownBars title="Source" items={sourceBreakdown(books)} />
      <BreakdownBars title="Genre" items={genreBreakdown(books)} />
    </div>
  )
}

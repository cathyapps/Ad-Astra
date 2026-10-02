import { useMemo, useState } from 'react'
import type { Book, ReadingLog } from '@/types/library'
import { deriveLogs } from '@/lib/readingStats'
import { buildMonthGrid, dayKey, getBookSpans, keyToUtcMs, logsByDay, todayKey } from '@/lib/readingCalendar'
import type { BookSpan } from '@/lib/readingCalendar'
import { DetailModal } from '@/features/shared/DetailModal'
import { BookCover } from './BookCover'
import { BookDetail } from './BookDetail'

interface Props {
  books: Book[]
  readingLogs: ReadingLog[]
  onUpdateBook: (id: string, patch: Partial<Book>) => void
  onDeleteBook: (id: string) => void
  onCreateReadingLog: (input: Partial<ReadingLog> & { bookId: string }) => void
}

type Selection = { type: 'day'; key: string } | { type: 'book'; id: string }

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_LETTERS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

const monthTitle = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 1)).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })

const prettyDay = (key: string) =>
  new Date(keyToUtcMs(key)).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })

const prettyShort = (key: string) =>
  new Date(keyToUtcMs(key)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

function NavArrows({ onPrev, onNext, label }: { onPrev: () => void; onNext: () => void; label: string }) {
  const btn = 'w-8 h-8 rounded-full border border-hairline text-moon-dim hover:text-moon hover:bg-card-hover transition-colors'
  return (
    <div className="flex items-center justify-between gap-2">
      <button type="button" aria-label="Previous" className={btn} onClick={onPrev}>
        ‹
      </button>
      <h3 className="font-display text-base text-moon text-center flex-1">{label}</h3>
      <button type="button" aria-label="Next" className={btn} onClick={onNext}>
        ›
      </button>
    </div>
  )
}

export function ReadingCalendar({ books, readingLogs, onUpdateBook, onDeleteBook, onCreateReadingLog }: Props) {
  const today = todayKey()
  const [view, setView] = useState(() => ({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 }))
  const [timelineYear, setTimelineYear] = useState(Number(today.slice(0, 4)))
  const [selection, setSelection] = useState<Selection | undefined>()

  const dayLogs = useMemo(() => logsByDay(readingLogs), [readingLogs])
  const derived = useMemo(() => deriveLogs(books, readingLogs), [books, readingLogs])
  const derivedByLogId = useMemo(() => new Map(derived.map((d) => [d.log.id, d])), [derived])
  const bookById = useMemo(() => new Map(books.map((b) => [b.id, b])), [books])
  const spans = useMemo(() => getBookSpans(books, readingLogs), [books, readingLogs])

  // Days where a book was started or finished (shown as a ring when no
  // progress was logged that day).
  const eventDays = useMemo(() => {
    const started = new Map<string, Book[]>()
    const finished = new Map<string, Book[]>()
    for (const b of books) {
      if (b.startedAt) started.set(dayKey(b.startedAt), [...(started.get(dayKey(b.startedAt)) ?? []), b])
      if (b.completedAt && b.readStatus === 'read') {
        finished.set(dayKey(b.completedAt), [...(finished.get(dayKey(b.completedAt)) ?? []), b])
      }
    }
    return { started, finished }
  }, [books])

  const grid = useMemo(() => buildMonthGrid(view.year, view.month), [view])
  const daysReadThisMonth = useMemo(() => {
    const prefix = `${view.year}-${String(view.month + 1).padStart(2, '0')}`
    return Array.from(dayLogs.keys()).filter((k) => String(k).startsWith(prefix)).length
  }, [dayLogs, view])

  function shiftMonth(delta: number) {
    setView((v) => {
      const d = new Date(Date.UTC(v.year, v.month + delta, 1))
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() }
    })
  }

  // --- Timeline (one year at a time) ---
  const yearStartMs = Date.UTC(timelineYear, 0, 1)
  const yearMs = Date.UTC(timelineYear + 1, 0, 1) - yearStartMs
  const yearSpans = spans.filter((s) => s.start <= `${timelineYear}-12-31` && s.end >= `${timelineYear}-01-01`)

  function barStyle(s: BookSpan) {
    const from = Math.max(keyToUtcMs(s.start), yearStartMs)
    const to = Math.min(keyToUtcMs(s.end) + 86400000, yearStartMs + yearMs)
    const left = ((from - yearStartMs) / yearMs) * 100
    const width = Math.max(((to - from) / yearMs) * 100, 1.2)
    return { left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }
  }

  // --- Pop-ups (existing DetailModal) ---
  const selectedBook = selection?.type === 'book' ? bookById.get(selection.id) : undefined
  const close = () => setSelection(undefined)

  function renderDayDetail(key: string) {
    const logs = dayLogs.get(key) ?? []
    const byBook = new Map<string, ReadingLog[]>()
    for (const l of logs) byBook.set(l.bookId, [...(byBook.get(l.bookId) ?? []), l])
    const startedToday = eventDays.started.get(key) ?? []
    const finishedToday = eventDays.finished.get(key) ?? []
    const bookIds = new Set([...byBook.keys(), ...startedToday.map((b) => b.id), ...finishedToday.map((b) => b.id)])

    return (
      <div className="border border-hairline rounded-xl p-4 space-y-4 bg-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg text-moon">{prettyDay(key)}</h2>
            <p className="text-xs text-moon-dim mt-0.5">
              {byBook.size > 0 ? `${byBook.size} ${byBook.size === 1 ? 'book' : 'books'} read` : 'Started or finished a book'}
            </p>
          </div>
          <button className="text-sm text-moon-dim hover:text-moon" onClick={close}>
            Close
          </button>
        </div>

        <div className="space-y-3">
          {Array.from(bookIds).map((id) => {
            const book = bookById.get(id)
            if (!book) return null
            const entries = byBook.get(id) ?? []
            const pages = entries.reduce((sum, l) => sum + (derivedByLogId.get(l.id)?.pagesRead ?? 0), 0)
            const minutes = entries.reduce((sum, l) => sum + (l.minutesSpentReading ?? 0), 0)
            const last = entries[entries.length - 1]
            const marker =
              last?.currentPage != null ? `p. ${last.currentPage}` : last?.percentComplete != null ? `${last.percentComplete}%` : null
            const tags = [
              startedToday.some((b) => b.id === id) ? 'Started' : null,
              finishedToday.some((b) => b.id === id) ? 'Finished' : null,
            ].filter(Boolean)

            return (
              <button
                key={id}
                type="button"
                className="w-full flex items-center gap-3 text-left rounded-lg hover:bg-card-hover transition-colors -mx-1 px-1 py-1"
                onClick={() => setSelection({ type: 'book', id })}
              >
                <BookCover title={book.title} coverUrl={book.coverUrl} seed={book.id} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-sm text-moon leading-snug">{book.title}</div>
                  {book.author && <div className="text-xs text-moon-dim truncate">{book.author}</div>}
                  <div className="text-xs text-moon-dim mt-1 flex flex-wrap gap-x-2">
                    {marker && <span>{marker}</span>}
                    {pages > 0 && <span>+{pages} pages</span>}
                    {minutes > 0 && <span>{minutes} min</span>}
                    {tags.map((t) => (
                      <span key={t as string} className="text-gold">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {selection?.type === 'day' && <DetailModal onClose={close}>{renderDayDetail(selection.key)}</DetailModal>}
      {selectedBook && (
        <DetailModal onClose={close}>
          <BookDetail
            book={selectedBook}
            readingLogs={readingLogs}
            onUpdate={(patch) => onUpdateBook(selectedBook.id, patch)}
            onDelete={() => {
              onDeleteBook(selectedBook.id)
              close()
            }}
            onCreateLog={(input) => onCreateReadingLog({ ...input, bookId: selectedBook.id })}
            onClose={close}
          />
        </DetailModal>
      )}

      {/* Month grid */}
      <section className="space-y-3">
        <NavArrows
          label={monthTitle(view.year, view.month)}
          onPrev={() => shiftMonth(-1)}
          onNext={() => shiftMonth(1)}
        />
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="text-[10px] uppercase tracking-wide text-moon-dim">
              {d}
            </div>
          ))}
          {grid.map((cell) => {
            const read = dayLogs.has(cell.key)
            const event = !read && (eventDays.started.has(cell.key) || eventDays.finished.has(cell.key))
            const isToday = cell.key === today
            const base = 'aspect-square rounded-full text-xs flex items-center justify-center transition-colors'
            const tone = read
              ? 'bg-gold text-night font-medium'
              : event
                ? 'border border-gold/60 text-moon'
                : cell.inMonth
                  ? 'text-moon-dim'
                  : 'text-moon-dim/30'
            const ring = isToday ? ' ring-1 ring-cosmic ring-offset-1 ring-offset-night' : ''
            if (read || event) {
              return (
                <button
                  key={cell.key}
                  type="button"
                  aria-label={prettyDay(cell.key)}
                  className={`${base} ${tone}${ring} ${cell.inMonth ? '' : 'opacity-50'}`}
                  onClick={() => setSelection({ type: 'day', key: cell.key })}
                >
                  {cell.day}
                </button>
              )
            }
            return (
              <div key={cell.key} className={`${base} ${tone}${ring}`}>
                {cell.day}
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-between text-xs text-moon-dim">
          <span>
            {daysReadThisMonth} {daysReadThisMonth === 1 ? 'day' : 'days'} read this month
          </span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-gold" /> read
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full border border-gold/60" /> start/finish
            </span>
          </span>
        </div>
      </section>

      {/* Timeline */}
      <section className="space-y-3">
        <NavArrows
          label={`Timeline · ${timelineYear}`}
          onPrev={() => setTimelineYear((y) => y - 1)}
          onNext={() => setTimelineYear((y) => y + 1)}
        />
        <div className="grid grid-cols-12 text-center text-[10px] text-moon-dim pl-11">
          {MONTH_LETTERS.map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </div>

        {yearSpans.length === 0 ? (
          <p className="text-sm text-moon-dim">No books with dates in {timelineYear}.</p>
        ) : (
          <div className="space-y-2.5">
            {yearSpans.map((s) => (
              <button
                key={s.book.id}
                type="button"
                className="w-full flex items-center gap-2 text-left"
                onClick={() => setSelection({ type: 'book', id: s.book.id })}
              >
                <BookCover title={s.book.title} coverUrl={s.book.coverUrl} seed={s.book.id} size="xs" />
                <div className="flex-1 min-w-0">
                  <div className="font-display text-xs text-moon truncate">{s.book.title}</div>
                  <div className="relative h-2.5 mt-1 rounded-full bg-hairline-soft overflow-hidden">
                    <div
                      className={`absolute top-0 bottom-0 rounded-full ${s.ongoing ? 'bg-gold/70' : 'bg-gold'}`}
                      style={barStyle(s)}
                    />
                  </div>
                  <div className="text-[10px] text-moon-dim mt-0.5">
                    {prettyShort(s.start)}
                    {s.end !== s.start || s.ongoing ? ` → ${s.ongoing ? 'now' : prettyShort(s.end)}` : ''}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

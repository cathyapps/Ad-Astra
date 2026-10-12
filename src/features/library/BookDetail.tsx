import { StarRating } from '@/features/shared/StarRating'
import { useContext, useState } from 'react'
import type { Book, ReadingLog } from '@/types/library'
import { BOOK_TAG_SUGGESTIONS } from '@/types/library'
import { TagsField } from '@/features/shared/TagsField'
import { ReadStatusBadge, READ_STATUS_LABELS, allowedBookTransitions } from './bookLabels'
import { BookForm } from './BookForm'
import { ProgressLogSheet } from './ProgressLogSheet'
import { FinishReviewSheet } from './FinishReviewSheet'
import { FORMAT_LABELS, RereadSheet } from './RereadSheet'
import { RereadContext } from './RereadContext'
import { sortLogsForDisplay } from '@/lib/readingStats'
import { currentReadingNumber } from '@/lib/readings'
import { dayKey, keyToUtcMs } from '@/lib/readingCalendar'

const prettyDay = (iso: string | undefined) =>
  iso
    ? new Date(keyToUtcMs(dayKey(iso))).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    : 'date unknown'

/** One finished reading of the book, shown in the Readings list. */
interface CompletedReading {
  number: number
  format: Book['format']
  startedAt?: string
  completedAt?: string
  status: 'read' | 'dnf'
  rating?: number
  review?: string
}

interface Props {
  book: Book
  readingLogs: ReadingLog[]
  onUpdate: (patch: Partial<Book>) => void
  onDelete: () => void
  onCreateLog: (input: Partial<ReadingLog>) => void
  onClose: () => void
}

export function BookDetail({ book, readingLogs, onUpdate, onDelete, onCreateLog, onClose }: Props) {
  const [editing, setEditing] = useState(false)
  const [loggingOpen, setLoggingOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [rereadOpen, setRereadOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [showFullLog, setShowFullLog] = useState(false)
  const startReread = useContext(RereadContext)

  const current = currentReadingNumber(book)
  const bookLogs = readingLogs.filter((l) => l.bookId === book.id)
  // Logs belong to a reading; logs without a number are the current one.
  const logsOfReading = (n: number) => sortLogsForDisplay(bookLogs.filter((l) => (l.readingNumber ?? current) === n), book)
  const logs = logsOfReading(current)
  const options = allowedBookTransitions(book.readStatus)

  const isFinished = book.readStatus === 'read' || book.readStatus === 'dnf'
  // Every finished reading, oldest first: the archived ones plus the current one if it is finished.
  const completed: CompletedReading[] = [
    ...(book.readings ?? []),
    ...(isFinished
      ? [
          {
            number: current,
            format: book.format,
            startedAt: book.startedAt,
            completedAt: book.completedAt,
            status: book.readStatus === 'dnf' ? ('dnf' as const) : ('read' as const),
            rating: book.rating,
            review: book.review,
          },
        ]
      : []),
  ]
  const renderEntries = (list: typeof logs) => (
    <div className="space-y-1">
      {list.map((l) => (
        <div key={l.id} className="text-xs text-moon-dim">
          <div className="flex items-center gap-2">
            <span>{l.date.slice(0, 10)}</span>
            {l.currentPage != null && <span>· p.{l.currentPage}</span>}
            {l.percentComplete != null && <span>· {l.percentComplete}%</span>}
            {l.minutesSpentReading != null && <span>· {l.minutesSpentReading}m</span>}
          </div>
          {l.notes && <p className="pl-3 text-moon-dim/80">{l.notes}</p>}
        </div>
      ))}
    </div>
  )

  const changeStatus = (s: Book['readStatus']) => {
    onUpdate({
      readStatus: s,
      startedAt: s === 'reading' && !book.startedAt ? new Date().toISOString() : book.startedAt,
      completedAt: s === 'read' || s === 'dnf' ? new Date().toISOString() : undefined,
    })
    setStatusOpen(false)
  }

  if (editing) {
    return (
      <div className="border border-hairline rounded-xl p-4 bg-card">
        <BookForm
          initial={book}
          onCancel={() => setEditing(false)}
          onSave={(input) => {
            onUpdate(input)
            setEditing(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className="border border-hairline rounded-xl p-4 space-y-4 bg-card">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {book.coverUrl && (
            <img src={book.coverUrl} alt="" className="w-12 h-[68px] object-cover rounded shrink-0 border border-hairline" />
          )}
          <div>
            <h2 className="font-display text-lg text-moon">{book.title}</h2>
            <p className="text-sm text-moon-dim">{book.author}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                  onClick={() => setStatusOpen((v) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={statusOpen}
                >
                  <ReadStatusBadge status={book.readStatus} />
                  <span className="text-[10px] text-moon-dim">▾</span>
                </button>
                {statusOpen && (
                  <div className="absolute left-0 top-full mt-1 z-20 min-w-[9rem] border border-hairline rounded-lg bg-card shadow-lg overflow-hidden">
                    {options.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="block w-full text-left text-xs px-3 py-2 text-moon-dim hover:text-moon hover:bg-card-hover transition-colors"
                        onClick={() => changeStatus(s)}
                      >
                        {READ_STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-xs text-moon-dim">
                {book.ownership} · {book.format}
              </span>
              {book.genre && <span className="text-xs text-moon-dim">{book.genre}</span>}
              {book.totalPages != null && <span className="text-xs text-moon-dim">{book.totalPages}p</span>}
            </div>
          </div>
        </div>
        <button className="text-sm text-moon-dim hover:text-moon" onClick={onClose}>
          Close
        </button>
      </div>

      {book.notes && <p className="text-sm text-moon-dim">{book.notes}</p>}

      <TagsField
        tags={book.tags}
        suggestions={Array.from(new Set([...BOOK_TAG_SUGGESTIONS, ...book.tags]))}
        onChange={(tags) => onUpdate({ tags })}
      />

      <div className="flex flex-wrap gap-2">
        {book.readStatus === 'want_to_read' && (
          <button
            className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
              book.isNextUp
                ? 'bg-gold text-night border-gold font-medium'
                : 'border-hairline text-moon-dim hover:text-moon hover:bg-card-hover'
            }`}
            onClick={() => onUpdate({ isNextUp: !book.isNextUp })}
          >
            {book.isNextUp ? '★ Next up' : '☆ Mark as next up'}
          </button>
        )}
      </div>

      {book.readStatus === 'read' && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-moon">Ratings</h3>
          <StarRating
            label="Plot"
            value={book.ratingPlot}
            onChange={(v) => onUpdate({ ratingPlot: v })}
          />
          <StarRating
            label="Characters"
            value={book.ratingCharacters}
            onChange={(v) => onUpdate({ ratingCharacters: v })}
          />
          <StarRating
            label="Writing"
            value={book.ratingWriting}
            onChange={(v) => onUpdate({ ratingWriting: v })}
          />
          <StarRating
            emphasis
            label="Overall"
            value={book.rating}
            onChange={(v) => onUpdate({ rating: v })}
          />
          {book.review && <p className="text-sm text-moon whitespace-pre-wrap pt-1">{book.review}</p>}
          <button className="text-xs text-cosmic hover:text-moon transition-colors" onClick={() => setReviewOpen(true)}>
            {book.review ? 'Edit review' : 'Write a review'}
          </button>
        </div>
      )}

      {reviewOpen && <FinishReviewSheet book={book} onSave={onUpdate} onClose={() => setReviewOpen(false)} />}
      {rereadOpen && startReread && (
        <RereadSheet book={book} onStart={(opts) => startReread(book.id, opts)} onClose={() => setRereadOpen(false)} />
      )}

      {completed.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-moon">{completed.length > 1 ? 'Readings' : 'Reading'}</h3>
          <div className="space-y-1.5">
            {[...completed].reverse().map((r) => (
              <div key={r.number} className="border border-hairline rounded-lg px-2.5 py-2 text-xs">
                <div className="flex flex-wrap items-center gap-x-2 text-moon-dim">
                  <span className="text-moon">Read {r.number}</span>
                  <span>· {FORMAT_LABELS[r.format]}</span>
                  <span>
                    · {r.status === 'dnf' ? 'DNF' : 'finished'} {prettyDay(r.completedAt)}
                  </span>
                  {r.rating != null && <span className="text-gold">· {r.rating}★</span>}
                </div>
                {r.review && <p className="text-moon-dim mt-1 line-clamp-3 whitespace-pre-wrap">{r.review}</p>}
              </div>
            ))}
          </div>
          {book.readStatus === 'read' && startReread && (
            <button
              className="text-xs rounded-full px-3 py-1.5 border border-gold/50 text-gold hover:bg-gold/10 transition-colors"
              onClick={() => setRereadOpen(true)}
            >
              ↻ Re-read
            </button>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-moon">Reading Log</h3>
          <button className="text-xs text-cosmic hover:text-moon transition-colors" onClick={() => setLoggingOpen(true)}>
            + Log progress
          </button>
        </div>

        {loggingOpen && (
          <ProgressLogSheet
            book={book}
            onCreateLog={onCreateLog}
            onUpdateBook={onUpdate}
            onClose={() => setLoggingOpen(false)}
          />
        )}

        {/* A finished book shows its readings above; the session-by-session log is tucked behind a toggle. */}
        {isFinished && completed.length > 0 ? (
          <>
            <button className="text-xs text-cosmic hover:text-moon transition-colors" onClick={() => setShowFullLog((v) => !v)}>
              {showFullLog ? 'Hide full reading log' : 'Show full reading log'}
            </button>
            {showFullLog && (
              <div className="mt-2 space-y-3">
                {[...completed].reverse().map((r) => {
                  const list = logsOfReading(r.number)
                  return (
                    <div key={r.number} className="space-y-1">
                      {completed.length > 1 && (
                        <p className="text-[11px] uppercase tracking-wide text-moon-dim">
                          Read {r.number} · {FORMAT_LABELS[r.format]}
                        </p>
                      )}
                      {list.length === 0 ? <p className="text-xs text-moon-dim">No entries.</p> : renderEntries(list)}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <>
            {logs.length === 0 ? (
              <p className="text-xs text-moon-dim">No entries yet.</p>
            ) : (
              renderEntries(showFullLog ? logs : logs.slice(0, 8))
            )}
            {logs.length > 8 && !showFullLog && (
              <button className="mt-1.5 text-xs text-cosmic hover:text-moon transition-colors" onClick={() => setShowFullLog(true)}>
                Show all {logs.length} entries
              </button>
            )}
            {completed.length > 0 && (
              <button className="block mt-1.5 text-xs text-cosmic hover:text-moon transition-colors" onClick={() => setShowFullLog((v) => !v)}>
                {showFullLog ? "Hide earlier readings' logs" : "Show earlier readings' logs"}
              </button>
            )}
            {completed.length > 0 && showFullLog && (
              <div className="mt-3 space-y-3">
                {[...completed].reverse().map((r) => (
                  <div key={r.number} className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wide text-moon-dim">
                      Read {r.number} · {FORMAT_LABELS[r.format]}
                    </p>
                    {logsOfReading(r.number).length === 0 ? <p className="text-xs text-moon-dim">No entries.</p> : renderEntries(logsOfReading(r.number))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex gap-3">
        <button className="text-xs text-cosmic hover:text-moon transition-colors" onClick={() => setEditing(true)}>
          Edit details
        </button>
        <button className="text-xs text-moon-dim hover:text-red-400 transition-colors" onClick={onDelete}>
          Delete book
        </button>
      </div>
    </div>
  )
}

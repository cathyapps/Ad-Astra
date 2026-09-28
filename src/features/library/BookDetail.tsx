import { useState } from 'react'
import type { Book, ReadingLog } from '@/types/library'
import { BOOK_TAG_SUGGESTIONS } from '@/types/library'
import { TagsField } from '@/features/shared/TagsField'
import { ReadStatusBadge, READ_STATUS_LABELS, allowedBookTransitions } from './bookLabels'
import { BookForm } from './BookForm'
import { ProgressLogSheet } from './ProgressLogSheet'

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

  const logs = readingLogs
    .filter((l) => l.bookId === book.id)
    .sort((a, b) => b.date.localeCompare(a.date))
  const options = allowedBookTransitions(book.readStatus)

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
        <label className="text-sm block text-moon-dim">
          Rating: <span className="text-gold font-medium">{book.rating ?? '—'}</span>
          <input
            type="range"
            min={1}
            max={5}
            value={book.rating ?? 3}
            onChange={(e) => onUpdate({ rating: Number(e.target.value) })}
            className="w-full mt-1 accent-gold"
          />
        </label>
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

        {logs.length === 0 ? (
          <p className="text-xs text-moon-dim">No entries yet.</p>
        ) : (
          <div className="space-y-1">
            {logs.slice(0, 8).map((l) => (
              <div key={l.id} className="flex items-center gap-2 text-xs text-moon-dim">
                <span>{l.date.slice(0, 10)}</span>
                {l.currentPage != null && <span>· p.{l.currentPage}</span>}
                {l.percentComplete != null && <span>· {l.percentComplete}%</span>}
                {l.minutesSpentReading != null && <span>· {l.minutesSpentReading}m</span>}
              </div>
            ))}
          </div>
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

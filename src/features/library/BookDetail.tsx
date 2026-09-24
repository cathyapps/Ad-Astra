import { useState } from 'react'
import type { Book, ReadingLog } from '@/types/library'
import { BUCKET_LIST_STARTER_TAGS } from '@/types/bucketList'
import { TagPicker } from '@/features/shared/TagPicker'
import { ReadStatusBadge, READ_STATUS_LABELS, allowedBookTransitions } from './bookLabels'
import { BookForm } from './BookForm'

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
  const [pageInput, setPageInput] = useState('')
  const [minutesInput, setMinutesInput] = useState('')

  const logs = readingLogs
    .filter((l) => l.bookId === book.id)
    .sort((a, b) => b.date.localeCompare(a.date))
  const options = allowedBookTransitions(book.readStatus)

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
              <ReadStatusBadge status={book.readStatus} />
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

      <TagPicker
        tags={book.tags}
        suggestions={Array.from(new Set([...BUCKET_LIST_STARTER_TAGS.book, ...book.tags]))}
        onChange={(tags) => onUpdate({ tags })}
      />

      <div className="flex flex-wrap gap-2">
        {options.map((s) => (
          <button
            key={s}
            className="text-xs border border-hairline rounded-full px-3 py-1.5 text-moon-dim hover:text-moon hover:bg-card-hover transition-colors"
            onClick={() =>
              onUpdate({
                readStatus: s,
                startedAt: s === 'reading' && !book.startedAt ? new Date().toISOString() : book.startedAt,
                completedAt: s === 'read' || s === 'dnf' ? new Date().toISOString() : undefined,
              })
            }
          >
            Move to {READ_STATUS_LABELS[s]}
          </button>
        ))}
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
          <button
            className="text-xs text-cosmic hover:text-moon transition-colors"
            onClick={() => setLoggingOpen((v) => !v)}
          >
            + Log progress
          </button>
        </div>

        {loggingOpen && (
          <form
            className="flex gap-2 mb-2"
            onSubmit={(e) => {
              e.preventDefault()
              const page = pageInput ? Number(pageInput) : undefined
              const minutes = minutesInput ? Number(minutesInput) : undefined
              if (page == null && minutes == null) return
              onCreateLog({ currentPage: page, minutesSpentReading: minutes })
              setPageInput('')
              setMinutesInput('')
              setLoggingOpen(false)
            }}
          >
            <input
              autoFocus
              inputMode="numeric"
              className="flex-1 border border-hairline bg-night rounded-lg px-2.5 py-1.5 text-sm text-moon placeholder:text-moon-dim/60"
              placeholder="Current page"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
            />
            <input
              inputMode="numeric"
              className="w-24 border border-hairline bg-night rounded-lg px-2.5 py-1.5 text-sm text-moon placeholder:text-moon-dim/60"
              placeholder="Minutes"
              value={minutesInput}
              onChange={(e) => setMinutesInput(e.target.value)}
            />
            <button
              type="submit"
              className="border border-hairline rounded-lg px-3 py-1.5 text-sm text-moon-dim hover:text-moon hover:bg-card-hover transition-colors"
            >
              Save
            </button>
          </form>
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

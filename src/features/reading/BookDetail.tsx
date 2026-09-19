import { useState } from 'react'
import type { Constellation, Star } from '@/types'
import type { Book, BookList, ReadingCompletionStatus, ReadingSession } from '@/types/reading'
import { BookStatusBadge, BOOK_STATUS_LABELS, StarRating } from './readingLabels'
import { allowedBookTransitions } from '@/lib/mediaTransitions'

const inputClass =
  'border border-hairline bg-night rounded-lg px-2.5 py-1.5 text-sm text-moon placeholder:text-moon-dim/60'

interface Props {
  book: Book
  stars: Star[]
  constellations: Constellation[]
  bookLists: BookList[]
  listIdsForBook: string[]
  sessions: ReadingSession[]
  onUpdate: (patch: Partial<Book>) => void
  onDelete: () => void
  onLogSession: (input: Partial<ReadingSession>) => void
  onToggleList: (bookListId: string) => void
  onClose: () => void
}

export function BookDetail({
  book,
  stars,
  constellations,
  bookLists,
  listIdsForBook,
  sessions,
  onUpdate,
  onDelete,
  onLogSession,
  onToggleList,
  onClose,
}: Props) {
  const [showLogForm, setShowLogForm] = useState(false)
  const [pages, setPages] = useState('')
  const [minutes, setMinutes] = useState('')
  const [notes, setNotes] = useState('')
  const [completion, setCompletion] = useState<ReadingCompletionStatus | ''>('')
  const [rating, setRating] = useState('')

  const options = allowedBookTransitions(book.status)
  const relatedStars = stars.filter((s) => book.relatedStarIds.includes(s.id))
  const relatedConstellations = constellations.filter((c) =>
    book.relatedConstellationIds.includes(c.id),
  )

  function toggleStar(id: string) {
    const set = new Set(book.relatedStarIds)
    if (set.has(id)) set.delete(id)
    else set.add(id)
    onUpdate({ relatedStarIds: Array.from(set) })
  }

  function toggleConstellation(id: string) {
    const set = new Set(book.relatedConstellationIds)
    if (set.has(id)) set.delete(id)
    else set.add(id)
    onUpdate({ relatedConstellationIds: Array.from(set) })
  }

  return (
    <div className="border border-hairline rounded-xl p-4 space-y-4 bg-card">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-lg text-moon">{book.title}</h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <BookStatusBadge status={book.status} />
            {book.author && <span className="text-xs text-moon-dim">{book.author}</span>}
            <StarRating rating={book.rating} />
          </div>
        </div>
        <button className="text-sm text-moon-dim hover:text-moon" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((s) => (
          <button
            key={s}
            className="text-xs border border-hairline rounded-full px-3 py-1.5 text-moon-dim hover:text-moon hover:bg-card-hover transition-colors"
            onClick={() => onUpdate({ status: s })}
          >
            Move to {BOOK_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-moon">Reading Log</h3>
          <button
            className="text-xs text-cosmic hover:text-moon transition-colors"
            onClick={() => setShowLogForm((v) => !v)}
          >
            + Log session
          </button>
        </div>

        {showLogForm && (
          <form
            className="border border-hairline rounded-lg p-3 space-y-2 mb-2 bg-night/40"
            onSubmit={(e) => {
              e.preventDefault()
              onLogSession({
                pages: pages ? Number(pages) : undefined,
                minutes: minutes ? Number(minutes) : undefined,
                notes: notes || undefined,
                completionStatus: completion || undefined,
                rating: rating ? Number(rating) : undefined,
              })
              setPages('')
              setMinutes('')
              setNotes('')
              setCompletion('')
              setRating('')
              setShowLogForm(false)
            }}
          >
            <div className="grid grid-cols-2 gap-2">
              <input
                className={inputClass}
                placeholder="Pages"
                inputMode="numeric"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="Minutes"
                inputMode="numeric"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
            </div>
            <input
              className={`${inputClass} w-full`}
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                className={inputClass}
                value={completion}
                onChange={(e) => setCompletion(e.target.value as ReadingCompletionStatus)}
              >
                <option value="">Still reading</option>
                <option value="completed">Finished it</option>
                <option value="dnf">Stopping here (DNF)</option>
              </select>
              <select className={inputClass} value={rating} onChange={(e) => setRating(e.target.value)}>
                <option value="">Rating</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {'★'.repeat(n)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-1.5 text-sm bg-gold text-night font-medium"
            >
              Save entry
            </button>
          </form>
        )}

        <div className="space-y-1.5">
          {sessions.length === 0 && <p className="text-xs text-moon-dim">No sessions logged yet.</p>}
          {sessions.map((s) => (
            <div key={s.id} className="text-xs text-moon-dim border border-hairline rounded-lg px-3 py-2">
              {s.date}
              {s.pages != null && ` · ${s.pages}p`}
              {s.minutes != null && ` · ${s.minutes}m`}
              {s.completionStatus === 'completed' && ' · finished'}
              {s.completionStatus === 'dnf' && ' · DNF'}
              {s.notes && <div className="text-moon mt-0.5">{s.notes}</div>}
            </div>
          ))}
        </div>
      </div>

      {bookLists.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-wide text-moon-dim mb-2">Lists</h3>
          <div className="flex flex-wrap gap-1.5">
            {bookLists.map((l) => (
              <button
                key={l.id}
                onClick={() => onToggleList(l.id)}
                className={`text-xs border rounded-full px-2.5 py-1 transition-colors ${
                  listIdsForBook.includes(l.id)
                    ? 'bg-cosmic text-night border-cosmic font-medium'
                    : 'border-hairline text-moon-dim hover:text-moon'
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {stars.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-wide text-moon-dim mb-2">Related Stars</h3>
          <div className="flex flex-wrap gap-1.5">
            {stars.map((s) => (
              <button
                key={s.id}
                onClick={() => toggleStar(s.id)}
                className={`text-xs border rounded-full px-2.5 py-1 transition-colors ${
                  relatedStars.includes(s)
                    ? 'bg-cosmic text-night border-cosmic font-medium'
                    : 'border-hairline text-moon-dim hover:text-moon'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {constellations.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-wide text-moon-dim mb-2">Related Constellations</h3>
          <div className="flex flex-wrap gap-1.5">
            {constellations.map((c) => (
              <button
                key={c.id}
                onClick={() => toggleConstellation(c.id)}
                className={`text-xs border rounded-full px-2.5 py-1 transition-colors ${
                  relatedConstellations.includes(c)
                    ? 'bg-cosmic text-night border-cosmic font-medium'
                    : 'border-hairline text-moon-dim hover:text-moon'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <button className="text-xs text-moon-dim hover:text-red-400 transition-colors" onClick={onDelete}>
        Delete book
      </button>
    </div>
  )
}

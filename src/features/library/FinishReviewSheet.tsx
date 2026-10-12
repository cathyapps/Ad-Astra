import { useState } from 'react'
import type { Book } from '@/types/library'
import { BottomSheet } from '@/features/shared/BottomSheet'
import { StarRating } from '@/features/shared/StarRating'

interface Props {
  book: Book
  onSave: (patch: Partial<Book>) => void
  onClose: () => void
  /** Shown when the sheet opens right after finishing a book, so it can say so. */
  justFinished?: boolean
}

/** The four ratings plus a written review and notes. Opens automatically when a book is marked
 *  finished (and from "Edit review" on a read book). Saving only writes what's on screen;
 *  "Skip for now" changes nothing, and everything can be filled in later from the book. */
export function FinishReviewSheet({ book, onSave, onClose, justFinished }: Props) {
  const [plot, setPlot] = useState(book.ratingPlot)
  const [characters, setCharacters] = useState(book.ratingCharacters)
  const [writing, setWriting] = useState(book.ratingWriting)
  const [overall, setOverall] = useState(book.rating)
  const [review, setReview] = useState(book.review ?? '')
  const [notes, setNotes] = useState(book.notes ?? '')

  const field =
    'w-full bg-night border border-hairline rounded-lg px-3 py-2 text-sm text-moon placeholder:text-moon-dim focus:outline-none focus:border-cosmic'

  return (
    <BottomSheet title={justFinished ? `Finished — ${book.title}` : `Review — ${book.title}`} onClose={onClose}>
      <div className="space-y-4">
        {justFinished && <p className="text-xs text-moon-dim">Nice. Rate it and write down what you thought while it's fresh.</p>}

        <div className="space-y-2">
          <StarRating label="Plot" value={plot} onChange={setPlot} />
          <StarRating label="Characters" value={characters} onChange={setCharacters} />
          <StarRating label="Writing" value={writing} onChange={setWriting} />
          <StarRating emphasis label="Overall" value={overall} onChange={setOverall} />
        </div>

        <label className="block space-y-1">
          <span className="text-xs text-moon-dim">Review</span>
          <textarea
            className={field}
            rows={4}
            placeholder="What did you think?"
            value={review}
            onChange={(e) => setReview(e.target.value)}
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs text-moon-dim">Notes</span>
          <textarea
            className={field}
            rows={3}
            placeholder="Quotes, thoughts, things to remember…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-lg px-3 py-2.5 text-sm bg-gold text-night font-medium"
            onClick={() => {
              onSave({
                // A key that is present but undefined clears that rating.
                ratingPlot: plot,
                ratingCharacters: characters,
                ratingWriting: writing,
                rating: overall,
                review: review.trim(),
                notes: notes.trim(),
              })
              onClose()
            }}
          >
            Save
          </button>
          <button
            type="button"
            className="rounded-lg px-3 py-2.5 text-sm border border-hairline text-moon-dim hover:text-moon hover:bg-card-hover transition-colors"
            onClick={onClose}
          >
            {justFinished ? 'Skip for now' : 'Cancel'}
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}

import { useState } from 'react'
import type { Book, ReadingLog } from '@/types/library'
import { lastActivityDate, toShelfRows } from '@/lib/libraryShelf'
import { mainShelfForRow } from './shelfPhotoLayout'
import { PhotoShelf } from './PhotoShelf'
import { BookCover } from './BookCover'
import { ShelfProgress } from './ShelfProgress'
import { ProgressLogSheet } from './ProgressLogSheet'
import { BookDetail } from './BookDetail'
import { DetailModal } from '@/features/shared/DetailModal'
import { ReadingTimerBanner } from './ReadingTimerBanner'
import { useReadingTimer } from './ReadingTimerContext'

interface Props {
  books: Book[]
  readingLogs: ReadingLog[]
  onUpdateBook: (id: string, patch: Partial<Book>) => void
  onDeleteBook: (id: string) => void
  onCreateReadingLog: (input: Partial<ReadingLog> & { bookId: string }) => void
  /** Only render this many shelf rows (the Dashboard shows just the top one). */
  maxRows?: number
  /** Render nothing (instead of the "nothing in progress" note) when empty. */
  hideWhenEmpty?: boolean
  /** Wrap in the warm Library look — for use outside the Library tab. */
  realm?: boolean
}

// Covers are shrunk to leave a band above them (inside the shelf photo
// itself) for the progress bar, so shelf rows can sit flush against each
// other like real adjacent shelves rather than being separated by a
// title/progress/actions block underneath each row.
const COVER_SCALE = 0.76

export function InProgressShelf({
  books,
  readingLogs,
  onUpdateBook,
  onDeleteBook,
  onCreateReadingLog,
  maxRows,
  hideWhenEmpty,
  realm,
}: Props) {
  const { timer } = useReadingTimer()
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [loggingId, setLoggingId] = useState<string | undefined>()

  const byRecentActivity = (a: Book, b: Book) =>
    lastActivityDate(b, readingLogs).localeCompare(lastActivityDate(a, readingLogs))
  // Actively-reading books first (most recently touched on top), then
  // paused ones after them, dimmed, so they stay reachable for logging
  // progress or resuming without crowding the active shelf.
  const reading = [
    ...books.filter((b) => b.readStatus === 'reading').sort(byRecentActivity),
    ...books.filter((b) => b.readStatus === 'paused').sort(byRecentActivity),
  ]

  const selected = books.find((b) => b.id === selectedId)
  const logging = books.find((b) => b.id === loggingId)
  const rows = toShelfRows(reading, 3).slice(0, maxRows)

  if (hideWhenEmpty && reading.length === 0 && !timer) return null

  return (
    <div className={realm ? 'library-realm space-y-5' : 'space-y-5'}>
      <ReadingTimerBanner books={books} />

      {selected && (
        <DetailModal onClose={() => setSelectedId(undefined)}>
          <BookDetail
            book={selected}
            readingLogs={readingLogs}
            onUpdate={(patch) => onUpdateBook(selected.id, patch)}
            onDelete={() => {
              onDeleteBook(selected.id)
              setSelectedId(undefined)
            }}
            onCreateLog={(input) => onCreateReadingLog({ ...input, bookId: selected.id })}
            onClose={() => setSelectedId(undefined)}
          />
        </DetailModal>
      )}

      {logging && (
        <ProgressLogSheet
          book={logging}
          onCreateLog={(input) => onCreateReadingLog({ ...input, bookId: logging.id })}
          onUpdateBook={(patch) => onUpdateBook(logging.id, patch)}
          onClose={() => setLoggingId(undefined)}
        />
      )}

      {reading.length === 0 ? (
        hideWhenEmpty ? null : <p className="text-sm text-moon-dim">Nothing in progress — open a book from the Library to start it.</p>
      ) : (
        <div>
          {rows.map((row, i) => {
            const padded = [...row, ...Array<Book | null>(3 - row.length).fill(null)]
            return (
              <PhotoShelf
                key={i}
                config={mainShelfForRow(i)}
                coverScale={COVER_SCALE}
                covers={padded.map((book) =>
                  book ? (
                    <button
                      className={`block w-full h-full ${book.readStatus === 'paused' ? 'opacity-55' : ''}`}
                      onClick={() => setSelectedId(book.id)}
                    >
                      <BookCover title={book.title} coverUrl={book.coverUrl} seed={book.id} />
                    </button>
                  ) : null,
                )}
                topOverlay={padded.map((book) =>
                  book ? <ShelfProgress book={book} logs={readingLogs} onClick={() => setLoggingId(book.id)} /> : null,
                )}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

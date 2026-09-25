import { useState } from 'react'
import type { Book, ReadingLog } from '@/types/library'
import { lastActivityDate, toShelfRows } from '@/lib/libraryShelf'
import { BookCover } from './BookCover'
import { ShelfProgress } from './ShelfProgress'
import { ProgressLogSheet } from './ProgressLogSheet'
import { BookDetail } from './BookDetail'

interface Props {
  books: Book[]
  readingLogs: ReadingLog[]
  onUpdateBook: (id: string, patch: Partial<Book>) => void
  onDeleteBook: (id: string) => void
  onCreateReadingLog: (input: Partial<ReadingLog> & { bookId: string }) => void
}

export function InProgressShelf({ books, readingLogs, onUpdateBook, onDeleteBook, onCreateReadingLog }: Props) {
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [loggingId, setLoggingId] = useState<string | undefined>()

  const reading = books
    .filter((b) => b.readStatus === 'reading')
    .sort((a, b) => lastActivityDate(b, readingLogs).localeCompare(lastActivityDate(a, readingLogs)))

  const selected = books.find((b) => b.id === selectedId)
  const logging = books.find((b) => b.id === loggingId)
  const rows = toShelfRows(reading, 3)

  return (
    <div className="space-y-5">
      {selected && (
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
        <p className="text-sm text-moon-dim">Nothing in progress — open a book from the Library to start it.</p>
      ) : (
        <div className="space-y-6">
          {rows.map((row, i) => (
            <div key={i} className="pb-3 library-shelf-ledge">
              <div className="grid grid-cols-3 gap-3">
                {row.map((book) => (
                  <div key={book.id} className="space-y-1.5">
                    <button className="block w-full" onClick={() => setSelectedId(book.id)}>
                      <BookCover title={book.title} coverUrl={book.coverUrl} seed={book.id} />
                    </button>
                    <button
                      className="text-[11px] text-moon text-left line-clamp-2 leading-snug hover:text-gold transition-colors"
                      onClick={() => setSelectedId(book.id)}
                    >
                      {book.title}
                    </button>
                    <ShelfProgress book={book} logs={readingLogs} onClick={() => setLoggingId(book.id)} />
                    <button
                      className="text-[10px] text-moon-dim hover:text-moon transition-colors"
                      onClick={() => onUpdateBook(book.id, { readStatus: 'read', completedAt: new Date().toISOString() })}
                    >
                      ✓ Mark complete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

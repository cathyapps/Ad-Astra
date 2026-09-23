import { useState } from 'react'
import type { Book, ReadingLog } from '@/types/library'
import { BookDetail } from './BookDetail'

interface Props {
  books: Book[]
  readingLogs: ReadingLog[]
  onUpdateBook: (id: string, patch: Partial<Book>) => void
  onDeleteBook: (id: string) => void
  onCreateReadingLog: (input: Partial<ReadingLog> & { bookId: string }) => void
}

export function CurrentlyReading({ books, readingLogs, onUpdateBook, onDeleteBook, onCreateReadingLog }: Props) {
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [pageInput, setPageInput] = useState<Record<string, string>>({})

  const reading = books.filter((b) => b.readStatus === 'reading')
  const selected = books.find((b) => b.id === selectedId)

  return (
    <div className="space-y-4">
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

      {reading.length === 0 ? (
        <p className="text-sm text-moon-dim">Nothing in progress — open a book from My Library to start it.</p>
      ) : (
        <div className="space-y-1.5">
          {reading.map((book) => (
            <div key={book.id} className="border border-hairline rounded-lg px-3 py-2 bg-card space-y-1.5">
              <div className="flex items-center gap-2.5">
                <button
                  className="flex-1 text-left text-sm text-moon hover:text-gold transition-colors"
                  onClick={() => setSelectedId(book.id)}
                >
                  {book.title}
                </button>
                <button
                  className="text-xs border border-hairline rounded-full px-2.5 py-1 text-moon-dim hover:text-moon hover:bg-card-hover transition-colors"
                  onClick={() =>
                    onUpdateBook(book.id, { readStatus: 'read', completedAt: new Date().toISOString() })
                  }
                >
                  Mark complete
                </button>
              </div>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  const page = Number(pageInput[book.id])
                  if (!page) return
                  onCreateReadingLog({ bookId: book.id, currentPage: page })
                  setPageInput((cur) => ({ ...cur, [book.id]: '' }))
                }}
              >
                <input
                  inputMode="numeric"
                  className="flex-1 border border-hairline bg-night rounded-lg px-2.5 py-1.5 text-sm text-moon placeholder:text-moon-dim/60"
                  placeholder={book.totalPages ? `Current page (of ${book.totalPages})` : 'Current page'}
                  value={pageInput[book.id] ?? ''}
                  onChange={(e) => setPageInput((cur) => ({ ...cur, [book.id]: e.target.value }))}
                />
                <button
                  type="submit"
                  className="border border-hairline rounded-lg px-3 py-1.5 text-sm text-moon-dim hover:text-moon hover:bg-card-hover transition-colors"
                >
                  Log
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

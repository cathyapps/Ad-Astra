import { useState } from 'react'
import type { Book, ReadingLog } from '@/types/library'
import { BookForm } from './BookForm'
import { BookDetail } from './BookDetail'
import { ReadStatusBadge } from './bookLabels'

interface Props {
  books: Book[]
  readingLogs: ReadingLog[]
  onCreateBook: (input: Partial<Book> & { title: string }) => void
  onUpdateBook: (id: string, patch: Partial<Book>) => void
  onDeleteBook: (id: string) => void
  onCreateReadingLog: (input: Partial<ReadingLog> & { bookId: string }) => void
}

const SPINE_COLORS = ['border-l-gold', 'border-l-cosmic', 'border-l-moon-dim']

export function MyLibrary({
  books,
  readingLogs,
  onCreateBook,
  onUpdateBook,
  onDeleteBook,
  onCreateReadingLog,
}: Props) {
  const [showForm, setShowForm] = useState(false)
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [showTbr, setShowTbr] = useState(false)

  const owned = books.filter((b) => b.ownership === 'own')
  const tbrNotOwned = books.filter((b) => b.readStatus === 'want_to_read' && b.ownership !== 'own')
  const selected = books.find((b) => b.id === selectedId)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-moon">My Library ({owned.length})</h3>
        <button
          className="border border-hairline rounded-full px-3 py-1.5 text-sm text-moon hover:bg-card-hover transition-colors"
          onClick={() => setShowForm(true)}
        >
          + Add Book
        </button>
      </div>

      {showForm && (
        <div className="border border-hairline rounded-xl p-4 bg-card">
          <BookForm
            onCancel={() => setShowForm(false)}
            onSave={(input) => {
              onCreateBook(input)
              setShowForm(false)
            }}
          />
        </div>
      )}

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

      {owned.length === 0 ? (
        <p className="text-sm text-moon-dim">No owned books yet — add one above.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2.5">
          {owned.map((book, i) => (
            <button
              key={book.id}
              onClick={() => setSelectedId(book.id)}
              className={`border border-hairline border-l-4 ${SPINE_COLORS[i % SPINE_COLORS.length]} rounded-lg bg-card p-2.5 text-left hover:bg-card-hover transition-colors flex flex-col justify-between h-28`}
            >
              <span className="text-xs text-moon font-medium leading-snug line-clamp-4">{book.title}</span>
              <span className="text-[10px] text-moon-dim truncate">{book.author}</span>
            </button>
          ))}
        </div>
      )}

      <div>
        <button
          className="text-xs text-cosmic hover:text-moon transition-colors"
          onClick={() => setShowTbr((v) => !v)}
        >
          {showTbr ? 'Hide' : 'View'} TBR books not currently owned ({tbrNotOwned.length})
        </button>
        {showTbr && (
          <div className="mt-2 space-y-1.5">
            {tbrNotOwned.length === 0 ? (
              <p className="text-sm text-moon-dim">Nothing here.</p>
            ) : (
              tbrNotOwned.map((book) => (
                <button
                  key={book.id}
                  onClick={() => setSelectedId(book.id)}
                  className="w-full flex items-center gap-2.5 border border-hairline rounded-lg px-3 py-2 bg-card hover:bg-card-hover transition-colors text-left"
                >
                  <span className="text-sm text-moon flex-1">{book.title}</span>
                  <ReadStatusBadge status={book.readStatus} />
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

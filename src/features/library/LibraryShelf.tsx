import { useMemo, useState } from 'react'
import type { Book, ReadingLog, BookFormat } from '@/types/library'
import { pickNextReads, allSpines, spinesFor, toShelfRows } from '@/lib/libraryShelf'
import { BookCover } from './BookCover'
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

type FormatFilter = 'all' | 'physical' | 'kindle' | 'audio'

const FORMAT_FILTERS: { id: FormatFilter; label: string }[] = [
  { id: 'all', label: 'All Owned' },
  { id: 'physical', label: 'Physical' },
  { id: 'kindle', label: 'Kindle' },
  { id: 'audio', label: 'Audio' },
]

const FORMAT_FILTER_TO_BOOK_FORMAT: Record<Exclude<FormatFilter, 'all'>, BookFormat> = {
  physical: 'print',
  kindle: 'kindle',
  audio: 'audio',
}

const TBR_TAG = '__tbr__'

export function LibraryShelf({
  books,
  readingLogs,
  onCreateBook,
  onUpdateBook,
  onDeleteBook,
  onCreateReadingLog,
}: Props) {
  const [showForm, setShowForm] = useState(false)
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const nextReads = useMemo(() => pickNextReads(books, 4), [books])
  const tbrCount = useMemo(() => books.filter((b) => b.readStatus === 'want_to_read').length, [books])
  const spines = useMemo(() => allSpines(books), [books])

  const owned = books.filter(
    (b) =>
      b.ownership === 'own' &&
      (formatFilter === 'all' || b.format === FORMAT_FILTER_TO_BOOK_FORMAT[formatFilter]),
  )

  const tagShelfBooks =
    activeTag === TBR_TAG
      ? books.filter((b) => b.readStatus === 'want_to_read')
      : activeTag
        ? books.filter((b) => spinesFor(b).includes(activeTag))
        : []

  const selected = books.find((b) => b.id === selectedId)

  return (
    <div className="space-y-6">
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

      {/* Format / ownership filter */}
      <div className="flex gap-1.5 text-xs overflow-x-auto">
        {FORMAT_FILTERS.map((f) => (
          <button
            key={f.id}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap border transition-colors ${
              formatFilter === f.id
                ? 'bg-gold text-night border-gold font-medium'
                : 'border-hairline text-moon-dim hover:text-moon'
            }`}
            onClick={() => setFormatFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Next Reads shelf */}
      {nextReads.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-moon mb-2">Next Reads</h3>
          <div className="grid grid-cols-4 gap-2.5 pb-3 library-shelf-ledge">
            {nextReads.map((book) => (
              <button key={book.id} className="space-y-1 text-left" onClick={() => setSelectedId(book.id)}>
                <div className="relative">
                  <BookCover title={book.title} coverUrl={book.coverUrl} seed={book.id} />
                  {book.isNextUp && (
                    <span className="absolute -top-1.5 -right-1.5 text-[10px] bg-gold text-night rounded-full w-4 h-4 flex items-center justify-center">
                      ★
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-moon line-clamp-2 leading-snug">{book.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tag spines shelf */}
      {spines.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-moon mb-2">Browse by Category</h3>
          <div className="flex flex-col gap-1 pb-3 library-shelf-ledge">
            {tbrCount > 0 && (
              <button
                onClick={() => setActiveTag((cur) => (cur === TBR_TAG ? null : TBR_TAG))}
                className={`text-left text-xs border-l-4 rounded px-3 py-2 transition-colors ${
                  activeTag === TBR_TAG
                    ? 'border-l-gold bg-card-hover text-moon'
                    : 'border-l-cosmic bg-card text-moon-dim hover:text-moon'
                }`}
              >
                To Be Read ({tbrCount})
              </button>
            )}
            {spines.map((s) => (
              <button
                key={s.label}
                onClick={() => setActiveTag((cur) => (cur === s.label ? null : s.label))}
                className={`text-left text-xs border-l-4 rounded px-3 py-2 transition-colors ${
                  activeTag === s.label
                    ? 'border-l-gold bg-card-hover text-moon'
                    : 'border-l-moon-dim/50 bg-card text-moon-dim hover:text-moon'
                }`}
              >
                {s.label} ({s.count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active tag shelf, or the owned collection */}
      {activeTag ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-moon">
              {activeTag === TBR_TAG ? 'To Be Read' : activeTag} ({tagShelfBooks.length})
            </h3>
            <button className="text-xs text-cosmic hover:text-moon transition-colors" onClick={() => setActiveTag(null)}>
              Back to Library
            </button>
          </div>
          {tagShelfBooks.length === 0 ? (
            <p className="text-sm text-moon-dim">Nothing here.</p>
          ) : (
            <div className="space-y-1.5">
              {tagShelfBooks.map((book) => (
                <div
                  key={book.id}
                  className="flex items-center gap-2.5 border border-hairline rounded-lg px-3 py-2 bg-card"
                >
                  <button className="flex items-center gap-2.5 flex-1 text-left" onClick={() => setSelectedId(book.id)}>
                    <BookCover title={book.title} coverUrl={book.coverUrl} seed={book.id} size="sm" />
                    <span className="text-sm text-moon flex-1">{book.title}</span>
                  </button>
                  {book.readStatus === 'want_to_read' ? (
                    <button
                      className={`text-[10px] rounded-full px-2.5 py-1 border transition-colors shrink-0 ${
                        book.isNextUp
                          ? 'bg-gold text-night border-gold font-medium'
                          : 'border-hairline text-moon-dim hover:text-moon'
                      }`}
                      onClick={() => onUpdateBook(book.id, { isNextUp: !book.isNextUp })}
                    >
                      {book.isNextUp ? '★ Next up' : '☆ Mark next up'}
                    </button>
                  ) : (
                    <ReadStatusBadge status={book.readStatus} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-moon">My Shelf ({owned.length})</h3>
            <button
              className="border border-hairline rounded-full px-3 py-1.5 text-xs text-moon hover:bg-card-hover transition-colors"
              onClick={() => setShowForm(true)}
            >
              + Add Book
            </button>
          </div>
          {owned.length === 0 ? (
            <p className="text-sm text-moon-dim">No books match this filter yet.</p>
          ) : (
            <div className="space-y-6">
              {toShelfRows(owned, 3).map((row, i) => (
                <div key={i} className="pb-3 library-shelf-ledge">
                  <div className="grid grid-cols-3 gap-3">
                    {row.map((book) => (
                      <button key={book.id} className="space-y-1.5 text-left" onClick={() => setSelectedId(book.id)}>
                        <BookCover title={book.title} coverUrl={book.coverUrl} seed={book.id} />
                        <span className="block text-[11px] text-moon line-clamp-2 leading-snug">{book.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

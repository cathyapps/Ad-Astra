import { useMemo, useState } from 'react'
import type { Book, ReadingLog, BookFormat } from '@/types/library'
import { pickNextReads, toShelfRows } from '@/lib/libraryShelf'
import { ALL_CATEGORY_SPINES, CATEGORY_SHELVES } from '@/lib/categorySpines'
import { CATEGORY_SHELF, MAIN_SHELF, NEXT_READS_SHELF } from './shelfPhotoLayout'
import { PhotoShelf } from './PhotoShelf'
import { SpineShelf } from './SpineShelf'
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

type FilterId = 'unread' | 'owned' | 'physical' | 'kindle' | 'audio'

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'unread', label: 'Unread' },
  { id: 'owned', label: 'Owned' },
  { id: 'physical', label: 'Physical' },
  { id: 'kindle', label: 'Kindle' },
  { id: 'audio', label: 'Audio' },
]

const FILTER_TO_BOOK_FORMAT: Record<'physical' | 'kindle' | 'audio', BookFormat> = {
  physical: 'print',
  kindle: 'kindle',
  audio: 'audio',
}
const FORMAT_FILTER_IDS: FilterId[] = ['physical', 'kindle', 'audio']

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
  const [activeFilters, setActiveFilters] = useState<Set<FilterId>>(new Set())
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [categoriesOpen, setCategoriesOpen] = useState(false)

  const toggleFilter = (id: FilterId) =>
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  // Unread + Owned intersect (both must hold, when active); Physical/
  // Kindle/Audio union (any selected format matches). The two groups
  // then combine with AND, so e.g. Unread + Kindle shows unread Kindle
  // books, regardless of ownership.
  const matchesFilters = (book: Book): boolean => {
    const unreadOk = !activeFilters.has('unread') || book.readStatus === 'want_to_read'
    const ownedOk = !activeFilters.has('owned') || book.ownership === 'own'
    const selectedFormats = FORMAT_FILTER_IDS.filter((id) => activeFilters.has(id))
    const formatOk = selectedFormats.length === 0 || selectedFormats.some((id) => book.format === FILTER_TO_BOOK_FORMAT[id as 'physical' | 'kindle' | 'audio'])
    return unreadOk && ownedOk && formatOk
  }

  const filteredBooks = useMemo(() => books.filter(matchesFilters), [books, activeFilters])

  const nextReads = useMemo(() => pickNextReads(filteredBooks, 4), [filteredBooks])

  const owned = filteredBooks

  const activeSpine = ALL_CATEGORY_SPINES.find((sp) => sp.label === activeTag)
  const tagShelfBooks = activeSpine ? books.filter(activeSpine.matches) : []

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

      {/* Filters: Unread/Owned intersect, Physical/Kindle/Audio union */}
      <div className="flex gap-1.5 text-xs overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap border transition-colors ${
              activeFilters.has(f.id)
                ? 'bg-gold text-night border-gold font-medium'
                : 'border-hairline text-moon-dim hover:text-moon'
            }`}
            onClick={() => toggleFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Next Reads shelf */}
      {nextReads.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-moon mb-2">Next Reads</h3>
          <PhotoShelf
            config={NEXT_READS_SHELF}
            covers={[0, 1, 2, 3].map((i) => {
              const book = nextReads[i]
              if (!book) return null
              return (
                <button className="block w-full h-full relative" onClick={() => setSelectedId(book.id)}>
                  <BookCover title={book.title} coverUrl={book.coverUrl} seed={book.id} />
                  {book.isNextUp && (
                    <span className="absolute -top-1.5 -right-1.5 text-[10px] bg-gold text-night rounded-full w-4 h-4 flex items-center justify-center">
                      ★
                    </span>
                  )}
                </button>
              )
            })}
          />
        </div>
      )}

      {/* Category spines: four shelves, collapsed until opened */}
      <div>
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm font-medium text-moon mb-2"
          aria-expanded={categoriesOpen}
          onClick={() => setCategoriesOpen((v) => !v)}
        >
          <span className="text-[10px] text-moon-dim">{categoriesOpen ? '▾' : '▸'}</span>
          Browse by Category
        </button>
        {categoriesOpen && (
          <div>
            {CATEGORY_SHELVES.map((shelf, i) => (
              <SpineShelf
                key={i}
                config={CATEGORY_SHELF}
                labels={shelf.map((sp) => sp.label)}
                activeLabel={activeTag}
                onSelect={(label) => setActiveTag((cur) => (cur === label ? null : label))}
              />
            ))}
          </div>
        )}
      </div>

      {/* Active tag shelf, or the owned collection */}
      {activeTag ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-moon">
              {activeTag} ({tagShelfBooks.length})
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
            <div>
              {toShelfRows(owned, 3).map((row, i) => {
                const padded = [...row, ...Array<Book | null>(3 - row.length).fill(null)]
                return (
                  <PhotoShelf
                    key={i}
                    config={MAIN_SHELF}
                    covers={padded.map((book) =>
                      book ? (
                        <button className="block w-full h-full" onClick={() => setSelectedId(book.id)}>
                          <BookCover title={book.title} coverUrl={book.coverUrl} seed={book.id} />
                        </button>
                      ) : null,
                    )}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import { useMemo, useState } from 'react'
import type { Book, ReadingLog, BookFormat } from '@/types/library'
import { pickNextReads, toShelfRows } from '@/lib/libraryShelf'
import { ALL_CATEGORY_SPINES, CATEGORY_SHELVES } from '@/lib/categorySpines'
import { CATEGORY_SHELF, NEXT_READS_COUNT_PER_SHELF, NEXT_READS_SHELF, mainShelfForRow } from './shelfPhotoLayout'
import { PhotoShelf } from './PhotoShelf'
import { SpineShelf } from './SpineShelf'
import { BookCover } from './BookCover'
import { BookForm } from './BookForm'
import { BookDetail } from './BookDetail'
import { DetailModal } from '@/features/shared/DetailModal'
import { BottomSheet } from '@/features/shared/BottomSheet'

interface Props {
  books: Book[]
  readingLogs: ReadingLog[]
  onCreateBook: (input: Partial<Book> & { title: string }) => void
  onUpdateBook: (id: string, patch: Partial<Book>) => void
  onDeleteBook: (id: string) => void
  onCreateReadingLog: (input: Partial<ReadingLog> & { bookId: string }) => void
}

type FormatFilterId = 'physical' | 'kindle' | 'audio'

// Unread and Owned are 3-way toggles that cycle on each tap:
//   Read status: unread only -> read only -> show all -> (back to unread)
//   Ownership:   owned only  -> unowned only -> show all -> (back to owned)
type ReadFilter = 'unread' | 'read' | 'all'
type OwnedFilter = 'owned' | 'unowned' | 'all'

const READ_FILTER_CYCLE: ReadFilter[] = ['unread', 'read', 'all']
const OWNED_FILTER_CYCLE: OwnedFilter[] = ['owned', 'unowned', 'all']
const nextInCycle = <T,>(cycle: T[], cur: T): T => cycle[(cycle.indexOf(cur) + 1) % cycle.length]

const READ_FILTER_LABELS: Record<ReadFilter, string> = { unread: 'Unread', read: 'Read', all: 'Any status' }
const OWNED_FILTER_LABELS: Record<OwnedFilter, string> = { owned: 'Owned', unowned: 'Unowned', all: 'Any ownership' }

const FORMAT_FILTERS: { id: FormatFilterId; label: string }[] = [
  { id: 'physical', label: 'Physical' },
  { id: 'kindle', label: 'Kindle' },
  { id: 'audio', label: 'Audio' },
]

const FILTER_TO_BOOK_FORMAT: Record<FormatFilterId, BookFormat> = {
  physical: 'print',
  kindle: 'kindle',
  audio: 'audio',
}

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
  // Default view: Unread + Owned.
  const [readFilter, setReadFilter] = useState<ReadFilter>('unread')
  const [ownedFilter, setOwnedFilter] = useState<OwnedFilter>('owned')
  const [formatFilters, setFormatFilters] = useState<Set<FormatFilterId>>(new Set())
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [search, setSearch] = useState('')

  const toggleFormat = (id: FormatFilterId) =>
    setFormatFilters((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  // Read status and ownership each apply their own setting; Physical/
  // Kindle/Audio union (any selected format matches). The groups then
  // combine with AND, so e.g. Unread + Kindle shows unread Kindle books.
  // "Unread" means still on the TBR (want_to_read); "Read" means finished.
  const matchesFilters = (book: Book): boolean => {
    const readOk =
      readFilter === 'all' ||
      (readFilter === 'unread' ? book.readStatus === 'want_to_read' : book.readStatus === 'read')
    const ownedOk =
      ownedFilter === 'all' ||
      (ownedFilter === 'owned' ? book.ownership === 'own' : book.ownership !== 'own')
    const formatOk =
      formatFilters.size === 0 ||
      Array.from(formatFilters).some((id) => book.format === FILTER_TO_BOOK_FORMAT[id])
    return readOk && ownedOk && formatOk
  }

  const filteredBooks = useMemo(
    () => books.filter(matchesFilters),
    [books, readFilter, ownedFilter, formatFilters],
  )

  const nextReads = useMemo(
    () => pickNextReads(filteredBooks, NEXT_READS_COUNT_PER_SHELF),
    [filteredBooks],
  )

  // Tapping a genre/category spine narrows My Shelf to that tag (on top
  // of the filters above) instead of showing a separate list.
  const activeSpine = ALL_CATEGORY_SPINES.find((sp) => sp.label === activeTag)

  // Searching looks across the whole library: the filters and category
  // are paused while there's text in the box, so a book you've already
  // read (or don't own) can still be found under the default Unread +
  // Owned view.
  const query = search.trim().toLowerCase()
  const searching = query.length > 0
  const owned = useMemo(() => {
    if (searching) {
      return books.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          (b.author ?? '').toLowerCase().includes(query) ||
          b.tags.some((t) => t.toLowerCase().includes(query)),
      )
    }
    return activeSpine ? filteredBooks.filter(activeSpine.matches) : filteredBooks
  }, [books, filteredBooks, activeSpine, searching, query])

  const selected = books.find((b) => b.id === selectedId)

  return (
    <div className="space-y-6">
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

      {showForm && (
        <BottomSheet title="Add book" onClose={() => setShowForm(false)}>
          <BookForm
            onCancel={() => setShowForm(false)}
            onSave={(input) => {
              onCreateBook(input)
              setShowForm(false)
            }}
          />
        </BottomSheet>
      )}

      {/* Search + Add Book */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-moon-dim pointer-events-none"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            className="w-full border border-hairline bg-night rounded-full pl-9 pr-3 py-2 text-sm text-moon placeholder:text-moon-dim/60"
            placeholder="Search title, author, tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search library"
          />
        </div>
        <button
          className="border border-hairline rounded-full px-3 py-2 text-sm text-moon hover:bg-card-hover transition-colors shrink-0"
          onClick={() => setShowForm(true)}
        >
          + Add Book
        </button>
      </div>

      {/* Filters: Unread and Owned are 3-way toggles; formats union */}
      <div className={`flex gap-1.5 text-xs overflow-x-auto transition-opacity ${searching ? 'opacity-40' : ''}`}>
        <button
          type="button"
          aria-label={`Read status filter: ${READ_FILTER_LABELS[readFilter]}. Tap to change.`}
          className={`px-3 py-1.5 rounded-full whitespace-nowrap border transition-colors ${
            readFilter !== 'all'
              ? 'bg-gold text-night border-gold font-medium'
              : 'border-hairline text-moon-dim hover:text-moon'
          }`}
          onClick={() => setReadFilter((cur) => nextInCycle(READ_FILTER_CYCLE, cur))}
        >
          {READ_FILTER_LABELS[readFilter]}
        </button>
        <button
          type="button"
          aria-label={`Ownership filter: ${OWNED_FILTER_LABELS[ownedFilter]}. Tap to change.`}
          className={`px-3 py-1.5 rounded-full whitespace-nowrap border transition-colors ${
            ownedFilter !== 'all'
              ? 'bg-gold text-night border-gold font-medium'
              : 'border-hairline text-moon-dim hover:text-moon'
          }`}
          onClick={() => setOwnedFilter((cur) => nextInCycle(OWNED_FILTER_CYCLE, cur))}
        >
          {OWNED_FILTER_LABELS[ownedFilter]}
        </button>
        {FORMAT_FILTERS.map((f) => (
          <button
            key={f.id}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap border transition-colors ${
              formatFilters.has(f.id)
                ? 'bg-gold text-night border-gold font-medium'
                : 'border-hairline text-moon-dim hover:text-moon'
            }`}
            onClick={() => toggleFormat(f.id)}
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
            covers={Array.from({ length: NEXT_READS_COUNT_PER_SHELF }, (_, i) => {
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
          className="flex items-center gap-1.5 font-display text-sm font-medium text-moon mb-2"
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

      {/* My Shelf — filtered by the toggles, the tapped category, or the search box */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-sm font-medium text-moon">
            My Shelf ({owned.length})
          </h3>
          {searching ? (
            <span className="text-xs text-moon-dim">Searching all books</span>
          ) : (
            activeTag && (
              <button
                type="button"
                className="flex items-center gap-1.5 text-xs border border-gold/50 text-gold rounded-full px-2.5 py-1 hover:bg-card-hover transition-colors"
                onClick={() => setActiveTag(null)}
                aria-label={`Clear category filter: ${activeTag}`}
              >
                {activeTag}
                <span aria-hidden="true">✕</span>
              </button>
            )
          )}
        </div>
        {owned.length === 0 ? (
          <p className="text-sm text-moon-dim">
            {searching ? 'No books match your search.' : 'No books match this filter yet.'}
          </p>
        ) : (
          <div>
            {toShelfRows(owned, 3).map((row, i) => {
              const padded = [...row, ...Array<Book | null>(3 - row.length).fill(null)]
              return (
                <PhotoShelf
                  key={i}
                  config={mainShelfForRow(i)}
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
    </div>
  )
}

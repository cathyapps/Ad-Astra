import { useMemo, useState } from 'react'
import type { Book, ReadingLog } from '@/types/library'
import type { DrillRow } from '@/lib/chartData'
import { DetailModal } from '@/features/shared/DetailModal'
import { BookCover } from './BookCover'
import { BookDetail } from './BookDetail'

interface Props {
  /** Chart title, shown as the heading. */
  title: string
  /** Every row of data behind the chart. */
  rows: DrillRow[]
  /** Open straight onto one row's records (a tapped slice / bar / dot). */
  initialRowId?: string
  books: Book[]
  readingLogs: ReadingLog[]
  onClose: () => void
  onUpdateBook: (id: string, patch: Partial<Book>) => void
  onDeleteBook: (id: string) => void
  onCreateReadingLog: (input: Partial<ReadingLog> & { bookId: string }) => void
}

const distinctBooks = (row: DrillRow) => new Set(row.records.map((r) => r.book.id)).size

/** "View the data behind this chart": a list of the chart's data points,
 *  each opening to the books / reading days that make it up, each of
 *  which opens the normal book details. */
export function ChartDataSheet({
  title,
  rows,
  initialRowId,
  books,
  readingLogs,
  onClose,
  onUpdateBook,
  onDeleteBook,
  onCreateReadingLog,
}: Props) {
  const [rowId, setRowId] = useState<string | undefined>(initialRowId ?? (rows.length === 1 ? rows[0].id : undefined))
  const [bookId, setBookId] = useState<string | undefined>()

  const row = rows.find((r) => r.id === rowId)
  const book = books.find((b) => b.id === bookId)
  const records = useMemo(
    () => [...(row?.records ?? [])].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.book.title.localeCompare(b.book.title)),
    [row],
  )
  // A single-row chart (number card) has no list to go back to.
  const canGoBack = row != null && rows.length > 1

  if (book) {
    return (
      <DetailModal onClose={onClose}>
        <BookDetail
          book={book}
          readingLogs={readingLogs}
          onUpdate={(patch) => onUpdateBook(book.id, patch)}
          onDelete={() => {
            onDeleteBook(book.id)
            setBookId(undefined)
          }}
          onCreateLog={(input) => onCreateReadingLog({ ...input, bookId: book.id })}
          onClose={() => setBookId(undefined)}
        />
      </DetailModal>
    )
  }

  return (
    <DetailModal onClose={onClose}>
      <div className="border border-hairline rounded-xl p-4 space-y-4 bg-card">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {canGoBack && (
              <button className="text-xs text-cosmic hover:text-moon mb-1" onClick={() => setRowId(undefined)}>
                ← All data
              </button>
            )}
            <h2 className="font-display text-lg text-moon leading-snug">{row && rows.length > 1 ? row.label : title}</h2>
            <p className="text-xs text-moon-dim mt-0.5">
              {row
                ? `${distinctBooks(row)} ${distinctBooks(row) === 1 ? 'book' : 'books'}${row.value ? ` · ${row.value}` : ''}`
                : `${title} · ${rows.length} data ${rows.length === 1 ? 'point' : 'points'}`}
            </p>
          </div>
          <button className="text-sm text-moon-dim hover:text-moon shrink-0" onClick={onClose}>
            Close
          </button>
        </div>

        {row ? (
          records.length === 0 ? (
            <p className="text-sm text-moon-dim">No books behind this data point.</p>
          ) : (
            <div className="space-y-2">
              {records.map((r, i) => (
                <button
                  key={`${r.key}-${r.date ?? ''}-${i}`}
                  type="button"
                  className="w-full flex items-center gap-3 text-left rounded-lg hover:bg-card-hover transition-colors -mx-1 px-1 py-1"
                  onClick={() => setBookId(r.book.id)}
                >
                  <BookCover title={r.book.title} coverUrl={r.book.coverUrl} seed={r.book.id} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-sm text-moon leading-snug">{r.book.title}</div>
                    {r.book.author && <div className="text-xs text-moon-dim truncate">{r.book.author}</div>}
                    <div className="text-xs text-moon-dim mt-1 flex flex-wrap gap-x-2">
                      {r.date && <span>{r.date}</span>}
                      <span className="text-gold">{r.detail}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : rows.length === 0 ? (
          <p className="text-sm text-moon-dim">No data for this range yet.</p>
        ) : (
          <div className="divide-y divide-hairline">
            {rows.map((r) => (
              <button
                key={r.id}
                type="button"
                className="w-full flex items-center justify-between gap-3 text-left py-2 hover:bg-card-hover transition-colors"
                onClick={() => setRowId(r.id)}
              >
                <span className="text-sm text-moon truncate">{r.label}</span>
                <span className="text-xs text-moon-dim shrink-0">
                  {r.value} · {distinctBooks(r)} {distinctBooks(r) === 1 ? 'book' : 'books'} ›
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </DetailModal>
  )
}

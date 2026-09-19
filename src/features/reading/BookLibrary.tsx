import { BOOK_STATUS_ORDER, type Book } from '@/types/reading'
import { BOOK_STATUS_LABELS } from './readingLabels'

interface Props {
  books: Book[]
  onSelect: (id: string) => void
  selectedId?: string
}

export function BookLibrary({ books, onSelect, selectedId }: Props) {
  return (
    <div className="space-y-5">
      {BOOK_STATUS_ORDER.map((status) => {
        const group = books.filter((b) => b.status === status)
        if (group.length === 0) return null
        return (
          <div key={status}>
            <h3 className="text-xs uppercase tracking-wide text-moon-dim mb-2">
              {BOOK_STATUS_LABELS[status]} ({group.length})
            </h3>
            <div className="space-y-1.5">
              {group.map((b) => (
                <button
                  key={b.id}
                  onClick={() => onSelect(b.id)}
                  className={`w-full text-left text-sm border rounded-lg px-3 py-2 transition-colors ${
                    b.id === selectedId
                      ? 'border-gold/40 bg-card-hover text-moon'
                      : 'border-hairline text-moon hover:bg-card-hover'
                  }`}
                >
                  {b.title}
                  {b.author && <span className="text-xs text-moon-dim ml-2">{b.author}</span>}
                </button>
              ))}
            </div>
          </div>
        )
      })}
      {books.length === 0 && (
        <p className="text-sm text-moon-dim">
          No books yet — add your first one to the library below.
        </p>
      )}
    </div>
  )
}

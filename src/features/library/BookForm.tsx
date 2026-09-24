import { useState } from 'react'
import type { Book, BookFormat, BookOwnership } from '@/types/library'
import { BOOK_FORMAT_OPTIONS, BOOK_OWNERSHIP_OPTIONS } from '@/types/library'
import { BookSearch } from './BookSearch'

const inputClass =
  'mt-1 w-full border border-hairline bg-night rounded-lg px-3 py-2 text-sm text-moon placeholder:text-moon-dim/60'
const labelClass = 'text-sm block text-moon-dim'

interface Props {
  initial?: Partial<Book>
  onSave: (input: Partial<Book> & { title: string }) => void
  onCancel: () => void
}

export function BookForm({ initial, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [author, setAuthor] = useState(initial?.author ?? '')
  const [series, setSeries] = useState(initial?.series ?? '')
  const [genre, setGenre] = useState(initial?.genre ?? '')
  const [ownership, setOwnership] = useState<BookOwnership>(initial?.ownership ?? 'tbd')
  const [format, setFormat] = useState<BookFormat>(initial?.format ?? 'tbd')
  const [totalPages, setTotalPages] = useState(initial?.totalPages?.toString() ?? '')
  const [totalMinutes, setTotalMinutes] = useState(initial?.totalMinutes?.toString() ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  // Fields that come from an Open Library match rather than being typed
  // in directly. Kept separately so a manual edit to, say, the title
  // doesn't wipe out the cover/ISBN/etc. that came with the match.
  const [matched, setMatched] = useState<Partial<Book> | null>(
    initial?.openLibraryWorkKey
      ? {
          isbn: initial.isbn,
          coverUrl: initial.coverUrl,
          publisher: initial.publisher,
          publishYear: initial.publishYear,
          subjects: initial.subjects,
          openLibraryWorkKey: initial.openLibraryWorkKey,
          externalMetadata: initial.externalMetadata,
        }
      : null,
  )
  const [showSearch, setShowSearch] = useState(!initial)

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!title.trim()) return
        onSave({
          ...initial,
          ...matched,
          title: title.trim(),
          author: author || undefined,
          series: series || undefined,
          genre: genre || undefined,
          ownership,
          format,
          totalPages: totalPages ? Number(totalPages) : undefined,
          totalMinutes: totalMinutes ? Number(totalMinutes) : undefined,
          notes: notes || undefined,
        })
      }}
    >
      {!initial && (
        <div>
          <button
            type="button"
            className="text-xs text-cosmic hover:text-moon transition-colors"
            onClick={() => setShowSearch((v) => !v)}
          >
            {showSearch ? 'Enter details manually instead' : 'Search Open Library instead'}
          </button>
          {showSearch && (
            <div className="mt-2">
              <BookSearch
                onPick={(draft) => {
                  setTitle(draft.title)
                  if (draft.author) setAuthor(draft.author)
                  if (draft.genre) setGenre(draft.genre)
                  if (draft.totalPages != null) setTotalPages(String(draft.totalPages))
                  setMatched({
                    isbn: draft.isbn,
                    coverUrl: draft.coverUrl,
                    publisher: draft.publisher,
                    publishYear: draft.publishYear,
                    subjects: draft.subjects,
                    openLibraryWorkKey: draft.openLibraryWorkKey,
                    externalMetadata: draft.externalMetadata,
                  })
                  setShowSearch(false)
                }}
              />
            </div>
          )}
        </div>
      )}

      {matched?.openLibraryWorkKey && (
        <div className="flex items-center gap-2.5 border border-hairline rounded-lg px-2.5 py-2 bg-night/40">
          {matched.coverUrl ? (
            <img src={matched.coverUrl} alt="" className="w-8 h-11 object-cover rounded shrink-0" />
          ) : null}
          <div className="text-xs text-moon-dim flex-1">
            Matched via Open Library
            {matched.publisher ? ` · ${matched.publisher}` : ''}
            {matched.publishYear ? ` · ${matched.publishYear}` : ''}
          </div>
          <button
            type="button"
            className="text-xs text-moon-dim hover:text-red-400 transition-colors shrink-0"
            onClick={() => setMatched(null)}
          >
            Clear match
          </button>
        </div>
      )}

      <div>
        <label className={labelClass}>Title</label>
        <input autoFocus className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="flex gap-3">
        <label className={`${labelClass} flex-1`}>
          Author
          <input className={inputClass} value={author} onChange={(e) => setAuthor(e.target.value)} />
        </label>
        <label className={`${labelClass} flex-1`}>
          Series
          <input className={inputClass} value={series} onChange={(e) => setSeries(e.target.value)} />
        </label>
      </div>
      <label className={labelClass}>
        Genre
        <input className={inputClass} value={genre} onChange={(e) => setGenre(e.target.value)} />
      </label>
      <div className="flex gap-3">
        <label className={`${labelClass} flex-1`}>
          Ownership
          <select
            className={inputClass}
            value={ownership}
            onChange={(e) => setOwnership(e.target.value as BookOwnership)}
          >
            {BOOK_OWNERSHIP_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label className={`${labelClass} flex-1`}>
          Format
          <select className={inputClass} value={format} onChange={(e) => setFormat(e.target.value as BookFormat)}>
            {BOOK_FORMAT_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex gap-3">
        <label className={`${labelClass} flex-1`}>
          Total pages (print edition)
          <input
            inputMode="numeric"
            className={inputClass}
            value={totalPages}
            onChange={(e) => setTotalPages(e.target.value)}
          />
        </label>
        <label className={`${labelClass} flex-1`}>
          Total minutes (audio)
          <input
            inputMode="numeric"
            className={inputClass}
            value={totalMinutes}
            onChange={(e) => setTotalMinutes(e.target.value)}
          />
        </label>
      </div>
      <label className={labelClass}>
        Notes
        <textarea className={inputClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          className="border border-hairline rounded-lg px-3 py-2.5 text-sm flex-1 text-moon hover:bg-card-hover transition-colors"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button type="submit" className="rounded-lg px-3 py-2.5 text-sm flex-1 bg-gold text-night font-medium">
          Save
        </button>
      </div>
    </form>
  )
}

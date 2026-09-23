import { useState } from 'react'
import type { Book, BookFormat, BookOwnership } from '@/types/library'
import { BOOK_FORMAT_OPTIONS, BOOK_OWNERSHIP_OPTIONS } from '@/types/library'

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

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!title.trim()) return
        onSave({
          ...initial,
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
          Total pages
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

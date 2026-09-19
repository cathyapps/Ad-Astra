import { useState } from 'react'
import type { Book, BookFormat } from '@/types/reading'

const inputClass =
  'mt-1 w-full border border-hairline bg-night rounded-lg px-3 py-2 text-sm text-moon placeholder:text-moon-dim/60'
const labelClass = 'text-sm block text-moon-dim'

const FORMATS: BookFormat[] = ['physical', 'ebook', 'audiobook']

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
  const [format, setFormat] = useState<BookFormat | ''>(initial?.format ?? '')
  const [owned, setOwned] = useState(initial?.owned ?? false)

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
          format: format || undefined,
          owned,
        })
      }}
    >
      <div>
        <label className={labelClass}>Title</label>
        <input autoFocus className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Author
          <input className={inputClass} value={author} onChange={(e) => setAuthor(e.target.value)} />
        </label>
        <label className={labelClass}>
          Series
          <input className={inputClass} value={series} onChange={(e) => setSeries(e.target.value)} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Genre
          <input className={inputClass} value={genre} onChange={(e) => setGenre(e.target.value)} />
        </label>
        <label className={labelClass}>
          Format
          <select
            className={inputClass}
            value={format}
            onChange={(e) => setFormat(e.target.value as BookFormat)}
          >
            <option value="">—</option>
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-moon-dim">
        <input
          type="checkbox"
          checked={owned}
          onChange={(e) => setOwned(e.target.checked)}
          className="accent-gold w-4 h-4"
        />
        I own a copy
      </label>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          className="border border-hairline rounded-lg px-3 py-2.5 text-sm flex-1 text-moon hover:bg-card-hover transition-colors"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg px-3 py-2.5 text-sm flex-1 bg-gold text-night font-medium"
        >
          Save
        </button>
      </div>
    </form>
  )
}

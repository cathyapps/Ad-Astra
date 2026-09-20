import { useState } from 'react'
import type { Book, BookFormat, BookSource } from '@/types/reading'
import { BOOK_SOURCES } from '@/types/reading'

const inputClass =
  'mt-1 w-full border border-hairline bg-night rounded-lg px-3 py-2 text-sm text-moon placeholder:text-moon-dim/60'
const labelClass = 'text-sm block text-moon-dim'

const FORMATS: BookFormat[] = ['physical', 'ebook', 'audiobook']
const SOURCE_LABELS: Record<BookSource, string> = { owned: 'Owned', library: 'Library', other: 'Other' }

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
  const [source, setSource] = useState<BookSource>(initial?.source ?? 'owned')
  const [totalPages, setTotalPages] = useState(
    initial?.totalPages != null ? String(initial.totalPages) : '',
  )
  const [totalMinutes, setTotalMinutes] = useState(
    initial?.totalMinutes != null ? String(initial.totalMinutes) : '',
  )

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
          source,
          totalPages: totalPages ? Number(totalPages) : undefined,
          totalMinutes: totalMinutes ? Number(totalMinutes) : undefined,
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
                {f === 'ebook' ? 'Ebook (Kindle, etc.)' : f}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={labelClass}>
        Source
        <select className={inputClass} value={source} onChange={(e) => setSource(e.target.value as BookSource)}>
          {BOOK_SOURCES.map((s) => (
            <option key={s} value={s}>
              {SOURCE_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Total pages
          <input
            className={inputClass}
            inputMode="numeric"
            placeholder="for % / speed stats"
            value={totalPages}
            onChange={(e) => setTotalPages(e.target.value)}
          />
        </label>
        {format === 'audiobook' && (
          <label className={labelClass}>
            Total minutes
            <input
              className={inputClass}
              inputMode="numeric"
              placeholder="audiobook runtime"
              value={totalMinutes}
              onChange={(e) => setTotalMinutes(e.target.value)}
            />
          </label>
        )}
      </div>

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

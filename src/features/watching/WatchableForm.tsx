import { useState } from 'react'
import type { Watchable, WatchableType, WatchFormat } from '@/types/watching'

const inputClass =
  'mt-1 w-full border border-hairline bg-night rounded-lg px-3 py-2 text-sm text-moon placeholder:text-moon-dim/60'
const labelClass = 'text-sm block text-moon-dim'

const FORMATS: WatchFormat[] = ['streaming', 'disc', 'theater']

interface Props {
  initial?: Partial<Watchable>
  onSave: (input: Partial<Watchable> & { title: string }) => void
  onCancel: () => void
}

export function WatchableForm({ initial, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [type, setType] = useState<WatchableType>(initial?.type ?? 'movie')
  const [genre, setGenre] = useState(initial?.genre ?? '')
  const [format, setFormat] = useState<WatchFormat | ''>(initial?.format ?? '')

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!title.trim()) return
        onSave({
          ...initial,
          title: title.trim(),
          type,
          genre: genre || undefined,
          format: format || undefined,
        })
      }}
    >
      <div>
        <label className={labelClass}>Title</label>
        <input autoFocus className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Type
          <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as WatchableType)}>
            <option value="movie">Movie</option>
            <option value="tv_show">TV Show</option>
          </select>
        </label>
        <label className={labelClass}>
          Genre
          <input className={inputClass} value={genre} onChange={(e) => setGenre(e.target.value)} />
        </label>
      </div>

      <label className={labelClass}>
        Format
        <select className={inputClass} value={format} onChange={(e) => setFormat(e.target.value as WatchFormat)}>
          <option value="">—</option>
          {FORMATS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
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

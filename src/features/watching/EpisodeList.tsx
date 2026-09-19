import { useState } from 'react'
import type { Episode } from '@/types/watching'

interface Props {
  watchableId: string
  episodes: Episode[]
  onCreate: (input: Partial<Episode> & { watchableId: string }) => void
  onUpdate: (id: string, patch: Partial<Episode>) => void
  onDelete: (id: string) => void
}

/** A tv_show Watchable's episodes — its Moons. */
export function EpisodeList({ watchableId, episodes, onCreate, onUpdate, onDelete }: Props) {
  const [season, setSeason] = useState('')
  const [episodeNumber, setEpisodeNumber] = useState('')
  const [name, setName] = useState('')
  const sorted = [...episodes].sort((a, b) => a.sortIndex - b.sortIndex)
  const watchedCount = episodes.filter((e) => e.watched).length

  return (
    <div className="space-y-1.5">
      <div className="text-xs text-moon-dim">
        {watchedCount}/{episodes.length} episodes watched
      </div>
      {sorted.map((ep) => (
        <div
          key={ep.id}
          className="border border-hairline rounded-lg px-3 py-2 bg-night/40 flex items-center gap-2.5"
        >
          <input
            type="checkbox"
            checked={ep.watched}
            onChange={(e) => onUpdate(ep.id, { watched: e.target.checked })}
            className="accent-gold w-4 h-4"
          />
          <span className={`text-sm flex-1 ${ep.watched ? 'line-through text-moon-dim' : 'text-moon'}`}>
            {ep.season != null && ep.episodeNumber != null && `S${ep.season}E${ep.episodeNumber} · `}
            {ep.name || 'Untitled episode'}
          </span>
          <button
            className="text-xs text-moon-dim hover:text-red-400 transition-colors"
            onClick={() => onDelete(ep.id)}
          >
            ✕
          </button>
        </div>
      ))}

      <form
        className="flex gap-2 pt-1"
        onSubmit={(e) => {
          e.preventDefault()
          onCreate({
            watchableId,
            season: season ? Number(season) : undefined,
            episodeNumber: episodeNumber ? Number(episodeNumber) : undefined,
            name: name || undefined,
          })
          setSeason('')
          setEpisodeNumber('')
          setName('')
        }}
      >
        <input
          className="w-14 border border-hairline bg-night rounded-lg px-2 py-1.5 text-sm text-moon"
          placeholder="S"
          inputMode="numeric"
          value={season}
          onChange={(e) => setSeason(e.target.value)}
        />
        <input
          className="w-14 border border-hairline bg-night rounded-lg px-2 py-1.5 text-sm text-moon"
          placeholder="E"
          inputMode="numeric"
          value={episodeNumber}
          onChange={(e) => setEpisodeNumber(e.target.value)}
        />
        <input
          className="flex-1 border border-hairline bg-night rounded-lg px-2.5 py-1.5 text-sm text-moon placeholder:text-moon-dim/60"
          placeholder="Episode name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="submit"
          className="border border-hairline rounded-lg px-3 py-1.5 text-sm text-moon-dim hover:text-moon hover:bg-card-hover transition-colors"
        >
          Add
        </button>
      </form>
    </div>
  )
}

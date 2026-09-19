import { useState } from 'react'
import type { Constellation, Star } from '@/types'
import type {
  Episode,
  ViewingCompletionStatus,
  ViewingSession,
  WatchList,
  Watchable,
} from '@/types/watching'
import { WATCH_STATUS_LABELS, WatchStarRating, WatchStatusBadge } from './watchingLabels'
import { EpisodeList } from './EpisodeList'
import { allowedWatchTransitions } from '@/lib/mediaTransitions'

const inputClass =
  'border border-hairline bg-night rounded-lg px-2.5 py-1.5 text-sm text-moon placeholder:text-moon-dim/60'

interface Props {
  watchable: Watchable
  stars: Star[]
  constellations: Constellation[]
  watchLists: WatchList[]
  listIdsForWatchable: string[]
  sessions: ViewingSession[]
  episodes: Episode[]
  onUpdate: (patch: Partial<Watchable>) => void
  onDelete: () => void
  onLogSession: (input: Partial<ViewingSession>) => void
  onToggleList: (watchListId: string) => void
  onCreateEpisode: (input: Partial<Episode> & { watchableId: string }) => void
  onUpdateEpisode: (id: string, patch: Partial<Episode>) => void
  onDeleteEpisode: (id: string) => void
  onClose: () => void
}

export function WatchableDetail({
  watchable,
  stars,
  constellations,
  watchLists,
  listIdsForWatchable,
  sessions,
  episodes,
  onUpdate,
  onDelete,
  onLogSession,
  onToggleList,
  onCreateEpisode,
  onUpdateEpisode,
  onDeleteEpisode,
  onClose,
}: Props) {
  const [showLogForm, setShowLogForm] = useState(false)
  const [minutes, setMinutes] = useState('')
  const [notes, setNotes] = useState('')
  const [completion, setCompletion] = useState<ViewingCompletionStatus | ''>('')
  const [rating, setRating] = useState('')

  const options = allowedWatchTransitions(watchable.status)
  const relatedStars = stars.filter((s) => watchable.relatedStarIds.includes(s.id))
  const relatedConstellations = constellations.filter((c) =>
    watchable.relatedConstellationIds.includes(c.id),
  )

  function toggleStar(id: string) {
    const set = new Set(watchable.relatedStarIds)
    if (set.has(id)) set.delete(id)
    else set.add(id)
    onUpdate({ relatedStarIds: Array.from(set) })
  }

  function toggleConstellation(id: string) {
    const set = new Set(watchable.relatedConstellationIds)
    if (set.has(id)) set.delete(id)
    else set.add(id)
    onUpdate({ relatedConstellationIds: Array.from(set) })
  }

  return (
    <div className="border border-hairline rounded-xl p-4 space-y-4 bg-card">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-lg text-moon">{watchable.title}</h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <WatchStatusBadge status={watchable.status} />
            <span className="text-xs text-moon-dim">
              {watchable.type === 'movie' ? 'Movie' : 'TV Show'}
            </span>
            <WatchStarRating rating={watchable.rating} />
          </div>
        </div>
        <button className="text-sm text-moon-dim hover:text-moon" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((s) => (
          <button
            key={s}
            className="text-xs border border-hairline rounded-full px-3 py-1.5 text-moon-dim hover:text-moon hover:bg-card-hover transition-colors"
            onClick={() => onUpdate({ status: s })}
          >
            Move to {WATCH_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {watchable.type === 'tv_show' && (
        <div>
          <h3 className="text-sm font-medium text-moon mb-2">Episodes (Moons)</h3>
          <EpisodeList
            watchableId={watchable.id}
            episodes={episodes}
            onCreate={onCreateEpisode}
            onUpdate={onUpdateEpisode}
            onDelete={onDeleteEpisode}
          />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-moon">Viewing Log</h3>
          <button
            className="text-xs text-cosmic hover:text-moon transition-colors"
            onClick={() => setShowLogForm((v) => !v)}
          >
            + Log session
          </button>
        </div>

        {showLogForm && (
          <form
            className="border border-hairline rounded-lg p-3 space-y-2 mb-2 bg-night/40"
            onSubmit={(e) => {
              e.preventDefault()
              onLogSession({
                minutes: minutes ? Number(minutes) : undefined,
                notes: notes || undefined,
                completionStatus: completion || undefined,
                rating: rating ? Number(rating) : undefined,
              })
              setMinutes('')
              setNotes('')
              setCompletion('')
              setRating('')
              setShowLogForm(false)
            }}
          >
            <input
              className={`${inputClass} w-full`}
              placeholder="Minutes watched"
              inputMode="numeric"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
            <input
              className={`${inputClass} w-full`}
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                className={inputClass}
                value={completion}
                onChange={(e) => setCompletion(e.target.value as ViewingCompletionStatus)}
              >
                <option value="">Still watching</option>
                <option value="completed">Finished it</option>
                <option value="dnf">Stopping here (DNF)</option>
              </select>
              <select className={inputClass} value={rating} onChange={(e) => setRating(e.target.value)}>
                <option value="">Rating</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {'★'.repeat(n)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-1.5 text-sm bg-gold text-night font-medium"
            >
              Save entry
            </button>
          </form>
        )}

        <div className="space-y-1.5">
          {sessions.length === 0 && <p className="text-xs text-moon-dim">No sessions logged yet.</p>}
          {sessions.map((s) => (
            <div key={s.id} className="text-xs text-moon-dim border border-hairline rounded-lg px-3 py-2">
              {s.date}
              {s.minutes != null && ` · ${s.minutes}m`}
              {s.completionStatus === 'completed' && ' · finished'}
              {s.completionStatus === 'dnf' && ' · DNF'}
              {s.notes && <div className="text-moon mt-0.5">{s.notes}</div>}
            </div>
          ))}
        </div>
      </div>

      {watchLists.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-wide text-moon-dim mb-2">Lists</h3>
          <div className="flex flex-wrap gap-1.5">
            {watchLists.map((l) => (
              <button
                key={l.id}
                onClick={() => onToggleList(l.id)}
                className={`text-xs border rounded-full px-2.5 py-1 transition-colors ${
                  listIdsForWatchable.includes(l.id)
                    ? 'bg-cosmic text-night border-cosmic font-medium'
                    : 'border-hairline text-moon-dim hover:text-moon'
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {stars.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-wide text-moon-dim mb-2">Related Stars</h3>
          <div className="flex flex-wrap gap-1.5">
            {stars.map((s) => (
              <button
                key={s.id}
                onClick={() => toggleStar(s.id)}
                className={`text-xs border rounded-full px-2.5 py-1 transition-colors ${
                  relatedStars.includes(s)
                    ? 'bg-cosmic text-night border-cosmic font-medium'
                    : 'border-hairline text-moon-dim hover:text-moon'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {constellations.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-wide text-moon-dim mb-2">Related Constellations</h3>
          <div className="flex flex-wrap gap-1.5">
            {constellations.map((c) => (
              <button
                key={c.id}
                onClick={() => toggleConstellation(c.id)}
                className={`text-xs border rounded-full px-2.5 py-1 transition-colors ${
                  relatedConstellations.includes(c)
                    ? 'bg-cosmic text-night border-cosmic font-medium'
                    : 'border-hairline text-moon-dim hover:text-moon'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <button className="text-xs text-moon-dim hover:text-red-400 transition-colors" onClick={onDelete}>
        Delete
      </button>
    </div>
  )
}

import { WATCH_STATUS_ORDER, type Watchable } from '@/types/watching'
import { WATCH_STATUS_LABELS } from './watchingLabels'

interface Props {
  watchables: Watchable[]
  onSelect: (id: string) => void
  selectedId?: string
}

const TYPE_ICON = { movie: '🎬', tv_show: '📺' }

export function WatchableLibrary({ watchables, onSelect, selectedId }: Props) {
  return (
    <div className="space-y-5">
      {WATCH_STATUS_ORDER.map((status) => {
        const group = watchables.filter((w) => w.status === status)
        if (group.length === 0) return null
        return (
          <div key={status}>
            <h3 className="text-xs uppercase tracking-wide text-moon-dim mb-2">
              {WATCH_STATUS_LABELS[status]} ({group.length})
            </h3>
            <div className="space-y-1.5">
              {group.map((w) => (
                <button
                  key={w.id}
                  onClick={() => onSelect(w.id)}
                  className={`w-full text-left text-sm border rounded-lg px-3 py-2 transition-colors ${
                    w.id === selectedId
                      ? 'border-gold/40 bg-card-hover text-moon'
                      : 'border-hairline text-moon hover:bg-card-hover'
                  }`}
                >
                  {TYPE_ICON[w.type]} {w.title}
                </button>
              ))}
            </div>
          </div>
        )
      })}
      {watchables.length === 0 && (
        <p className="text-sm text-moon-dim">
          Nothing on your list yet — add your first movie or show below.
        </p>
      )}
    </div>
  )
}

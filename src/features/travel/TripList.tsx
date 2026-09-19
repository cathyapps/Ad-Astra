import { TRIP_STATUS_ORDER, type Trip } from '@/types/travel'
import { TRIP_STATUS_LABELS } from './travelLabels'

interface Props {
  trips: Trip[]
  onSelect: (id: string) => void
  selectedId?: string
}

export function TripList({ trips, onSelect, selectedId }: Props) {
  return (
    <div className="space-y-5">
      {TRIP_STATUS_ORDER.map((status) => {
        const group = trips.filter((t) => t.status === status)
        if (group.length === 0) return null
        return (
          <div key={status}>
            <h3 className="text-xs uppercase tracking-wide text-moon-dim mb-2">
              {TRIP_STATUS_LABELS[status]} ({group.length})
            </h3>
            <div className="space-y-1.5">
              {group.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onSelect(t.id)}
                  className={`w-full text-left text-sm border rounded-lg px-3 py-2 transition-colors ${
                    t.id === selectedId
                      ? 'border-gold/40 bg-card-hover text-moon'
                      : 'border-hairline text-moon hover:bg-card-hover'
                  }`}
                >
                  {t.name}
                  {t.startDate && <span className="text-xs text-moon-dim ml-2">{t.startDate}</span>}
                </button>
              ))}
            </div>
          </div>
        )
      })}
      {trips.length === 0 && (
        <p className="text-sm text-moon-dim">No trips yet — turn a destination into a trip, or start one below.</p>
      )}
    </div>
  )
}

import { DESTINATION_STATUS_ORDER, type TravelDestination } from '@/types/travel'
import { DESTINATION_STATUS_LABELS } from './travelLabels'

interface Props {
  destinations: TravelDestination[]
  onSelect: (id: string) => void
  selectedId?: string
}

export function DestinationList({ destinations, onSelect, selectedId }: Props) {
  return (
    <div className="space-y-5">
      {DESTINATION_STATUS_ORDER.map((status) => {
        const group = destinations.filter((d) => d.status === status)
        if (group.length === 0) return null
        return (
          <div key={status}>
            <h3 className="text-xs uppercase tracking-wide text-moon-dim mb-2">
              {DESTINATION_STATUS_LABELS[status]} ({group.length})
            </h3>
            <div className="space-y-1.5">
              {group.map((d) => (
                <button
                  key={d.id}
                  onClick={() => onSelect(d.id)}
                  className={`w-full text-left text-sm border rounded-lg px-3 py-2 transition-colors ${
                    d.id === selectedId
                      ? 'border-gold/40 bg-card-hover text-moon'
                      : 'border-hairline text-moon hover:bg-card-hover'
                  }`}
                >
                  {d.name}
                  {d.country && <span className="text-xs text-moon-dim ml-2">{d.country}</span>}
                </button>
              ))}
            </div>
          </div>
        )
      })}
      {destinations.length === 0 && (
        <p className="text-sm text-moon-dim">
          No destinations yet — add your first place to the bucket list below.
        </p>
      )}
    </div>
  )
}

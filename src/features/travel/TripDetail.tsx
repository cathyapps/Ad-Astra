import type { TravelDestination, Trip, TripItem } from '@/types/travel'
import { TRIP_STATUS_LABELS, TripStatusBadge } from './travelLabels'
import { allowedTripTransitions } from './travelTransitions'
import { TripItemList } from './TripItemList'

interface Props {
  trip: Trip
  destinations: TravelDestination[]
  items: TripItem[]
  onUpdate: (patch: Partial<Trip>) => void
  onDelete: () => void
  onCreateItem: (input: Partial<TripItem> & { tripId: string; name: string }) => void
  onUpdateItem: (id: string, patch: Partial<TripItem>) => void
  onDeleteItem: (id: string) => void
  onClose: () => void
}

export function TripDetail({
  trip,
  destinations,
  items,
  onUpdate,
  onDelete,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
  onClose,
}: Props) {
  const options = allowedTripTransitions(trip.status)
  const tripDestinations = destinations.filter((d) => trip.destinationIds.includes(d.id))

  return (
    <div className="border border-hairline rounded-xl p-4 space-y-4 bg-card">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-lg text-moon">{trip.name}</h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <TripStatusBadge status={trip.status} />
            {tripDestinations.length > 0 && (
              <span className="text-xs text-moon-dim">
                {tripDestinations.map((d) => d.name).join(', ')}
              </span>
            )}
          </div>
        </div>
        <button className="text-sm text-moon-dim hover:text-moon" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-moon-dim">
        {trip.startDate && trip.endDate && (
          <div>
            {trip.startDate} → {trip.endDate}
          </div>
        )}
        {trip.numDays != null && <div>{trip.numDays} days</div>}
        {trip.budget != null && <div>Budget: ${trip.budget}</div>}
      </div>

      {trip.notes && <p className="text-sm text-moon-dim">{trip.notes}</p>}

      <div className="flex flex-wrap gap-2">
        {options.map((s) => (
          <button
            key={s}
            className="text-xs border border-hairline rounded-full px-3 py-1.5 text-moon-dim hover:text-moon hover:bg-card-hover transition-colors"
            onClick={() => onUpdate({ status: s })}
          >
            Move to {TRIP_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-medium text-moon mb-2">Itinerary</h3>
        <TripItemList
          tripId={trip.id}
          items={items}
          onCreate={onCreateItem}
          onUpdate={onUpdateItem}
          onDelete={onDeleteItem}
        />
      </div>

      <button
        className="text-xs text-moon-dim hover:text-red-400 transition-colors"
        onClick={onDelete}
      >
        Delete trip
      </button>
    </div>
  )
}

import { useState } from 'react'
import type { Trip, TripItem } from '@/types/travel'
import { TripForm } from './TripForm'
import { TripList } from './TripList'
import { TripDetail } from './TripDetail'

interface Props {
  trips: Trip[]
  tripItems: TripItem[]
  onCreateTrip: (input: Partial<Trip> & { name: string }) => Promise<Trip> | void
  onUpdateTrip: (id: string, patch: Partial<Trip>) => void
  onDeleteTrip: (id: string) => void
  onCreateTripItem: (input: Partial<TripItem> & { tripId: string; name: string }) => void
  onUpdateTripItem: (id: string, patch: Partial<TripItem>) => void
  onDeleteTripItem: (id: string) => void
}

// Every travel aspiration is a Trip — a lone someday idea is just a Trip
// with one Planet, so there's no separate "destinations" list anymore.
export function Travel({
  trips,
  tripItems,
  onCreateTrip,
  onUpdateTrip,
  onDeleteTrip,
  onCreateTripItem,
  onUpdateTripItem,
  onDeleteTripItem,
}: Props) {
  const [selectedTripId, setSelectedTripId] = useState<string | undefined>()
  const [showTripForm, setShowTripForm] = useState(false)

  const selectedTrip = trips.find((t) => t.id === selectedTripId)

  async function handleCreateTrip(input: Partial<Trip> & { name: string }, firstPlanetName?: string) {
    const result = onCreateTrip(input)
    const created = result instanceof Promise ? await result : undefined
    setShowTripForm(false)
    if (created) {
      if (firstPlanetName) {
        onCreateTripItem({ tripId: created.id, name: firstPlanetName, type: 'country' })
      }
      setSelectedTripId(created.id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-moon">Trips</h2>
        <button
          className="border border-hairline rounded-full px-3 py-1.5 text-sm text-moon hover:bg-card-hover transition-colors"
          onClick={() => setShowTripForm(true)}
        >
          + New Trip
        </button>
      </div>

      {showTripForm && (
        <div className="border border-hairline rounded-xl p-4 bg-card">
          <TripForm offerFirstPlanet onCancel={() => setShowTripForm(false)} onSave={handleCreateTrip} />
        </div>
      )}

      {selectedTrip && (
        <TripDetail
          trip={selectedTrip}
          items={tripItems.filter((i) => i.tripId === selectedTrip.id)}
          onUpdate={(patch) => onUpdateTrip(selectedTrip.id, patch)}
          onDelete={() => {
            onDeleteTrip(selectedTrip.id)
            setSelectedTripId(undefined)
          }}
          onCreateItem={onCreateTripItem}
          onUpdateItem={onUpdateTripItem}
          onDeleteItem={onDeleteTripItem}
          onClose={() => setSelectedTripId(undefined)}
        />
      )}

      <TripList trips={trips} onSelect={setSelectedTripId} selectedId={selectedTripId} />
    </div>
  )
}

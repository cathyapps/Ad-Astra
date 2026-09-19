import { useState } from 'react'
import type { Constellation, Star } from '@/types'
import type { TravelDestination, Trip, TripItem } from '@/types/travel'
import { DestinationForm } from './DestinationForm'
import { DestinationList } from './DestinationList'
import { DestinationDetail } from './DestinationDetail'
import { TripForm } from './TripForm'
import { TripList } from './TripList'
import { TripDetail } from './TripDetail'

interface Props {
  stars: Star[]
  constellations: Constellation[]
  destinations: TravelDestination[]
  trips: Trip[]
  tripItems: TripItem[]
  onCreateDestination: (input: Partial<TravelDestination> & { name: string }) => void
  onUpdateDestination: (id: string, patch: Partial<TravelDestination>) => void
  onDeleteDestination: (id: string) => void
  onCreateTrip: (input: Partial<Trip> & { name: string }) => Promise<Trip> | void
  onUpdateTrip: (id: string, patch: Partial<Trip>) => void
  onDeleteTrip: (id: string) => void
  onCreateTripItem: (input: Partial<TripItem> & { tripId: string; name: string }) => void
  onUpdateTripItem: (id: string, patch: Partial<TripItem>) => void
  onDeleteTripItem: (id: string) => void
}

type SubTab = 'destinations' | 'trips'

export function Travel({
  stars,
  constellations,
  destinations,
  trips,
  tripItems,
  onCreateDestination,
  onUpdateDestination,
  onDeleteDestination,
  onCreateTrip,
  onUpdateTrip,
  onDeleteTrip,
  onCreateTripItem,
  onUpdateTripItem,
  onDeleteTripItem,
}: Props) {
  const [subTab, setSubTab] = useState<SubTab>('destinations')
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | undefined>()
  const [selectedTripId, setSelectedTripId] = useState<string | undefined>()
  const [showDestinationForm, setShowDestinationForm] = useState(false)
  const [showTripForm, setShowTripForm] = useState(false)

  const selectedDestination = destinations.find((d) => d.id === selectedDestinationId)
  const selectedTrip = trips.find((t) => t.id === selectedTripId)

  async function startTripFromDestination(destination: TravelDestination) {
    const result = onCreateTrip({
      name: destination.name,
      destinationIds: [destination.id],
      relatedStarIds: destination.relatedStarIds,
    })
    const created = result instanceof Promise ? await result : undefined
    setSelectedDestinationId(undefined)
    setSubTab('trips')
    if (created) setSelectedTripId(created.id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 text-sm border border-hairline rounded-full p-1">
          <button
            className={`rounded-full px-3 py-1 transition-colors ${
              subTab === 'destinations' ? 'bg-gold text-night font-medium' : 'text-moon-dim'
            }`}
            onClick={() => setSubTab('destinations')}
          >
            Destinations
          </button>
          <button
            className={`rounded-full px-3 py-1 transition-colors ${
              subTab === 'trips' ? 'bg-gold text-night font-medium' : 'text-moon-dim'
            }`}
            onClick={() => setSubTab('trips')}
          >
            Trips
          </button>
        </div>
        <button
          className="border border-hairline rounded-full px-3 py-1.5 text-sm text-moon hover:bg-card-hover transition-colors"
          onClick={() =>
            subTab === 'destinations' ? setShowDestinationForm(true) : setShowTripForm(true)
          }
        >
          + New {subTab === 'destinations' ? 'Destination' : 'Trip'}
        </button>
      </div>

      {subTab === 'destinations' && (
        <>
          {showDestinationForm && (
            <div className="border border-hairline rounded-xl p-4 bg-card">
              <DestinationForm
                onCancel={() => setShowDestinationForm(false)}
                onSave={(input) => {
                  onCreateDestination(input)
                  setShowDestinationForm(false)
                }}
              />
            </div>
          )}

          {selectedDestination && (
            <DestinationDetail
              destination={selectedDestination}
              stars={stars}
              constellations={constellations}
              onUpdate={(patch) => onUpdateDestination(selectedDestination.id, patch)}
              onDelete={() => {
                onDeleteDestination(selectedDestination.id)
                setSelectedDestinationId(undefined)
              }}
              onStartTrip={() => startTripFromDestination(selectedDestination)}
              onClose={() => setSelectedDestinationId(undefined)}
            />
          )}

          <DestinationList
            destinations={destinations}
            onSelect={setSelectedDestinationId}
            selectedId={selectedDestinationId}
          />
        </>
      )}

      {subTab === 'trips' && (
        <>
          {showTripForm && (
            <div className="border border-hairline rounded-xl p-4 bg-card">
              <TripForm
                destinations={destinations}
                onCancel={() => setShowTripForm(false)}
                onSave={(input) => {
                  onCreateTrip(input)
                  setShowTripForm(false)
                }}
              />
            </div>
          )}

          {selectedTrip && (
            <TripDetail
              trip={selectedTrip}
              destinations={destinations}
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
        </>
      )}
    </div>
  )
}

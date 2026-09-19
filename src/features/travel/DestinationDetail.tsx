import type { Constellation, Star } from '@/types'
import type { TravelDestination } from '@/types/travel'
import { DESTINATION_STATUS_LABELS, DestinationStatusBadge, LIFE_STAGE_LABELS } from './travelLabels'
import { allowedDestinationTransitions } from './travelTransitions'

interface Props {
  destination: TravelDestination
  stars: Star[]
  constellations: Constellation[]
  onUpdate: (patch: Partial<TravelDestination>) => void
  onDelete: () => void
  onStartTrip: () => void
  onClose: () => void
}

export function DestinationDetail({
  destination,
  stars,
  constellations,
  onUpdate,
  onDelete,
  onStartTrip,
  onClose,
}: Props) {
  const options = allowedDestinationTransitions(destination.status)
  const relatedStars = stars.filter((s) => destination.relatedStarIds.includes(s.id))
  const relatedConstellations = constellations.filter((c) =>
    destination.relatedConstellationIds.includes(c.id),
  )

  function toggleStar(id: string) {
    const set = new Set(destination.relatedStarIds)
    if (set.has(id)) set.delete(id)
    else set.add(id)
    onUpdate({ relatedStarIds: Array.from(set) })
  }

  function toggleConstellation(id: string) {
    const set = new Set(destination.relatedConstellationIds)
    if (set.has(id)) set.delete(id)
    else set.add(id)
    onUpdate({ relatedConstellationIds: Array.from(set) })
  }

  const location = [destination.city, destination.region, destination.country]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="border border-hairline rounded-xl p-4 space-y-4 bg-card">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-lg text-moon">{destination.name}</h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <DestinationStatusBadge status={destination.status} />
            {location && <span className="text-xs text-moon-dim">{location}</span>}
          </div>
        </div>
        <button className="text-sm text-moon-dim hover:text-moon" onClick={onClose}>
          Close
        </button>
      </div>

      {destination.why && <p className="text-sm text-moon-dim">{destination.why}</p>}

      <div className="grid grid-cols-2 gap-2 text-xs text-moon-dim">
        {destination.desiredTripLength && <div>Length: {destination.desiredTripLength}</div>}
        {destination.bestSeason && <div>Best season: {destination.bestSeason}</div>}
        {destination.estimatedCost != null && <div>Est. cost: ${destination.estimatedCost}</div>}
        {destination.companions && destination.companions.length > 0 && (
          <div>With: {destination.companions.join(', ')}</div>
        )}
      </div>

      {destination.lifeStageTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {destination.lifeStageTags.map((tag) => (
            <span key={tag} className="text-xs border border-hairline rounded-full px-2.5 py-1 text-moon-dim">
              {LIFE_STAGE_LABELS[tag]}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {options.map((s) => (
          <button
            key={s}
            className="text-xs border border-hairline rounded-full px-3 py-1.5 text-moon-dim hover:text-moon hover:bg-card-hover transition-colors"
            onClick={() => onUpdate({ status: s })}
          >
            Move to {DESTINATION_STATUS_LABELS[s]}
          </button>
        ))}
        <button
          className="text-xs border border-gold/40 rounded-full px-3 py-1.5 text-gold hover:bg-gold/10 transition-colors"
          onClick={onStartTrip}
        >
          Start a trip from this
        </button>
      </div>

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

      <button
        className="text-xs text-moon-dim hover:text-red-400 transition-colors"
        onClick={onDelete}
      >
        Delete destination
      </button>
    </div>
  )
}

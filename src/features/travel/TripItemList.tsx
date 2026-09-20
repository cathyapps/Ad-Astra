import { useState } from 'react'
import { LIFE_STAGE_TAGS, TRIP_ITEM_TYPES, type LifeStageTag, type TripItem, type TripItemType } from '@/types/travel'
import { LIFE_STAGE_LABELS } from './travelLabels'

interface Props {
  tripId: string
  items: TripItem[]
  onCreate: (input: Partial<TripItem> & { tripId: string; name: string }) => void
  onUpdate: (id: string, patch: Partial<TripItem>) => void
  onDelete: (id: string) => void
}

const TYPE_ICON: Record<TripItemType, string> = {
  country: '🪐',
  region: '🪐',
  city: '🪐',
  attraction: '🗺️',
  activity: '✦',
  restaurant: '🍽️',
  hotel: '🛏️',
  transportation: '🚆',
}

const smallInput =
  'border border-hairline bg-night rounded-lg px-2.5 py-1.5 text-sm text-moon placeholder:text-moon-dim/60'

function MoonRow({
  item,
  onUpdate,
  onDelete,
}: {
  item: TripItem
  onUpdate: (id: string, patch: Partial<TripItem>) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="border border-hairline rounded-lg px-3 py-2 bg-night/40 flex items-center gap-2.5 ml-5">
      <span className="text-sm">{TYPE_ICON[item.type]}</span>
      <div className="flex-1">
        <input
          className="w-full bg-transparent text-sm text-moon focus:outline-none"
          value={item.name}
          onChange={(e) => onUpdate(item.id, { name: e.target.value })}
        />
        {item.date && <div className="text-xs text-moon-dim">{item.date}</div>}
      </div>
      {item.cost != null && <span className="text-xs text-moon-dim">${item.cost}</span>}
      <button
        className="text-xs text-moon-dim hover:text-red-400 transition-colors"
        onClick={() => onDelete(item.id)}
      >
        ✕
      </button>
    </div>
  )
}

function PlanetDetails({
  planet,
  onUpdate,
}: {
  planet: TripItem
  onUpdate: (id: string, patch: Partial<TripItem>) => void
}) {
  function toggleTag(tag: LifeStageTag) {
    const set = new Set(planet.lifeStageTags ?? [])
    if (set.has(tag)) set.delete(tag)
    else set.add(tag)
    onUpdate(planet.id, { lifeStageTags: Array.from(set) })
  }

  return (
    <div className="ml-5 border border-hairline rounded-lg p-3 space-y-2 bg-night/30">
      <textarea
        className={`${smallInput} w-full`}
        rows={2}
        placeholder="Why do you want to go here?"
        value={planet.why ?? ''}
        onChange={(e) => onUpdate(planet.id, { why: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          className={smallInput}
          placeholder="Best season"
          value={planet.bestSeason ?? ''}
          onChange={(e) => onUpdate(planet.id, { bestSeason: e.target.value })}
        />
        <input
          className={smallInput}
          placeholder="Desired length (e.g. 10 days)"
          value={planet.desiredTripLength ?? ''}
          onChange={(e) => onUpdate(planet.id, { desiredTripLength: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          className={smallInput}
          placeholder="Estimated cost"
          inputMode="decimal"
          value={planet.estimatedCost ?? ''}
          onChange={(e) =>
            onUpdate(planet.id, { estimatedCost: e.target.value ? Number(e.target.value) : undefined })
          }
        />
        <input
          className={smallInput}
          placeholder="Companions (comma separated)"
          value={(planet.companions ?? []).join(', ')}
          onChange={(e) =>
            onUpdate(planet.id, {
              companions: e.target.value
                .split(',')
                .map((c) => c.trim())
                .filter(Boolean),
            })
          }
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {LIFE_STAGE_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={`text-xs border rounded-full px-2.5 py-1 transition-colors ${
              (planet.lifeStageTags ?? []).includes(tag)
                ? 'bg-cosmic text-night border-cosmic font-medium'
                : 'border-hairline text-moon-dim hover:text-moon'
            }`}
          >
            {LIFE_STAGE_LABELS[tag]}
          </button>
        ))}
      </div>
    </div>
  )
}

/** A trip's itinerary as Planets (top-level items) each with their own
 *  Moons nested within — a Planet is usually a country or city, and a
 *  Moon is whatever's inside it (another city, an attraction, a meal, a
 *  transfer). Nesting depth is just "top-level" vs "nested" for this
 *  trip, not a fixed country > city > activity hierarchy. */
export function TripItemList({ tripId, items, onCreate, onUpdate, onDelete }: Props) {
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<TripItemType>('country')
  const [addingMoonTo, setAddingMoonTo] = useState<string | null>(null)
  const [moonName, setMoonName] = useState('')
  const [moonType, setMoonType] = useState<TripItemType>('city')
  const [detailsOpenFor, setDetailsOpenFor] = useState<string | null>(null)

  const planets = items.filter((i) => !i.parentItemId).sort((a, b) => a.sortIndex - b.sortIndex)
  const moonsOf = (planetId: string) =>
    items.filter((i) => i.parentItemId === planetId).sort((a, b) => a.sortIndex - b.sortIndex)

  return (
    <div className="space-y-3">
      {planets.map((planet) => (
        <div key={planet.id} className="space-y-1.5">
          <div className="border border-hairline rounded-lg px-3 py-2 bg-card flex items-center gap-2.5">
            <span className="text-sm">{TYPE_ICON[planet.type]}</span>
            <div className="flex-1">
              <input
                className="w-full bg-transparent text-sm text-moon font-medium focus:outline-none"
                value={planet.name}
                onChange={(e) => onUpdate(planet.id, { name: e.target.value })}
              />
              {planet.why && <div className="text-xs text-moon-dim truncate">{planet.why}</div>}
            </div>
            <button
              className="text-xs text-moon-dim hover:text-moon transition-colors"
              onClick={() => setDetailsOpenFor((cur) => (cur === planet.id ? null : planet.id))}
            >
              {detailsOpenFor === planet.id ? 'Hide' : 'Details'}
            </button>
            <button
              className="text-xs text-cosmic hover:text-moon transition-colors"
              onClick={() => setAddingMoonTo(planet.id)}
            >
              + Moon
            </button>
            <button
              className="text-xs text-moon-dim hover:text-red-400 transition-colors"
              onClick={() => onDelete(planet.id)}
            >
              ✕
            </button>
          </div>

          {detailsOpenFor === planet.id && <PlanetDetails planet={planet} onUpdate={onUpdate} />}

          {moonsOf(planet.id).map((moon) => (
            <MoonRow key={moon.id} item={moon} onUpdate={onUpdate} onDelete={onDelete} />
          ))}

          {addingMoonTo === planet.id && (
            <form
              className="flex gap-2 ml-5"
              onSubmit={(e) => {
                e.preventDefault()
                if (!moonName.trim()) return
                onCreate({ tripId, parentItemId: planet.id, name: moonName.trim(), type: moonType })
                setMoonName('')
                setAddingMoonTo(null)
              }}
            >
              <select
                className="border border-hairline bg-night rounded-lg px-2 py-1.5 text-sm text-moon"
                value={moonType}
                onChange={(e) => setMoonType(e.target.value as TripItemType)}
              >
                {TRIP_ITEM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_ICON[t]} {t}
                  </option>
                ))}
              </select>
              <input
                autoFocus
                className="flex-1 border border-hairline bg-night rounded-lg px-2.5 py-1.5 text-sm text-moon placeholder:text-moon-dim/60"
                placeholder="Add a moon — a city, activity, meal…"
                value={moonName}
                onChange={(e) => setMoonName(e.target.value)}
              />
              <button
                type="submit"
                className="border border-hairline rounded-lg px-3 py-1.5 text-sm text-moon-dim hover:text-moon hover:bg-card-hover transition-colors"
              >
                Add
              </button>
            </form>
          )}
        </div>
      ))}

      <form
        className="flex gap-2 pt-1"
        onSubmit={(e) => {
          e.preventDefault()
          if (!newName.trim()) return
          onCreate({ tripId, name: newName.trim(), type: newType })
          setNewName('')
        }}
      >
        <select
          className="border border-hairline bg-night rounded-lg px-2 py-1.5 text-sm text-moon"
          value={newType}
          onChange={(e) => setNewType(e.target.value as TripItemType)}
        >
          {TRIP_ITEM_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_ICON[t]} {t}
            </option>
          ))}
        </select>
        <input
          className="flex-1 border border-hairline bg-night rounded-lg px-2.5 py-1.5 text-sm text-moon placeholder:text-moon-dim/60"
          placeholder="Add a planet — a country, region, or city…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
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

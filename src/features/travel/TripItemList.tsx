import { useState } from 'react'
import { TRIP_ITEM_TYPES, type TripItem, type TripItemType } from '@/types/travel'

interface Props {
  tripId: string
  items: TripItem[]
  onCreate: (input: Partial<TripItem> & { tripId: string; name: string }) => void
  onUpdate: (id: string, patch: Partial<TripItem>) => void
  onDelete: (id: string) => void
}

const TYPE_ICON: Record<TripItemType, string> = {
  city: '🪐',
  attraction: '🗺️',
  activity: '✦',
  restaurant: '🍽️',
  hotel: '🛏️',
  transportation: '🚆',
}

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

/** A trip's itinerary as Planets (top-level items — usually cities) each
 *  with their own Moons (activities/attractions/etc. nested within). Items
 *  with no parent and type other than 'city' (e.g. a transportation leg
 *  between cities) are still shown as their own Planet-tier row. */
export function TripItemList({ tripId, items, onCreate, onUpdate, onDelete }: Props) {
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<TripItemType>('city')
  const [addingMoonTo, setAddingMoonTo] = useState<string | null>(null)
  const [moonName, setMoonName] = useState('')
  const [moonType, setMoonType] = useState<TripItemType>('activity')

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
              {planet.date && <div className="text-xs text-moon-dim">{planet.date}</div>}
            </div>
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
                {TRIP_ITEM_TYPES.filter((t) => t !== 'city').map((t) => (
                  <option key={t} value={t}>
                    {TYPE_ICON[t]} {t}
                  </option>
                ))}
              </select>
              <input
                autoFocus
                className="flex-1 border border-hairline bg-night rounded-lg px-2.5 py-1.5 text-sm text-moon placeholder:text-moon-dim/60"
                placeholder="Add a moon…"
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
          placeholder="Add a planet — usually a city…"
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

import { useState } from 'react'
import type { Trip } from '@/types/travel'

const inputClass =
  'mt-1 w-full border border-hairline bg-night rounded-lg px-3 py-2 text-sm text-moon placeholder:text-moon-dim/60'
const labelClass = 'text-sm block text-moon-dim'

interface Props {
  initial?: Partial<Trip>
  // Only offered when creating a brand new trip — lets a lone "someday"
  // idea (a single place) become a Trip with its first Planet in one step.
  offerFirstPlanet?: boolean
  onSave: (input: Partial<Trip> & { name: string }, firstPlanetName?: string) => void
  onCancel: () => void
}

export function TripForm({ initial, offerFirstPlanet, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [firstPlanetName, setFirstPlanetName] = useState('')
  const [startDate, setStartDate] = useState(initial?.startDate ?? '')
  const [endDate, setEndDate] = useState(initial?.endDate ?? '')
  const [budget, setBudget] = useState(initial?.budget != null ? String(initial.budget) : '')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return
        const numDays =
          startDate && endDate
            ? Math.max(
                1,
                Math.round(
                  (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                    (1000 * 60 * 60 * 24),
                ) + 1,
              )
            : initial?.numDays
        onSave(
          {
            ...initial,
            name: name.trim(),
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            numDays,
            budget: budget ? Number(budget) : undefined,
            notes: notes || undefined,
          },
          firstPlanetName.trim() || undefined,
        )
      }}
    >
      <div>
        <label className={labelClass}>Trip name</label>
        <input
          autoFocus
          className={inputClass}
          placeholder="e.g. Japan — spring 2027"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {offerFirstPlanet && (
        <label className={labelClass}>
          First planet (optional — a country, region, or city)
          <input
            className={inputClass}
            placeholder="e.g. Japan, or just Kyoto"
            value={firstPlanetName}
            onChange={(e) => setFirstPlanetName(e.target.value)}
          />
        </label>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Start date
          <input
            type="date"
            className={inputClass}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label className={labelClass}>
          End date
          <input
            type="date"
            className={inputClass}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
      </div>

      <label className={labelClass}>
        Budget
        <input
          className={inputClass}
          inputMode="decimal"
          placeholder="$"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        />
      </label>

      <label className={labelClass}>
        Notes
        <textarea className={inputClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          className="border border-hairline rounded-lg px-3 py-2.5 text-sm flex-1 text-moon hover:bg-card-hover transition-colors"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg px-3 py-2.5 text-sm flex-1 bg-gold text-night font-medium"
        >
          Save
        </button>
      </div>
    </form>
  )
}

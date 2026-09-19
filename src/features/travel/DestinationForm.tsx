import { useState } from 'react'
import type { TravelDestination } from '@/types/travel'
import { LIFE_STAGE_TAGS } from '@/types/travel'
import { LIFE_STAGE_LABELS } from './travelLabels'

const inputClass =
  'mt-1 w-full border border-hairline bg-night rounded-lg px-3 py-2 text-sm text-moon placeholder:text-moon-dim/60'
const labelClass = 'text-sm block text-moon-dim'

interface Props {
  initial?: Partial<TravelDestination>
  onSave: (input: Partial<TravelDestination> & { name: string }) => void
  onCancel: () => void
}

export function DestinationForm({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [country, setCountry] = useState(initial?.country ?? '')
  const [region, setRegion] = useState(initial?.region ?? '')
  const [city, setCity] = useState(initial?.city ?? '')
  const [why, setWhy] = useState(initial?.why ?? '')
  const [desiredTripLength, setDesiredTripLength] = useState(initial?.desiredTripLength ?? '')
  const [bestSeason, setBestSeason] = useState(initial?.bestSeason ?? '')
  const [estimatedCost, setEstimatedCost] = useState(
    initial?.estimatedCost != null ? String(initial.estimatedCost) : '',
  )
  const [companions, setCompanions] = useState((initial?.companions ?? []).join(', '))
  const [lifeStageTags, setLifeStageTags] = useState<Set<string>>(
    new Set(initial?.lifeStageTags ?? []),
  )

  function toggleTag(tag: string) {
    setLifeStageTags((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return
        onSave({
          ...initial,
          name: name.trim(),
          country: country || undefined,
          region: region || undefined,
          city: city || undefined,
          why: why || undefined,
          desiredTripLength: desiredTripLength || undefined,
          bestSeason: bestSeason || undefined,
          estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
          companions: companions
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean),
          lifeStageTags: Array.from(lifeStageTags) as TravelDestination['lifeStageTags'],
        })
      }}
    >
      <div>
        <label className={labelClass}>Destination</label>
        <input
          autoFocus
          className={inputClass}
          placeholder="e.g. Kyoto in cherry blossom season"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <label className={labelClass}>
          Country
          <input className={inputClass} value={country} onChange={(e) => setCountry(e.target.value)} />
        </label>
        <label className={labelClass}>
          Region
          <input className={inputClass} value={region} onChange={(e) => setRegion(e.target.value)} />
        </label>
        <label className={labelClass}>
          City
          <input className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} />
        </label>
      </div>

      <label className={labelClass}>
        Why I want to go
        <textarea className={inputClass} rows={2} value={why} onChange={(e) => setWhy(e.target.value)} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Desired trip length
          <input
            className={inputClass}
            placeholder="e.g. 10-14 days"
            value={desiredTripLength}
            onChange={(e) => setDesiredTripLength(e.target.value)}
          />
        </label>
        <label className={labelClass}>
          Best season
          <input
            className={inputClass}
            placeholder="e.g. spring"
            value={bestSeason}
            onChange={(e) => setBestSeason(e.target.value)}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Estimated cost
          <input
            className={inputClass}
            inputMode="decimal"
            placeholder="$"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
          />
        </label>
        <label className={labelClass}>
          Companions
          <input
            className={inputClass}
            placeholder="Mike, college friends…"
            value={companions}
            onChange={(e) => setCompanions(e.target.value)}
          />
        </label>
      </div>

      <div>
        <span className={labelClass}>When (life stage)</span>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {LIFE_STAGE_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`text-xs border rounded-full px-3 py-1.5 transition-colors ${
                lifeStageTags.has(tag)
                  ? 'bg-cosmic text-night border-cosmic font-medium'
                  : 'border-hairline text-moon-dim hover:text-moon'
              }`}
            >
              {LIFE_STAGE_LABELS[tag]}
            </button>
          ))}
        </div>
      </div>

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

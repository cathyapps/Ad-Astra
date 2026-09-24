import type { Star } from '@/types'

interface Props {
  stars: Star[]
  onSelect: (id: string) => void
  selectedId?: string
}

/** "In Orbit" now shows only individual Stars whose stage is Current
 *  Orbit — Constellations never appear here on their own (a
 *  Constellation is just a grouping of Stars, not itself something you
 *  "orbit"). The grouped, constellation-aware view lives in the
 *  collapsible section below this. */
export function InOrbitStars({ stars, onSelect, selectedId }: Props) {
  const orbit = stars.filter((s) => s.stage === 'current_orbit')

  if (orbit.length === 0) {
    return (
      <p className="text-sm text-moon-dim">
        Nothing in orbit yet — move a Star to Current Orbit to see it here.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {orbit.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={`text-sm border rounded-lg px-3 py-2 transition-colors ${
            s.id === selectedId
              ? 'border-gold/40 bg-card-hover text-moon'
              : 'border-hairline text-moon hover:bg-card-hover'
          }`}
        >
          {s.name} <span className="text-gold text-xs">{s.progress}%</span>
        </button>
      ))}
    </div>
  )
}

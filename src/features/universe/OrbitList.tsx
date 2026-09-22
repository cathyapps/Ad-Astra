import type { Constellation, Star } from '@/types'

interface Props {
  stars: Star[]
  constellations: Constellation[]
  onSelect: (id: string) => void
  onSelectConstellation: (id: string) => void
  selectedId?: string
}

/** Mirrors exactly what StarMap draws: each Constellation (with its
 *  member Stars) and any Current Orbit Star not in a constellation. */
export function OrbitList({
  stars,
  constellations,
  onSelect,
  onSelectConstellation,
  selectedId,
}: Props) {
  const starById = new Map(stars.map((s) => [s.id, s]))
  const inConstellation = new Set(constellations.flatMap((c) => c.starIds))
  const unaffiliatedOrbit = stars.filter(
    (s) => s.stage === 'current_orbit' && !inConstellation.has(s.id),
  )

  if (constellations.length === 0 && unaffiliatedOrbit.length === 0) {
    return (
      <p className="text-sm text-moon-dim">
        Nothing in orbit yet — move a Star to Current Orbit, or group some into a Constellation.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {constellations.map((c) => {
        const members = c.starIds.map((id) => starById.get(id)).filter((s): s is Star => !!s)
        return (
          <div key={c.id} className="border border-hairline rounded-lg p-3 bg-card">
            <button
              className="text-sm font-medium text-moon hover:text-gold transition-colors"
              onClick={() => onSelectConstellation(c.id)}
            >
              {c.name}
            </button>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {members.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onSelect(s.id)}
                  className={`text-xs border rounded-full px-2.5 py-1 transition-colors ${
                    s.id === selectedId
                      ? 'border-gold/40 bg-card-hover text-moon'
                      : 'border-hairline text-moon-dim hover:text-moon'
                  }`}
                >
                  {s.name}
                </button>
              ))}
              {members.length === 0 && <span className="text-xs text-moon-dim">No Stars yet</span>}
            </div>
          </div>
        )
      })}

      {unaffiliatedOrbit.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {unaffiliatedOrbit.map((s) => (
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
      )}
    </div>
  )
}

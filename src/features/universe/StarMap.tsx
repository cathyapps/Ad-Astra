import type { Constellation, Star } from '@/types'
import { placeStars } from '@/lib/starPlacement'

interface Props {
  stars: Star[]
  constellations: Constellation[]
  onSelect: (id: string) => void
  selectedId?: string
}

const GOLD = '#FFD77A'
const BLUE = '#6E9CFF'

/** The Universe map: every non-completed Star, placed like a real star
 *  chart — scattered, unlabeled, brighter/bigger the closer it is to
 *  Current Orbit. A Star disappears from the map the moment it's
 *  completed. The only lines drawn are between Stars that share a
 *  Constellation (connect-the-dots within that group) — there is no
 *  hub-and-spoke structure and nothing here is laid out linearly. */
export function StarMap({ stars, constellations, onSelect, selectedId }: Props) {
  const size = 360
  const points = placeStars(stars, constellations)
  const byId = new Map(points.map((p) => [p.star.id, p]))
  const empty = points.length === 0

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full h-auto border border-hairline rounded-xl bg-night"
    >
      {empty && (
        <text x={size / 2} y={size / 2} textAnchor="middle" fontSize={11} fill="#8891A8">
          No stars in your sky yet
        </text>
      )}

      {constellations.map((c) => {
        const members = c.starIds.map((id) => byId.get(id)).filter((p): p is (typeof points)[number] => !!p)
        if (members.length < 2) return null
        return (
          <g key={c.id}>
            {members.slice(1).map((p, i) => {
              const prev = members[i]
              return (
                <line
                  key={p.star.id}
                  x1={prev.x * size}
                  y1={prev.y * size}
                  x2={p.x * size}
                  y2={p.y * size}
                  stroke={BLUE}
                  strokeOpacity={0.28}
                  strokeWidth={0.75}
                />
              )
            })}
          </g>
        )
      })}

      {points.map((p) => {
        const isSelected = p.star.id === selectedId
        const color = p.star.stage === 'current_orbit' ? GOLD : BLUE
        const r = isSelected ? p.size + 1.5 : p.size
        return (
          <g key={p.star.id} onClick={() => onSelect(p.star.id)} className="cursor-pointer">
            {isSelected && (
              <circle cx={p.x * size} cy={p.y * size} r={r + 6} fill={color} fillOpacity={0.15} />
            )}
            {p.star.stage === 'current_orbit' && (
              <circle cx={p.x * size} cy={p.y * size} r={r + 3} fill={color} fillOpacity={0.18} />
            )}
            <circle cx={p.x * size} cy={p.y * size} r={r} fill={color} fillOpacity={p.opacity} />
          </g>
        )
      })}
    </svg>
  )
}

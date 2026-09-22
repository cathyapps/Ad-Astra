import type { Constellation, Star } from '@/types'

interface Props {
  stars: Star[]
  constellations: Constellation[]
  onSelect: (id: string) => void
  selectedId?: string
}

const GOLD = '#FFD77A'
const BLUE = '#6E9CFF'

/** The Universe map: every Constellation (clustered, with its member
 *  Stars around it) plus any Current Orbit Star that isn't part of a
 *  constellation. This is deliberately NOT "every Star" — Someday / On
 *  the Horizon / Completed Stars outside a constellation don't clutter
 *  the map; they're one tap away via "See all Stars" below it. */
export function StarMap({ stars, constellations, onSelect, selectedId }: Props) {
  const starById = new Map(stars.map((s) => [s.id, s]))
  const inConstellation = new Set(constellations.flatMap((c) => c.starIds))
  const unaffiliatedOrbit = stars.filter(
    (s) => s.stage === 'current_orbit' && !inConstellation.has(s.id),
  )

  const size = 560
  const center = size / 2
  const hubRadius = 190

  const nodeCount = constellations.length + unaffiliatedOrbit.length
  const empty = nodeCount === 0

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full h-auto border border-hairline rounded-xl bg-night"
    >
      <circle cx={center} cy={center} r={3} fill={GOLD} />

      {empty && (
        <text x={center} y={center - 40} textAnchor="middle" fontSize={12} fill="#8891A8">
          No constellations or Stars in orbit yet
        </text>
      )}

      {constellations.map((c, i) => {
        const angle = (i / Math.max(nodeCount, 1)) * Math.PI * 2
        const hx = center + hubRadius * Math.cos(angle)
        const hy = center + hubRadius * Math.sin(angle)
        const members = c.starIds.map((id) => starById.get(id)).filter((s): s is Star => !!s)

        return (
          <g key={c.id}>
            <line x1={center} y1={center} x2={hx} y2={hy} stroke={BLUE} strokeOpacity={0.15} />
            <circle cx={hx} cy={hy} r={5} fill={BLUE} fillOpacity={0.55} />
            <text x={hx} y={hy - 12} textAnchor="middle" fontSize={11} fill="#E8ECF7" fillOpacity={0.9}>
              {c.name}
            </text>
            {members.map((star, j) => {
              const memberAngle = (j / Math.max(members.length, 1)) * Math.PI * 2
              const mx = hx + 32 * Math.cos(memberAngle)
              const my = hy + 32 * Math.sin(memberAngle)
              const isSelected = star.id === selectedId
              const color = star.stage === 'current_orbit' ? GOLD : BLUE
              return (
                <g key={star.id} onClick={() => onSelect(star.id)} className="cursor-pointer">
                  <line x1={hx} y1={hy} x2={mx} y2={my} stroke={color} strokeOpacity={0.2} />
                  {isSelected && <circle cx={mx} cy={my} r={9} fill={color} fillOpacity={0.2} />}
                  <circle cx={mx} cy={my} r={isSelected ? 5 : 3.5} fill={color} fillOpacity={0.9} />
                  <text x={mx + 7} y={my + 3} fontSize={9} fill="#E8ECF7" fillOpacity={0.75}>
                    {star.name.length > 16 ? star.name.slice(0, 16) + '…' : star.name}
                  </text>
                </g>
              )
            })}
          </g>
        )
      })}

      {unaffiliatedOrbit.map((star, i) => {
        const angle = ((constellations.length + i) / Math.max(nodeCount, 1)) * Math.PI * 2
        const x = center + hubRadius * Math.cos(angle)
        const y = center + hubRadius * Math.sin(angle)
        const isSelected = star.id === selectedId
        return (
          <g key={star.id} onClick={() => onSelect(star.id)} className="cursor-pointer">
            <line x1={center} y1={center} x2={x} y2={y} stroke={GOLD} strokeOpacity={0.15} />
            {isSelected && <circle cx={x} cy={y} r={11} fill={GOLD} fillOpacity={0.18} />}
            <circle cx={x} cy={y} r={isSelected ? 6 : 4} fill={GOLD} fillOpacity={0.9} />
            <text x={x + 9} y={y + 4} fontSize={10} fill="#E8ECF7" fillOpacity={0.85}>
              {star.name.length > 20 ? star.name.slice(0, 20) + '…' : star.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

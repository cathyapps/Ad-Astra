import type { Star } from '@/types'
import { STAR_STAGE_ORDER } from '@/types'

interface Props {
  stars: Star[]
  onSelect: (id: string) => void
  selectedId?: string
}

const RING_RADIUS: Record<string, number> = {
  current_orbit: 60,
  planning: 110,
  on_the_horizon: 160,
  someday: 210,
  completed: 250,
  archived: 250,
}

export function StarMap({ stars, onSelect, selectedId }: Props) {
  const visible = stars.filter((s) => s.stage !== 'archived')
  const byStage = new Map<string, Star[]>()
  for (const s of visible) {
    byStage.set(s.stage, [...(byStage.get(s.stage) ?? []), s])
  }

  const size = 560
  const center = size / 2

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full h-auto border border-hairline rounded-xl bg-night"
    >
      <circle cx={center} cy={center} r={3} fill="#FFD77A" />
      {STAR_STAGE_ORDER.filter((s) => s !== 'archived').map((stage) => (
        <circle
          key={stage}
          cx={center}
          cy={center}
          r={RING_RADIUS[stage]}
          fill="none"
          stroke="#E8ECF7"
          strokeOpacity={0.12}
        />
      ))}
      {[...byStage.entries()].flatMap(([stage, group]) =>
        group.map((star, i) => {
          const r = RING_RADIUS[stage] ?? 250
          const angle = (i / Math.max(group.length, 1)) * Math.PI * 2
          const x = center + r * Math.cos(angle)
          const y = center + r * Math.sin(angle)
          const isSelected = star.id === selectedId
          const color = stage === 'current_orbit' ? '#FFD77A' : '#6E9CFF'
          return (
            <g key={star.id} onClick={() => onSelect(star.id)} className="cursor-pointer">
              {isSelected && <circle cx={x} cy={y} r={11} fill={color} fillOpacity={0.18} />}
              <circle
                cx={x}
                cy={y}
                r={isSelected ? 6 : 4}
                fill={color}
                fillOpacity={stage === 'completed' ? 0.35 : 0.9}
              />
              <text x={x + 9} y={y + 4} fontSize={10} fill="#E8ECF7" fillOpacity={0.85}>
                {star.name.length > 20 ? star.name.slice(0, 20) + '…' : star.name}
              </text>
            </g>
          )
        }),
      )}
    </svg>
  )
}

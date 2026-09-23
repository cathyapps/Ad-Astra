import type { ChartType } from '@/types/charts'
import type { ChartPoint } from '@/lib/chartData'

interface Props {
  type: ChartType
  points: ChartPoint[]
}

const GOLD = '#FFD77A'
const BLUE = '#6E9CFF'
const PIE_COLORS = ['#FFD77A', '#6E9CFF', '#8FE3A6', '#F293C0', '#B79CFF', '#FF9E6E', '#7FD8E0', '#E8ECF7']

const W = 320
const H = 200
const PAD = 28

export function ChartRenderer({ type, points }: Props) {
  if (points.length === 0) {
    return <p className="text-sm text-moon-dim py-8 text-center">No data for this range yet.</p>
  }

  if (type === 'pie') return <PieChart points={points} />

  const max = Math.max(1, ...points.map((p) => p.value))
  const innerW = W - PAD * 2
  const innerH = H - PAD * 2
  const step = points.length > 1 ? innerW / (points.length - 1) : 0

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#8891A8" strokeOpacity={0.3} />
      <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#8891A8" strokeOpacity={0.3} />

      {type === 'bar' &&
        points.map((p, i) => {
          const barW = Math.max(4, (innerW / points.length) * 0.6)
          const x = PAD + (innerW / points.length) * i + (innerW / points.length - barW) / 2
          const barH = (p.value / max) * innerH
          return (
            <g key={p.label}>
              <rect x={x} y={H - PAD - barH} width={barW} height={barH} fill={GOLD} fillOpacity={0.85} rx={2} />
              <text x={x + barW / 2} y={H - PAD + 12} textAnchor="middle" fontSize={8} fill="#8891A8">
                {p.label.length > 8 ? p.label.slice(0, 8) : p.label}
              </text>
            </g>
          )
        })}

      {(type === 'line' || type === 'scatter') &&
        points.map((p, i) => {
          const x = PAD + step * i
          const y = H - PAD - (p.value / max) * innerH
          return (
            <g key={p.label}>
              {type === 'line' && i > 0 && (
                <line
                  x1={PAD + step * (i - 1)}
                  y1={H - PAD - (points[i - 1].value / max) * innerH}
                  x2={x}
                  y2={y}
                  stroke={BLUE}
                  strokeWidth={1.5}
                />
              )}
              <circle cx={x} cy={y} r={3} fill={type === 'scatter' ? GOLD : BLUE} />
              <text x={x} y={H - PAD + 12} textAnchor="middle" fontSize={8} fill="#8891A8">
                {p.label.length > 8 ? p.label.slice(0, 8) : p.label}
              </text>
            </g>
          )
        })}
    </svg>
  )
}

function PieChart({ points }: { points: ChartPoint[] }) {
  const total = points.reduce((sum, p) => sum + p.value, 0)
  const size = 200
  const center = size / 2
  const r = 80
  let angle = -Math.PI / 2

  return (
    <div className="flex items-center gap-4">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-40 h-40 shrink-0">
        {total === 0 ? (
          <circle cx={center} cy={center} r={r} fill="none" stroke="#8891A8" strokeOpacity={0.3} />
        ) : (
          points.map((p, i) => {
            const fraction = p.value / total
            const startAngle = angle
            const endAngle = angle + fraction * Math.PI * 2
            angle = endAngle
            const x1 = center + r * Math.cos(startAngle)
            const y1 = center + r * Math.sin(startAngle)
            const x2 = center + r * Math.cos(endAngle)
            const y2 = center + r * Math.sin(endAngle)
            const largeArc = fraction > 0.5 ? 1 : 0
            return (
              <path
                key={p.label}
                d={`M ${center} ${center} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={PIE_COLORS[i % PIE_COLORS.length]}
                fillOpacity={0.85}
              />
            )
          })
        )}
      </svg>
      <div className="space-y-1 text-xs">
        {points.map((p, i) => (
          <div key={p.label} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
            />
            <span className="text-moon">{p.label}</span>
            <span className="text-moon-dim">
              {p.value} {total > 0 && `(${Math.round((p.value / total) * 100)}%)`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

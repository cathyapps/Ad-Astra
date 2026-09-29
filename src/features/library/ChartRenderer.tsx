import type { ChartType, MetricKey } from '@/types/charts'
import { METRIC_LABELS } from '@/types/charts'
import type { ChartPoint } from '@/lib/chartData'
import { MOOD_MAX, MOOD_MIN } from '@/lib/moods'

interface Props {
  type: ChartType
  points: ChartPoint[]
  xAxis?: MetricKey
  yAxis?: MetricKey
}

const GOLD = '#FFD77A'
const BLUE = '#6E9CFF'
const DIM = '#8891A8'
const PIE_COLORS = ['#FFD77A', '#6E9CFF', '#8FE3A6', '#F293C0', '#B79CFF', '#FF9E6E', '#7FD8E0', '#E8ECF7']

const DATE_AXES: MetricKey[] = ['date_day', 'date_week', 'date_month']

const W = 340
const H = 250
const PAD_L = 48
const PAD_R = 14
const PAD_T = 14

/** Round-number ticks covering [lo, hi] (about `target` intervals). */
function niceScale(lo: number, hi: number, target = 4) {
  if (hi <= lo) hi = lo + 1
  const raw = (hi - lo) / target
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const n = raw / mag
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag
  const nLo = Math.floor(lo / step + 1e-9) * step
  const nHi = Math.ceil(hi / step - 1e-9) * step
  const ticks: number[] = []
  for (let v = nLo; v <= nHi + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6)
  return { lo: nLo, hi: nHi, ticks }
}

const fmt = (v: number) => (Number.isInteger(v) ? String(v) : String(Number(v.toFixed(2))))

function moodTickLabel(v: number): string {
  if (v === MOOD_MIN) return 'Darker'
  if (v === MOOD_MAX) return 'Lighter'
  if (v === 0) return 'Neutral'
  return v > 0 ? `+${v}` : String(v)
}

export function ChartRenderer({ type, points, xAxis, yAxis }: Props) {
  if (points.length === 0) {
    return <p className="text-sm text-moon-dim py-8 text-center">No data for this range yet.</p>
  }

  const xTitle = xAxis ? METRIC_LABELS[xAxis] : ''
  const yTitle = yAxis ? METRIC_LABELS[yAxis] : ''

  if (type === 'pie') return <PieChart points={points} xTitle={xTitle} yTitle={yTitle} />

  const isMood = yAxis === 'avg_mood'
  // Long or crowded x labels are rotated so they don't overlap.
  const rotateLabels = (xAxis != null && (DATE_AXES.includes(xAxis) || xAxis === 'mood')) || points.length > 6
  // Room for the tick labels scales with the longest rotated label, so
  // short ones (e.g. months) don't leave a big gap above the axis title.
  const longestLabel = Math.max(...points.map((p) => Math.min(p.label.length, 14)))
  const labelRoom = rotateLabels ? Math.min(56, 12 + longestLabel * 4.4) : 22
  const padBottom = labelRoom + 18 // tick labels + axis title

  const plotL = PAD_L
  const plotR = W - PAD_R
  const plotT = PAD_T
  const plotB = H - padBottom
  const plotW = plotR - plotL
  const plotH = plotB - plotT

  const values = points.map((p) => p.value)
  const scale = isMood
    ? { lo: MOOD_MIN, hi: MOOD_MAX, ticks: [-2, -1, 0, 1, 2] }
    : niceScale(Math.min(0, ...values), Math.max(1, ...values))
  const yPos = (v: number) => plotT + ((scale.hi - v) / (scale.hi - scale.lo)) * plotH
  const zeroY = yPos(0)

  const n = points.length
  const band = plotW / n
  const lineX = (i: number) => (n > 1 ? plotL + (plotW / (n - 1)) * i : plotL + plotW / 2)
  const bandX = (i: number) => plotL + band * i + band / 2

  const trim = (label: string) =>
    rotateLabels ? (label.length > 14 ? label.slice(0, 13) + '…' : label) : label.length > 8 ? label.slice(0, 8) : label

  const renderLabel = (x: number, label: string) =>
    rotateLabels ? (
      <text
        x={x}
        y={plotB + 8}
        transform={`rotate(-90, ${x}, ${plotB + 8})`}
        textAnchor="end"
        fontSize={8}
        fill={DIM}
      >
        {trim(label)}
      </text>
    ) : (
      <text x={x} y={plotB + 12} textAnchor="middle" fontSize={8} fill={DIM}>
        {trim(label)}
      </text>
    )

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`${yTitle} by ${xTitle}`}>
      {/* Gridlines + y tick labels */}
      {scale.ticks.map((t) => (
        <g key={t}>
          <line
            x1={plotL}
            x2={plotR}
            y1={yPos(t)}
            y2={yPos(t)}
            stroke={DIM}
            strokeOpacity={t === 0 && scale.lo < 0 ? 0.5 : 0.15}
          />
          <text x={plotL - 6} y={yPos(t) + 3} textAnchor="end" fontSize={8} fill={DIM}>
            {isMood ? moodTickLabel(t) : fmt(t)}
          </text>
        </g>
      ))}
      <line x1={plotL} y1={plotT} x2={plotL} y2={plotB} stroke={DIM} strokeOpacity={0.3} />
      <line x1={plotL} y1={plotB} x2={plotR} y2={plotB} stroke={DIM} strokeOpacity={0.3} />

      {type === 'bar' &&
        points.map((p, i) => {
          const barW = Math.max(4, band * 0.6)
          const y = yPos(p.value)
          const color = isMood && p.value < 0 ? BLUE : GOLD
          return (
            <g key={p.label + i}>
              <rect
                x={bandX(i) - barW / 2}
                y={Math.min(y, zeroY)}
                width={barW}
                height={Math.abs(y - zeroY)}
                fill={color}
                fillOpacity={0.85}
                rx={2}
              />
              {renderLabel(bandX(i), p.label)}
            </g>
          )
        })}

      {(type === 'line' || type === 'scatter') &&
        points.map((p, i) => {
          const x = lineX(i)
          const y = yPos(p.value)
          return (
            <g key={p.label + i}>
              {type === 'line' && i > 0 && (
                <line x1={lineX(i - 1)} y1={yPos(points[i - 1].value)} x2={x} y2={y} stroke={BLUE} strokeWidth={1.5} />
              )}
              <circle cx={x} cy={y} r={3} fill={type === 'scatter' ? GOLD : BLUE} />
              {renderLabel(x, p.label)}
            </g>
          )
        })}

      {/* Axis titles */}
      {xTitle && (
        <text x={plotL + plotW / 2} y={H - 4} textAnchor="middle" fontSize={9} fill={DIM} letterSpacing={0.3}>
          {xTitle}
        </text>
      )}
      {yTitle && (
        <text
          x={11}
          y={plotT + plotH / 2}
          transform={`rotate(-90, 11, ${plotT + plotH / 2})`}
          textAnchor="middle"
          fontSize={9}
          fill={DIM}
          letterSpacing={0.3}
        >
          {yTitle.length > 30 ? yTitle.slice(0, 29) + '…' : yTitle}
        </text>
      )}
    </svg>
  )
}

function PieChart({ points, xTitle, yTitle }: { points: ChartPoint[]; xTitle: string; yTitle: string }) {
  // Slices can't be negative, so any negative value counts as zero.
  const values = points.map((p) => Math.max(0, p.value))
  const total = values.reduce((sum, v) => sum + v, 0)
  const size = 200
  const center = size / 2
  const r = 80
  let angle = -Math.PI / 2

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-40 h-40 shrink-0">
          {total === 0 ? (
            <circle cx={center} cy={center} r={r} fill="none" stroke={DIM} strokeOpacity={0.3} />
          ) : (
            points.map((p, i) => {
              const fraction = values[i] / total
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
                {fmt(p.value)} {total > 0 && `(${Math.round((values[i] / total) * 100)}%)`}
              </span>
            </div>
          ))}
        </div>
      </div>
      {(xTitle || yTitle) && (
        <p className="text-[11px] text-moon-dim">
          Slices: {xTitle || 'category'} · Size: {yTitle || 'value'}
        </p>
      )}
    </div>
  )
}

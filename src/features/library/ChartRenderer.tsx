import { useState } from 'react'
import type { ChartConfig, MetricKey } from '@/types/charts'
import { METRIC_LABELS } from '@/types/charts'
import type { ChartPoint, ChartResult, DrillRow, ScatterDot } from '@/lib/chartData'
import { cellToRow, dotToRow, formatMetric, pointToRow } from '@/lib/chartData'
import { MOOD_MAX, MOOD_MIN } from '@/lib/moods'
import { axisLabels } from '@/lib/axisLabels'

interface Props {
  config: ChartConfig
  result: ChartResult
  /** Called with the data behind whatever segment / point / cell was tapped. */
  onSelectRow: (row: DrillRow) => void
}

const GOLD = '#FFD77A'
const BLUE = '#6E9CFF'
const DIM = '#8891A8'
const NIGHT = '#0B1020'
const PIE_COLORS = ['#FFD77A', '#6E9CFF', '#8FE3A6', '#F293C0', '#B79CFF', '#FF9E6E', '#7FD8E0', '#E8ECF7']

const DATE_AXES: MetricKey[] = ['date_day', 'date_week', 'date_month', 'date_year']

const W = 340
const H = 250
const PAD_L = 48
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

const clickable = { cursor: 'pointer' } as const

export function ChartRenderer({ config, result, onSelectRow }: Props) {
  const empty = <p className="text-sm text-moon-dim py-8 text-center">No data for this range yet.</p>

  if (result.kind === 'number') {
    return (
      <button
        type="button"
        className="w-full text-center py-3 rounded-lg hover:bg-card-hover transition-colors"
        onClick={() => onSelectRow({ id: 'all', label: 'All data', value: '', records: result.records })}
      >
        <div className="font-display text-4xl text-gold leading-tight">{formatMetric(config.yAxis, result.value)}</div>
        <div className="text-xs text-moon-dim mt-1">{METRIC_LABELS[config.yAxis]}</div>
        {config.yAxis2 && result.value2 != null && (
          <>
            <div className="font-display text-xl text-moon mt-3">{formatMetric(config.yAxis2, result.value2)}</div>
            <div className="text-xs text-moon-dim mt-0.5">{METRIC_LABELS[config.yAxis2]}</div>
          </>
        )}
      </button>
    )
  }

  if (result.kind === 'heatmap') {
    if (result.cells.length === 0) return empty
    return <Heatmap config={config} result={result} onSelectRow={onSelectRow} />
  }

  if (result.kind === 'scatter') {
    if (result.dots.length === 0) return empty
    return (
      <div className="space-y-1.5">
        <Cartesian config={config} scatter={result} onSelectRow={onSelectRow} />
        <p className="text-[11px] text-moon-dim">
          Every data point is shown. Similar values (within 5%) merge into one larger, brighter dot — tap a dot to see
          what it stands for.
        </p>
      </div>
    )
  }

  const { points } = result
  if (points.length === 0) return empty
  if (config.chartType === 'pie') return <PieChart config={config} points={points} onSelectRow={onSelectRow} />
  if (config.chartType === 'hbar') return <HBarChart config={config} points={points} onSelectRow={onSelectRow} />
  return <Cartesian config={config} points={points} onSelectRow={onSelectRow} />
}

// ---------------------------------------------------------------------
// Bar / line / dual-axis / scatter (SVG)
// ---------------------------------------------------------------------

function Cartesian({
  config,
  points,
  scatter,
  onSelectRow,
}: {
  config: ChartConfig
  points?: ChartPoint[]
  scatter?: Extract<ChartResult, { kind: 'scatter' }>
  onSelectRow: (row: DrillRow) => void
}) {
  const { xAxis, yAxis, yAxis2 } = config
  const type = config.chartType
  const dual = type === 'dual' && !!yAxis2
  const xTitle = METRIC_LABELS[xAxis]
  const yTitle = METRIC_LABELS[yAxis]
  const isMood = yAxis === 'avg_mood'

  const cats = points ? points.map((p) => ({ label: p.label, date: p.date })) : (scatter?.categories ?? [])
  const isDateAxis = DATE_AXES.includes(xAxis)
  const rotateLabels = isDateAxis || xAxis === 'mood' || cats.length > 6
  // At most 15 x labels: crowded axes label every Nth point or switch to
  // coarser units (see lib/axisLabels.ts). The points themselves are unchanged.
  const xLabels = axisLabels(cats, isDateAxis)
  const longestLabel = Math.max(1, ...xLabels.map((l) => Math.min((l ?? '').length, 14)))
  const labelRoom = rotateLabels ? Math.min(56, 12 + longestLabel * 4.4) : 22
  const padBottom = labelRoom + 18
  const padR = dual ? 44 : 14

  const plotL = PAD_L
  const plotR = W - padR
  const plotT = PAD_T
  const plotB = H - padBottom
  const plotW = plotR - plotL
  const plotH = plotB - plotT

  const finite = (v: number | undefined): v is number => v != null && Number.isFinite(v)
  const values = points ? points.map((p) => p.value).filter(finite) : (scatter?.dots.map((d) => d.value) ?? [])
  const scale = isMood
    ? { lo: MOOD_MIN, hi: MOOD_MAX, ticks: [-2, -1, 0, 1, 2] }
    : niceScale(Math.min(0, ...values), Math.max(1, ...values))
  const yPos = (v: number) => plotT + ((scale.hi - v) / (scale.hi - scale.lo)) * plotH
  const zeroY = yPos(0)

  const values2 = dual && points ? points.map((p) => p.value2).filter(finite) : []
  const scale2 = niceScale(Math.min(0, ...values2), Math.max(1, ...values2))
  const yPos2 = (v: number) => plotT + ((scale2.hi - v) / (scale2.hi - scale2.lo)) * plotH

  const n = cats.length
  const band = plotW / Math.max(1, n)
  const lineX = (i: number) => (n > 1 ? plotL + (plotW / (n - 1)) * i : plotL + plotW / 2)
  const bandX = (i: number) => plotL + band * i + band / 2
  // Scatter columns sit in bands so dots never hug the axis.
  const xAt = (i: number) => (type === 'bar' || type === 'scatter' ? bandX(i) : lineX(i))

  const trim = (label: string) =>
    rotateLabels ? (label.length > 14 ? label.slice(0, 13) + '…' : label) : label.length > 8 ? label.slice(0, 8) : label

  const renderLabel = (x: number, label: string | null) =>
    label == null ? null : rotateLabels ? (
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

  const pick = (p: ChartPoint) => onSelectRow(pointToRow(config, p))

  return (
    <div className="space-y-1">
      {dual && yAxis2 && (
        <div className="flex gap-3 text-[11px] text-moon-dim">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 inline-block" style={{ background: GOLD }} /> {METRIC_LABELS[yAxis]}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 inline-block" style={{ background: BLUE }} /> {METRIC_LABELS[yAxis2]}
          </span>
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`${yTitle} by ${xTitle}`}>
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
            <text x={plotL - 6} y={yPos(t) + 3} textAnchor="end" fontSize={8} fill={dual ? GOLD : DIM}>
              {isMood ? moodTickLabel(t) : fmt(t)}
            </text>
          </g>
        ))}
        {dual &&
          scale2.ticks.map((t) => (
            <text key={t} x={plotR + 6} y={yPos2(t) + 3} fontSize={8} fill={BLUE}>
              {fmt(t)}
            </text>
          ))}
        <line x1={plotL} y1={plotT} x2={plotL} y2={plotB} stroke={DIM} strokeOpacity={0.3} />
        <line x1={plotL} y1={plotB} x2={plotR} y2={plotB} stroke={DIM} strokeOpacity={0.3} />

        {points &&
          type === 'bar' &&
          points.map((p, i) => {
            const barW = Math.max(4, band * 0.6)
            const y = yPos(p.value)
            const color = isMood && p.value < 0 ? BLUE : GOLD
            return (
              <g key={p.key} onClick={() => pick(p)} style={clickable}>
                <rect x={bandX(i) - band / 2} y={plotT} width={band} height={plotH} fill="transparent" />
                <rect
                  x={bandX(i) - barW / 2}
                  y={Math.min(y, zeroY)}
                  width={barW}
                  height={Math.abs(y - zeroY)}
                  fill={color}
                  fillOpacity={0.85}
                  rx={2}
                />
                {renderLabel(bandX(i), xLabels[i])}
              </g>
            )
          })}

        {points &&
          (type === 'line' || type === 'dual') &&
          (() => {
            const series: { get: (p: ChartPoint) => number | undefined; pos: (v: number) => number; color: string }[] = [
              { get: (p) => p.value, pos: yPos, color: dual ? GOLD : BLUE },
            ]
            if (dual) series.push({ get: (p) => p.value2, pos: yPos2, color: BLUE })
            return (
              <>
                {series.map((s, si) => {
                  let prev: number | undefined
                  return (
                    <g key={si}>
                      {points.map((p, i) => {
                        const v = s.get(p)
                        if (!finite(v)) return null
                        const seg =
                          prev != null ? (
                            <line
                              x1={lineX(prev)}
                              y1={s.pos(s.get(points[prev]) as number)}
                              x2={lineX(i)}
                              y2={s.pos(v)}
                              stroke={s.color}
                              strokeWidth={1.5}
                            />
                          ) : null
                        prev = i
                        return (
                          <g key={p.key}>
                            {seg}
                            <circle cx={lineX(i)} cy={s.pos(v)} r={3} fill={s.color} />
                          </g>
                        )
                      })}
                    </g>
                  )
                })}
                {points.map((p, i) => (
                  <g key={`hit-${p.key}`} onClick={() => pick(p)} style={clickable}>
                    <rect
                      x={lineX(i) - Math.max(8, plotW / Math.max(1, n - 1) / 2)}
                      y={plotT}
                      width={Math.max(16, plotW / Math.max(1, n - 1))}
                      height={plotH}
                      fill="transparent"
                    />
                    {renderLabel(lineX(i), xLabels[i])}
                  </g>
                ))}
              </>
            )
          })()}

        {scatter && (
          <>
            {cats.map((_, i) => (
              <g key={`cat-${i}`}>{renderLabel(bandX(i), xLabels[i])}</g>
            ))}
            {scatter.dots.map((dot: ScatterDot, i) => {
              // Bigger AND brighter the more points a marker stands for.
              const r = 3 + Math.min(8, (Math.sqrt(dot.count) - 1) * 2.4)
              const opacity = Math.min(1, 0.5 + (dot.count - 1) * 0.12)
              const cx = bandX(dot.categoryIndex)
              const cy = yPos(dot.value)
              return (
                <g key={i} onClick={() => onSelectRow(dotToRow(config, scatter, dot, i))} style={clickable}>
                  <circle cx={cx} cy={cy} r={Math.max(r + 4, 9)} fill="transparent" />
                  <circle cx={cx} cy={cy} r={r} fill={GOLD} fillOpacity={opacity} stroke={GOLD} strokeOpacity={0.9} strokeWidth={dot.count > 1 ? 1 : 0} />
                  {dot.count > 1 && r >= 6 && (
                    <text x={cx} y={cy + 2.5} textAnchor="middle" fontSize={7} fontWeight={600} fill={NIGHT}>
                      {dot.count}
                    </text>
                  )}
                </g>
              )
            })}
          </>
        )}

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
        {dual && yAxis2 && (
          <text
            x={W - 8}
            y={plotT + plotH / 2}
            transform={`rotate(90, ${W - 8}, ${plotT + plotH / 2})`}
            textAnchor="middle"
            fontSize={9}
            fill={BLUE}
            letterSpacing={0.3}
          >
            {METRIC_LABELS[yAxis2].length > 30 ? METRIC_LABELS[yAxis2].slice(0, 29) + '…' : METRIC_LABELS[yAxis2]}
          </text>
        )}
      </svg>
    </div>
  )
}

// ---------------------------------------------------------------------
// Horizontal bars (genres, authors, …)
// ---------------------------------------------------------------------

const SHOW_PERCENT: MetricKey[] = ['book_count', 'books_completed']
const HBAR_COLLAPSED = 12

function HBarChart({
  config,
  points,
  onSelectRow,
}: {
  config: ChartConfig
  points: ChartPoint[]
  onSelectRow: (row: DrillRow) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? points : points.slice(0, HBAR_COLLAPSED)
  const maxAbs = Math.max(1e-9, ...points.map((p) => Math.abs(p.value)))
  const total = points.reduce((sum, p) => sum + Math.max(0, p.value), 0)
  const percent = SHOW_PERCENT.includes(config.yAxis) && total > 0

  return (
    <div className="space-y-1.5">
      {shown.map((p) => (
        <button
          key={p.key}
          type="button"
          className="w-full text-left rounded hover:bg-card-hover transition-colors px-1 py-0.5"
          onClick={() => onSelectRow(pointToRow(config, p))}
        >
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="text-moon truncate">{p.label}</span>
            <span className="text-moon-dim shrink-0">
              {fmt(p.value)}
              {percent && ` (${Math.round((Math.max(0, p.value) / total) * 100)}%)`}
            </span>
          </div>
          <div className="h-2 mt-0.5 rounded-full bg-hairline-soft overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(2, (Math.abs(p.value) / maxAbs) * 100)}%`,
                background: p.value < 0 ? BLUE : GOLD,
                opacity: 0.85,
              }}
            />
          </div>
        </button>
      ))}
      {points.length > HBAR_COLLAPSED && (
        <button
          type="button"
          className="text-xs text-cosmic hover:text-moon transition-colors"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? 'Show fewer' : `Show all ${points.length}`}
        </button>
      )}
      <p className="text-[11px] text-moon-dim">
        {METRIC_LABELS[config.xAxis]} · {METRIC_LABELS[config.yAxis]}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------
// Pie
// ---------------------------------------------------------------------

function PieChart({
  config,
  points,
  onSelectRow,
}: {
  config: ChartConfig
  points: ChartPoint[]
  onSelectRow: (row: DrillRow) => void
}) {
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
              if (fraction <= 0) return null
              const color = PIE_COLORS[i % PIE_COLORS.length]
              const onClick = () => onSelectRow(pointToRow(config, p))
              // A single slice is a full circle (an arc can't start and end at the same point).
              if (fraction >= 0.9999) {
                return <circle key={p.key} cx={center} cy={center} r={r} fill={color} fillOpacity={0.85} onClick={onClick} style={clickable} />
              }
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
                  key={p.key}
                  d={`M ${center} ${center} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={color}
                  fillOpacity={0.85}
                  onClick={onClick}
                  style={clickable}
                />
              )
            })
          )}
        </svg>
        <div className="space-y-1 text-xs min-w-0">
          {points.map((p, i) => (
            <button
              key={p.key}
              type="button"
              className="flex items-center gap-1.5 text-left hover:text-gold transition-colors"
              onClick={() => onSelectRow(pointToRow(config, p))}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
              />
              <span className="text-moon">{p.label}</span>
              <span className="text-moon-dim">
                {fmt(p.value)} {total > 0 && `(${Math.round((values[i] / total) * 100)}%)`}
              </span>
            </button>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-moon-dim">
        Slices: {METRIC_LABELS[config.xAxis]} · Size: {METRIC_LABELS[config.yAxis]}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------
// Heatmap (e.g. average rating by genre × mood)
// ---------------------------------------------------------------------

function Heatmap({
  config,
  result,
  onSelectRow,
}: {
  config: ChartConfig
  result: Extract<ChartResult, { kind: 'heatmap' }>
  onSelectRow: (row: DrillRow) => void
}) {
  const values = result.cells.map((c) => c.value)
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const cellAt = new Map(result.cells.map((c) => [`${c.col}-${c.row}`, c]))
  const rowAxis = config.groupAxis ?? 'mood'

  return (
    <div className="space-y-1.5">
      <div className="overflow-x-auto">
        <div
          className="grid gap-0.5 min-w-full"
          style={{ gridTemplateColumns: `64px repeat(${result.cols.length}, minmax(34px, 1fr))` }}
        >
          <div />
          {result.cols.map((c) => (
            <div key={c} className="text-[9px] text-moon-dim text-center h-14 flex items-end justify-center pb-0.5">
              <span className="[writing-mode:vertical-rl] rotate-180 truncate max-h-14" title={c}>
                {c}
              </span>
            </div>
          ))}
          {result.rows.map((rowLabel, row) => (
            <div key={rowLabel} className="contents">
              <div className="text-[10px] text-moon-dim truncate self-center pr-1" title={rowLabel}>
                {rowLabel}
              </div>
              {result.cols.map((_, col) => {
                const cell = cellAt.get(`${col}-${row}`)
                if (!cell) return <div key={col} className="h-8 rounded bg-hairline-soft/40" />
                const t = hi === lo ? 0.7 : (cell.value - lo) / (hi - lo)
                return (
                  <button
                    key={col}
                    type="button"
                    className="h-8 rounded text-[10px] font-medium text-night hover:ring-1 hover:ring-moon transition"
                    style={{ background: `rgba(255, 215, 122, ${0.25 + 0.75 * t})` }}
                    onClick={() => onSelectRow(cellToRow(config, result, cell))}
                  >
                    {fmt(cell.value)}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-moon-dim">
        Columns: {METRIC_LABELS[config.xAxis]} · Rows: {METRIC_LABELS[rowAxis]} · Value: {METRIC_LABELS[config.yAxis]}
      </p>
    </div>
  )
}

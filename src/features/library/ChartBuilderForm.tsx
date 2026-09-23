import { useState } from 'react'
import type { ChartConfig, ChartType, MetricKey } from '@/types/charts'
import { CHART_TYPE_LABELS, CHART_TYPES, METRIC_LABELS, X_AXIS_METRICS, Y_AXIS_METRICS } from '@/types/charts'

const selectClass = 'mt-1 w-full border border-hairline bg-night rounded-lg px-3 py-2 text-sm text-moon'

interface Props {
  initial?: Partial<ChartConfig>
  onSave: (input: {
    title: string
    chartType: ChartType
    xAxis: MetricKey
    yAxis: MetricKey
  }) => void
  onCancel: () => void
}

export function ChartBuilderForm({ initial, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [chartType, setChartType] = useState<ChartType>(initial?.chartType ?? 'bar')
  const [xAxis, setXAxis] = useState<MetricKey>(initial?.xAxis ?? 'date_day')
  const [yAxis, setYAxis] = useState<MetricKey>(initial?.yAxis ?? 'pages_read')

  return (
    <form
      className="space-y-3 border border-hairline rounded-xl p-4 bg-card"
      onSubmit={(e) => {
        e.preventDefault()
        if (!title.trim()) return
        onSave({ title: title.trim(), chartType, xAxis, yAxis })
      }}
    >
      <label className="text-sm block text-moon-dim">
        Chart title
        <input
          autoFocus
          className={selectClass}
          placeholder="e.g. Pages read per day"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <label className="text-sm block text-moon-dim">
        Chart type
        <select className={selectClass} value={chartType} onChange={(e) => setChartType(e.target.value as ChartType)}>
          {CHART_TYPES.map((t) => (
            <option key={t} value={t}>
              {CHART_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm block text-moon-dim">
        X axis
        <select className={selectClass} value={xAxis} onChange={(e) => setXAxis(e.target.value as MetricKey)}>
          {X_AXIS_METRICS.map((m) => (
            <option key={m} value={m}>
              {METRIC_LABELS[m]}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm block text-moon-dim">
        Y axis
        <select className={selectClass} value={yAxis} onChange={(e) => setYAxis(e.target.value as MetricKey)}>
          {Y_AXIS_METRICS.map((m) => (
            <option key={m} value={m}>
              {METRIC_LABELS[m]}
            </option>
          ))}
        </select>
      </label>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          className="border border-hairline rounded-lg px-3 py-2 text-sm flex-1 text-moon hover:bg-card-hover transition-colors"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button type="submit" className="rounded-lg px-3 py-2 text-sm flex-1 bg-gold text-night font-medium">
          Save
        </button>
      </div>
    </form>
  )
}

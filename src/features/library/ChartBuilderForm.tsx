import { useState } from 'react'
import type { ChartConfig, ChartInput, ChartType, MetricKey } from '@/types/charts'
import {
  CATEGORY_X_AXES,
  CHART_TYPE_LABELS,
  CHART_TYPES,
  METRIC_LABELS,
  X_AXIS_METRICS,
  Y_AXIS_METRICS,
} from '@/types/charts'

const selectClass = 'mt-1 w-full border border-hairline bg-night rounded-lg px-3 py-2 text-sm text-moon'

interface Props {
  initial?: Partial<ChartConfig>
  onSave: (input: ChartInput) => void
  onCancel: () => void
}

function MetricSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: MetricKey
  options: MetricKey[]
  onChange: (m: MetricKey) => void
}) {
  return (
    <label className="text-sm block text-moon-dim">
      {label}
      <select className={selectClass} value={value} onChange={(e) => onChange(e.target.value as MetricKey)}>
        {options.map((m) => (
          <option key={m} value={m}>
            {METRIC_LABELS[m]}
          </option>
        ))}
      </select>
    </label>
  )
}

export function ChartBuilderForm({ initial, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [chartType, setChartType] = useState<ChartType>(initial?.chartType ?? 'bar')
  const [xAxis, setXAxis] = useState<MetricKey>(initial?.xAxis ?? 'date_day')
  const [yAxis, setYAxis] = useState<MetricKey>(initial?.yAxis ?? 'pages_read')
  const [yAxis2, setYAxis2] = useState<MetricKey | ''>(initial?.yAxis2 ?? '')
  const [groupAxis, setGroupAxis] = useState<MetricKey>(initial?.groupAxis ?? 'mood')

  const isNumber = chartType === 'number'
  const isHeatmap = chartType === 'heatmap'
  const isDual = chartType === 'dual'

  // A heatmap needs two category axes; everything else takes any X axis.
  const xOptions = isHeatmap ? CATEGORY_X_AXES : X_AXIS_METRICS
  const xValue = isHeatmap && !CATEGORY_X_AXES.includes(xAxis) ? CATEGORY_X_AXES[0] : xAxis
  // "Books per year at this pace" only means something as a single figure.
  const yOptions = Y_AXIS_METRICS.filter((m) => isNumber || m !== 'books_pace')
  const yValue = yOptions.includes(yAxis) ? yAxis : yOptions[0]
  const y2Value: MetricKey = yAxis2 && yOptions.includes(yAxis2) ? yAxis2 : yOptions.find((m) => m !== yValue) ?? yValue

  return (
    <form
      className="space-y-3 border border-hairline rounded-xl p-4 bg-card"
      onSubmit={(e) => {
        e.preventDefault()
        if (!title.trim()) return
        onSave({
          title: title.trim(),
          chartType,
          xAxis: xValue,
          yAxis: yValue,
          // Always present (undefined when unused) so editing a chart into
          // another type clears whatever the old type stored.
          yAxis2: isDual ? y2Value : isNumber && yAxis2 ? y2Value : undefined,
          groupAxis: isHeatmap ? (groupAxis === xValue ? CATEGORY_X_AXES.find((m) => m !== xValue) : groupAxis) : undefined,
        })
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

      {!isNumber && (
        <MetricSelect
          label={isHeatmap ? 'Columns' : 'X axis'}
          value={xValue}
          options={xOptions}
          onChange={setXAxis}
        />
      )}

      {isHeatmap && (
        <MetricSelect
          label="Rows"
          value={groupAxis === xValue ? (CATEGORY_X_AXES.find((m) => m !== xValue) as MetricKey) : groupAxis}
          options={CATEGORY_X_AXES.filter((m) => m !== xValue)}
          onChange={setGroupAxis}
        />
      )}

      <MetricSelect
        label={isHeatmap ? 'Cell value' : isNumber ? 'Number to show' : isDual ? 'Y axis (left)' : 'Y axis'}
        value={yValue}
        options={yOptions}
        onChange={setYAxis}
      />

      {isDual && <MetricSelect label="Y axis (right)" value={y2Value} options={yOptions} onChange={setYAxis2} />}

      {isNumber && (
        <label className="text-sm block text-moon-dim">
          Also show (optional)
          <select
            className={selectClass}
            value={yAxis2 ? y2Value : ''}
            onChange={(e) => setYAxis2(e.target.value as MetricKey | '')}
          >
            <option value="">— Nothing —</option>
            {yOptions
              .filter((m) => m !== yValue)
              .map((m) => (
                <option key={m} value={m}>
                  {METRIC_LABELS[m]}
                </option>
              ))}
          </select>
        </label>
      )}

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

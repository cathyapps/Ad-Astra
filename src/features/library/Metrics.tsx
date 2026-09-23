import { useState } from 'react'
import type { Book, ReadingLog } from '@/types/library'
import type { ChartConfig, ChartType, MetricKey, MetricsTimeframe } from '@/types/charts'
import { TIMEFRAME_LABELS } from '@/types/charts'
import { computeChartData } from '@/lib/chartData'
import { ChartRenderer } from './ChartRenderer'
import { ChartBuilderForm } from './ChartBuilderForm'

interface Props {
  books: Book[]
  readingLogs: ReadingLog[]
  chartConfigs: ChartConfig[]
  timeframe: MetricsTimeframe
  onChangeTimeframe: (t: MetricsTimeframe) => void
  onCreateChart: (input: { title: string; chartType: ChartType; xAxis: MetricKey; yAxis: MetricKey }) => void
  onUpdateChart: (id: string, patch: Partial<ChartConfig>) => void
  onDeleteChart: (id: string) => void
}

const TIMEFRAMES: MetricsTimeframe[] = ['7d', '30d', '90d', 'ytd', '1y', 'all']

export function Metrics({
  books,
  readingLogs,
  chartConfigs,
  timeframe,
  onChangeTimeframe,
  onCreateChart,
  onUpdateChart,
  onDeleteChart,
}: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const editingConfig = chartConfigs.find((c) => c.id === editingId)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-medium text-moon">Reading Metrics</h3>
        <select
          className="border border-hairline bg-night rounded-lg px-2 py-1.5 text-sm text-moon"
          value={timeframe}
          onChange={(e) => onChangeTimeframe(e.target.value as MetricsTimeframe)}
        >
          {TIMEFRAMES.map((t) => (
            <option key={t} value={t}>
              {TIMEFRAME_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {chartConfigs.length === 0 && !showForm && (
        <p className="text-sm text-moon-dim">
          No charts yet — add one to start visualizing your reading data.
        </p>
      )}

      <div className="space-y-4">
        {chartConfigs.map((config) =>
          editingId === config.id ? (
            <ChartBuilderForm
              key={config.id}
              initial={config}
              onCancel={() => setEditingId(null)}
              onSave={(input) => {
                onUpdateChart(config.id, input)
                setEditingId(null)
              }}
            />
          ) : (
            <div key={config.id} className="border border-hairline rounded-xl p-4 bg-card space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-moon">{config.title}</h4>
                <div className="flex gap-3">
                  <button
                    className="text-xs text-cosmic hover:text-moon transition-colors"
                    onClick={() => setEditingId(config.id)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-xs text-moon-dim hover:text-red-400 transition-colors"
                    onClick={() => onDeleteChart(config.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <ChartRenderer
                type={config.chartType}
                points={computeChartData(config, books, readingLogs, timeframe)}
              />
            </div>
          ),
        )}
      </div>

      {showForm ? (
        <ChartBuilderForm
          onCancel={() => setShowForm(false)}
          onSave={(input) => {
            onCreateChart(input)
            setShowForm(false)
          }}
        />
      ) : (
        <button
          className="w-full border border-hairline rounded-lg px-3 py-2.5 text-sm text-moon hover:bg-card-hover transition-colors"
          onClick={() => setShowForm(true)}
        >
          + Add Chart
        </button>
      )}
    </div>
  )
}

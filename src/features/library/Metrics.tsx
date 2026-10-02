import { useMemo, useState } from 'react'
import type { Book, ReadingLog } from '@/types/library'
import type { ChartConfig, ChartInput, MetricsTimeframe } from '@/types/charts'
import { TIMEFRAME_LABELS } from '@/types/charts'
import { computeChart, drillRows } from '@/lib/chartData'
import type { DrillRow } from '@/lib/chartData'
import { ChartRenderer } from './ChartRenderer'
import { ChartBuilderForm } from './ChartBuilderForm'
import { ChartDataSheet } from './ChartDataSheet'
import { ReadingGoalCard } from './ReadingGoalCard'
import type { ReadingGoals } from './ReadingGoalCard'

interface Props {
  books: Book[]
  readingLogs: ReadingLog[]
  chartConfigs: ChartConfig[]
  timeframe: MetricsTimeframe
  readingGoals: ReadingGoals
  onChangeGoals: (goals: ReadingGoals) => void
  onChangeTimeframe: (t: MetricsTimeframe) => void
  onCreateChart: (input: ChartInput) => void
  onUpdateChart: (id: string, patch: Partial<ChartConfig>) => void
  onDeleteChart: (id: string) => void
  onUpdateBook: (id: string, patch: Partial<Book>) => void
  onDeleteBook: (id: string) => void
  onCreateReadingLog: (input: Partial<ReadingLog> & { bookId: string }) => void
}

const TIMEFRAMES: MetricsTimeframe[] = ['7d', '30d', '90d', 'ytd', '1y', 'all']

export function Metrics({
  books,
  readingLogs,
  chartConfigs,
  timeframe,
  readingGoals,
  onChangeGoals,
  onChangeTimeframe,
  onCreateChart,
  onUpdateChart,
  onDeleteChart,
  onUpdateBook,
  onDeleteBook,
  onCreateReadingLog,
}: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Which chart's data pop-up is open, and (when a slice / bar / dot was
  // tapped) which row of it to open straight onto.
  const [sheet, setSheet] = useState<{ configId: string; rowId?: string } | null>(null)

  const results = useMemo(
    () => new Map(chartConfigs.map((c) => [c.id, computeChart(c, books, readingLogs, timeframe)])),
    [chartConfigs, books, readingLogs, timeframe],
  )
  const sheetConfig = sheet ? chartConfigs.find((c) => c.id === sheet.configId) : undefined
  const sheetResult = sheetConfig ? results.get(sheetConfig.id) : undefined

  return (
    <div className="space-y-4">
      {sheetConfig && sheetResult && (
        <ChartDataSheet
          title={sheetConfig.title}
          rows={drillRows(sheetConfig, sheetResult)}
          initialRowId={sheet?.rowId}
          books={books}
          readingLogs={readingLogs}
          onClose={() => setSheet(null)}
          onUpdateBook={onUpdateBook}
          onDeleteBook={onDeleteBook}
          onCreateReadingLog={onCreateReadingLog}
        />
      )}

      <ReadingGoalCard books={books} goals={readingGoals} onChangeGoals={onChangeGoals} />

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
                <button
                  type="button"
                  className="text-sm font-medium text-moon text-left hover:text-gold transition-colors"
                  title="View the data behind this chart"
                  onClick={() => setSheet({ configId: config.id })}
                >
                  {config.title} <span className="text-moon-dim text-xs">›</span>
                </button>
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
                config={config}
                result={results.get(config.id) ?? { kind: 'points', points: [] }}
                onSelectRow={(row: DrillRow) => setSheet({ configId: config.id, rowId: row.id })}
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

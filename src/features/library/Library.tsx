import { useState } from 'react'
import type { Book, ReadingLog } from '@/types/library'
import type { ChartConfig, ChartType, MetricKey, MetricsTimeframe } from '@/types/charts'
import { CurrentlyReading } from './CurrentlyReading'
import { MyLibrary } from './MyLibrary'
import { Metrics } from './Metrics'

type SubTab = 'reading' | 'shelf' | 'metrics'

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'reading', label: 'Currently Reading' },
  { id: 'shelf', label: 'My Library' },
  { id: 'metrics', label: 'Metrics' },
]

interface Props {
  books: Book[]
  readingLogs: ReadingLog[]
  chartConfigs: ChartConfig[]
  metricsTimeframe: MetricsTimeframe
  onCreateBook: (input: Partial<Book> & { title: string }) => void
  onUpdateBook: (id: string, patch: Partial<Book>) => void
  onDeleteBook: (id: string) => void
  onCreateReadingLog: (input: Partial<ReadingLog> & { bookId: string }) => void
  onChangeTimeframe: (t: MetricsTimeframe) => void
  onCreateChart: (input: { title: string; chartType: ChartType; xAxis: MetricKey; yAxis: MetricKey }) => void
  onUpdateChart: (id: string, patch: Partial<ChartConfig>) => void
  onDeleteChart: (id: string) => void
}

export function Library({
  books,
  readingLogs,
  chartConfigs,
  metricsTimeframe,
  onCreateBook,
  onUpdateBook,
  onDeleteBook,
  onCreateReadingLog,
  onChangeTimeframe,
  onCreateChart,
  onUpdateChart,
  onDeleteChart,
}: Props) {
  const [subTab, setSubTab] = useState<SubTab>('reading')

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg text-moon">Library</h2>

      <div className="flex gap-1 text-sm overflow-x-auto">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              subTab === t.id ? 'bg-cosmic text-night font-medium' : 'text-moon-dim hover:text-moon'
            }`}
            onClick={() => setSubTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'reading' && (
        <CurrentlyReading
          books={books}
          readingLogs={readingLogs}
          onUpdateBook={onUpdateBook}
          onDeleteBook={onDeleteBook}
          onCreateReadingLog={onCreateReadingLog}
        />
      )}

      {subTab === 'shelf' && (
        <MyLibrary
          books={books}
          readingLogs={readingLogs}
          onCreateBook={onCreateBook}
          onUpdateBook={onUpdateBook}
          onDeleteBook={onDeleteBook}
          onCreateReadingLog={onCreateReadingLog}
        />
      )}

      {subTab === 'metrics' && (
        <Metrics
          books={books}
          readingLogs={readingLogs}
          chartConfigs={chartConfigs}
          timeframe={metricsTimeframe}
          onChangeTimeframe={onChangeTimeframe}
          onCreateChart={onCreateChart}
          onUpdateChart={onUpdateChart}
          onDeleteChart={onDeleteChart}
        />
      )}
    </div>
  )
}

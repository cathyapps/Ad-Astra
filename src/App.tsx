import { useState } from 'react'
import { useAdAstra } from '@/hooks/useAdAstra'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { Universe } from '@/features/universe/Universe'
import { BucketList } from '@/features/bucketlist/BucketList'
import { Library } from '@/features/library/Library'
import { CapacityWarningModal } from '@/features/stars/CapacityWarningModal'
import { useAuthState } from '@/features/auth/AuthContext'

type Tab = 'dashboard' | 'universe' | 'bucketlist' | 'library'

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'universe', label: 'Universe' },
  { id: 'bucketlist', label: 'Bucket List' },
  { id: 'library', label: 'Library' },
]

export default function App() {
  const adAstra = useAdAstra()
  const auth = useAuthState()
  const [tab, setTab] = useState<Tab>('dashboard')

  if (adAstra.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-moon-dim">
        Loading your universe…
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col">
      <header className="px-4 pt-5 pb-3 border-b border-hairline">
        <div className="flex items-center gap-2 mb-3">
          <img src="/icon-192.png" alt="" className="w-7 h-7 rounded-md" />
          <h1 className="font-display text-lg text-moon">Ad Astra</h1>
        </div>
        <nav className="flex gap-1 text-sm overflow-x-auto -mx-4 px-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                tab === t.id ? 'bg-gold text-night font-medium' : 'text-moon-dim hover:text-moon'
              }`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {auth.mode === 'local' && (
        <div className="px-4 py-1.5 text-xs text-moon-dim bg-cosmic/10 border-b border-hairline">
          Local-only mode — set up Supabase to sync across devices.
        </div>
      )}
      {auth.mode === 'supabase' && auth.email && (
        <div className="px-4 py-1.5 text-xs text-moon-dim border-b border-hairline flex items-center justify-between">
          <span>{auth.email}</span>
          <button className="hover:text-moon" onClick={auth.signOut}>
            Sign out
          </button>
        </div>
      )}

      <main className="flex-1 px-4 py-5">
        {tab === 'dashboard' && (
          <Dashboard
            stars={adAstra.stars}
            tasks={adAstra.tasks}
            constellations={adAstra.constellations}
            books={adAstra.books}
            bucketListItems={adAstra.bucketListItems}
            onUpdateTask={adAstra.updateTask}
            onUpdateBook={adAstra.updateBook}
            onCreateReadingLog={adAstra.createReadingLog}
            onUpdateBucketListItem={adAstra.updateBucketListItem}
            onOpenLibrary={() => setTab('library')}
            onOpenBucketList={() => setTab('bucketlist')}
          />
        )}
        {tab === 'universe' && (
          <Universe
            stars={adAstra.stars}
            tasks={adAstra.tasks}
            constellations={adAstra.constellations}
            books={adAstra.books}
            bucketListItems={adAstra.bucketListItems}
            onCreateStar={adAstra.createStar}
            onUpdateStar={adAstra.updateStar}
            onDeleteStar={adAstra.deleteStar}
            onMoveStar={adAstra.moveStar}
            onCreateTask={adAstra.createTask}
            onUpdateTask={adAstra.updateTask}
            onDeleteTask={adAstra.deleteTask}
            onCreateConstellation={adAstra.createConstellation}
            onUpdateConstellation={adAstra.updateConstellation}
            onDeleteConstellation={adAstra.deleteConstellation}
            onUpdateBook={adAstra.updateBook}
            onUpdateBucketListItem={adAstra.updateBucketListItem}
          />
        )}
        {tab === 'bucketlist' && (
          <BucketList
            items={adAstra.bucketListItems}
            onCreate={adAstra.createBucketListItem}
            onUpdate={adAstra.updateBucketListItem}
            onDelete={adAstra.deleteBucketListItem}
            onCreateStar={adAstra.createStar}
          />
        )}
        {tab === 'library' && (
          <Library
            books={adAstra.books}
            readingLogs={adAstra.readingLogs}
            chartConfigs={adAstra.chartConfigs}
            metricsTimeframe={adAstra.settings.readingMetricsTimeframe}
            onCreateBook={adAstra.createBook}
            onUpdateBook={adAstra.updateBook}
            onDeleteBook={adAstra.deleteBook}
            onCreateReadingLog={adAstra.createReadingLog}
            onChangeTimeframe={(t) => adAstra.updateSettings({ readingMetricsTimeframe: t })}
            onCreateChart={adAstra.createChartConfig}
            onUpdateChart={adAstra.updateChartConfig}
            onDeleteChart={adAstra.deleteChartConfig}
          />
        )}
      </main>

      {adAstra.capacityPrompt && (
        <CapacityWarningModal
          message={adAstra.capacityPrompt.message}
          orbit={adAstra.capacityPrompt.orbit}
          onAbort={() => adAstra.resolveCapacityPrompt('abort')}
          onOverride={() => adAstra.resolveCapacityPrompt('override')}
          onReplace={(outgoingId) => adAstra.resolveCapacityPrompt('replace', outgoingId)}
        />
      )}
    </div>
  )
}

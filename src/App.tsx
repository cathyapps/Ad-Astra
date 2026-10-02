import { useState } from 'react'
import { useAdAstra } from '@/hooks/useAdAstra'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { Universe } from '@/features/universe/Universe'
import { BucketList } from '@/features/bucketlist/BucketList'
import { Library } from '@/features/library/Library'
import { CapacityWarningModal } from '@/features/stars/CapacityWarningModal'
import { useAuthState } from '@/features/auth/AuthContext'
import { ReadingTimerProvider } from '@/features/library/ReadingTimerProvider'
import { StoppedSessionSheet } from '@/features/library/StoppedSessionSheet'
import { HardcoverReview } from '@/features/library/HardcoverReview'

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
  const [profileOpen, setProfileOpen] = useState(false)
  const [hardcoverOpen, setHardcoverOpen] = useState(false)

  if (adAstra.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-moon-dim">
        Loading your universe…
      </div>
    )
  }

  return (
    <ReadingTimerProvider>
    <div className="max-w-md mx-auto min-h-screen flex flex-col">
      <header className="px-4 pt-5 pb-3 border-b border-hairline">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img src="/icon-192.png" alt="" className="w-7 h-7 rounded-md" />
            <h1 className="font-display text-lg text-moon">Ad Astra</h1>
          </div>
          {auth.mode === 'supabase' && auth.email && (
            <div className="relative">
              <button
                type="button"
                aria-label="Profile"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                className="w-8 h-8 rounded-full border border-hairline flex items-center justify-center text-moon-dim hover:text-moon hover:bg-card-hover transition-colors"
                onClick={() => setProfileOpen((v) => !v)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
                </svg>
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setProfileOpen(false)} />
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 z-30 w-56 max-w-[80vw] border border-hairline rounded-xl bg-card shadow-lg p-3 space-y-2"
                  >
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-moon-dim">Signed in as</p>
                      <p className="text-sm text-moon break-all">{auth.email}</p>
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full text-left text-sm border border-hairline rounded-lg px-3 py-2 text-moon hover:bg-card-hover transition-colors"
                      onClick={() => {
                        setProfileOpen(false)
                        setHardcoverOpen(true)
                      }}
                    >
                      Compare with Hardcover
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full text-left text-sm border border-hairline rounded-lg px-3 py-2 text-moon hover:bg-card-hover transition-colors"
                      onClick={() => {
                        setProfileOpen(false)
                        auth.signOut?.()
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
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

      <main className="flex-1 px-4 py-5">
        {tab === 'dashboard' && (
          <Dashboard
            stars={adAstra.stars}
            tasks={adAstra.tasks}
            constellations={adAstra.constellations}
            onUpdateTask={adAstra.updateTask}
            books={adAstra.books}
            readingLogs={adAstra.readingLogs}
            onUpdateBook={adAstra.updateBook}
            onDeleteBook={adAstra.deleteBook}
            onCreateReadingLog={adAstra.createReadingLog}
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
            onCreateBook={adAstra.createBook}
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
            readingGoals={{ books: adAstra.settings.readingGoalBooks, pages: adAstra.settings.readingGoalPages }}
            onChangeGoals={(g) => adAstra.updateSettings({ readingGoalBooks: g.books, readingGoalPages: g.pages })}
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

      <StoppedSessionSheet
        books={adAstra.books}
        onCreateReadingLog={adAstra.createReadingLog}
        onUpdateBook={adAstra.updateBook}
      />

      {hardcoverOpen && (
        <HardcoverReview
          books={adAstra.books}
          onApplyPatches={adAstra.updateBooksBulk}
          onClose={() => setHardcoverOpen(false)}
        />
      )}

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
    </ReadingTimerProvider>
  )
}

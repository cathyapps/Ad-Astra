import { useState } from 'react'
import { useAdAstra } from '@/hooks/useAdAstra'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { Universe } from '@/features/universe/Universe'
import { Travel } from '@/features/travel/Travel'
import { Reading } from '@/features/reading/Reading'
import { Watching } from '@/features/watching/Watching'
import { CapacityWarningModal } from '@/features/stars/CapacityWarningModal'
import { useAuthState } from '@/features/auth/AuthContext'

type Tab = 'dashboard' | 'universe' | 'travel' | 'reading' | 'watching'

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'universe', label: 'Universe' },
  { id: 'travel', label: 'Travel' },
  { id: 'reading', label: 'Reading' },
  { id: 'watching', label: 'Watching' },
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
            onUpdateTask={adAstra.updateTask}
          />
        )}
        {tab === 'universe' && (
          <Universe
            stars={adAstra.stars}
            tasks={adAstra.tasks}
            onCreateStar={adAstra.createStar}
            onUpdateStar={adAstra.updateStar}
            onMoveStar={adAstra.moveStar}
            onCreateTask={adAstra.createTask}
            onUpdateTask={adAstra.updateTask}
          />
        )}
        {tab === 'travel' && (
          <Travel
            stars={adAstra.stars}
            constellations={adAstra.constellations}
            destinations={adAstra.destinations}
            trips={adAstra.trips}
            tripItems={adAstra.tripItems}
            onCreateDestination={adAstra.createDestination}
            onUpdateDestination={adAstra.updateDestination}
            onDeleteDestination={adAstra.deleteDestination}
            onCreateTrip={adAstra.createTrip}
            onUpdateTrip={adAstra.updateTrip}
            onDeleteTrip={adAstra.deleteTrip}
            onCreateTripItem={adAstra.createTripItem}
            onUpdateTripItem={adAstra.updateTripItem}
            onDeleteTripItem={adAstra.deleteTripItem}
          />
        )}
        {tab === 'reading' && (
          <Reading
            stars={adAstra.stars}
            constellations={adAstra.constellations}
            books={adAstra.books}
            bookLists={adAstra.bookLists}
            bookListItems={adAstra.bookListItems}
            readingSessions={adAstra.readingSessions}
            readingChallenges={adAstra.readingChallenges}
            onCreateBook={adAstra.createBook}
            onUpdateBook={adAstra.updateBook}
            onDeleteBook={adAstra.deleteBook}
            onCreateBookList={adAstra.createBookList}
            onToggleBookInList={adAstra.toggleBookInList}
            onCreateReadingSession={adAstra.createReadingSession}
            onCreateReadingChallenge={adAstra.createReadingChallenge}
            onDeleteReadingChallenge={adAstra.deleteReadingChallenge}
          />
        )}
        {tab === 'watching' && (
          <Watching
            stars={adAstra.stars}
            constellations={adAstra.constellations}
            watchables={adAstra.watchables}
            episodes={adAstra.episodes}
            watchLists={adAstra.watchLists}
            watchListItems={adAstra.watchListItems}
            viewingSessions={adAstra.viewingSessions}
            watchChallenges={adAstra.watchChallenges}
            onCreateWatchable={adAstra.createWatchable}
            onUpdateWatchable={adAstra.updateWatchable}
            onDeleteWatchable={adAstra.deleteWatchable}
            onCreateEpisode={adAstra.createEpisode}
            onUpdateEpisode={adAstra.updateEpisode}
            onDeleteEpisode={adAstra.deleteEpisode}
            onCreateWatchList={adAstra.createWatchList}
            onToggleWatchableInList={adAstra.toggleWatchableInList}
            onCreateViewingSession={adAstra.createViewingSession}
            onCreateWatchChallenge={adAstra.createWatchChallenge}
            onDeleteWatchChallenge={adAstra.deleteWatchChallenge}
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

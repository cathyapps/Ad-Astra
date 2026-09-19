import { useState } from 'react'
import type { Constellation, Star } from '@/types'
import type {
  Episode,
  ViewingSession,
  WatchChallenge,
  Watchable,
  WatchList,
  WatchListItem,
} from '@/types/watching'
import { WatchableForm } from './WatchableForm'
import { WatchableLibrary } from './WatchableLibrary'
import { WatchableDetail } from './WatchableDetail'
import { WatchListForm, WatchListsPanel } from './WatchLists'
import { WatchChallengeForm, WatchChallengesPanel } from './WatchChallenges'
import { currentWatchStreakDays } from '@/lib/watchingStats'

interface Props {
  stars: Star[]
  constellations: Constellation[]
  watchables: Watchable[]
  episodes: Episode[]
  watchLists: WatchList[]
  watchListItems: WatchListItem[]
  viewingSessions: ViewingSession[]
  watchChallenges: WatchChallenge[]
  onCreateWatchable: (input: Partial<Watchable> & { title: string }) => void
  onUpdateWatchable: (id: string, patch: Partial<Watchable>) => void
  onDeleteWatchable: (id: string) => void
  onCreateEpisode: (input: Partial<Episode> & { watchableId: string }) => void
  onUpdateEpisode: (id: string, patch: Partial<Episode>) => void
  onDeleteEpisode: (id: string) => void
  onCreateWatchList: (input: Partial<WatchList> & { name: string }) => void
  onToggleWatchableInList: (watchListId: string, watchableId: string, isMember: boolean) => void
  onCreateViewingSession: (input: Partial<ViewingSession> & { watchableId: string }) => void
  onCreateWatchChallenge: (input: Partial<WatchChallenge> & { name: string }) => void
  onDeleteWatchChallenge: (id: string) => void
}

type SubTab = 'library' | 'lists' | 'challenges'

export function Watching({
  stars,
  constellations,
  watchables,
  episodes,
  watchLists,
  watchListItems,
  viewingSessions,
  watchChallenges,
  onCreateWatchable,
  onUpdateWatchable,
  onDeleteWatchable,
  onCreateEpisode,
  onUpdateEpisode,
  onDeleteEpisode,
  onCreateWatchList,
  onToggleWatchableInList,
  onCreateViewingSession,
  onCreateWatchChallenge,
  onDeleteWatchChallenge,
}: Props) {
  const [subTab, setSubTab] = useState<SubTab>('library')
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [showForm, setShowForm] = useState(false)
  const [showListForm, setShowListForm] = useState(false)
  const [showChallengeForm, setShowChallengeForm] = useState(false)

  const selected = watchables.find((w) => w.id === selectedId)
  const listIdsByWatchable = new Map<string, string[]>()
  for (const item of watchListItems) {
    listIdsByWatchable.set(item.watchableId, [
      ...(listIdsByWatchable.get(item.watchableId) ?? []),
      item.watchListId,
    ])
  }
  const streak = currentWatchStreakDays(viewingSessions)

  function selectWatchable(id: string) {
    setSelectedId(id)
    setSubTab('library')
  }

  return (
    <div className="space-y-4">
      {streak > 0 && (
        <div className="text-xs text-moon-dim border border-hairline rounded-full px-3 py-1.5 inline-block">
          🔥 {streak} day watch streak
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-1 text-sm border border-hairline rounded-full p-1">
          {(['library', 'lists', 'challenges'] as SubTab[]).map((t) => (
            <button
              key={t}
              className={`rounded-full px-3 py-1 transition-colors capitalize ${
                subTab === t ? 'bg-gold text-night font-medium' : 'text-moon-dim'
              }`}
              onClick={() => setSubTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          className="border border-hairline rounded-full px-3 py-1.5 text-sm text-moon hover:bg-card-hover transition-colors"
          onClick={() => {
            if (subTab === 'library') setShowForm(true)
            if (subTab === 'lists') setShowListForm(true)
            if (subTab === 'challenges') setShowChallengeForm(true)
          }}
        >
          + New
        </button>
      </div>

      {subTab === 'library' && (
        <>
          {showForm && (
            <div className="border border-hairline rounded-xl p-4 bg-card">
              <WatchableForm
                onCancel={() => setShowForm(false)}
                onSave={(input) => {
                  onCreateWatchable(input)
                  setShowForm(false)
                }}
              />
            </div>
          )}

          {selected && (
            <WatchableDetail
              watchable={selected}
              stars={stars}
              constellations={constellations}
              watchLists={watchLists}
              listIdsForWatchable={listIdsByWatchable.get(selected.id) ?? []}
              sessions={viewingSessions.filter((s) => s.watchableId === selected.id)}
              episodes={episodes.filter((e) => e.watchableId === selected.id)}
              onUpdate={(patch) => onUpdateWatchable(selected.id, patch)}
              onDelete={() => {
                onDeleteWatchable(selected.id)
                setSelectedId(undefined)
              }}
              onLogSession={(input) =>
                onCreateViewingSession({ ...input, watchableId: selected.id })
              }
              onToggleList={(listId) =>
                onToggleWatchableInList(
                  listId,
                  selected.id,
                  (listIdsByWatchable.get(selected.id) ?? []).includes(listId),
                )
              }
              onCreateEpisode={onCreateEpisode}
              onUpdateEpisode={onUpdateEpisode}
              onDeleteEpisode={onDeleteEpisode}
              onClose={() => setSelectedId(undefined)}
            />
          )}

          <WatchableLibrary watchables={watchables} onSelect={selectWatchable} selectedId={selectedId} />
        </>
      )}

      {subTab === 'lists' && (
        <>
          {showListForm && (
            <div className="border border-hairline rounded-xl p-4 bg-card">
              <WatchListForm
                onCancel={() => setShowListForm(false)}
                onSave={(input) => {
                  onCreateWatchList(input)
                  setShowListForm(false)
                }}
              />
            </div>
          )}
          <WatchListsPanel
            lists={watchLists}
            watchables={watchables}
            listIdsByWatchable={listIdsByWatchable}
            onSelectWatchable={selectWatchable}
          />
        </>
      )}

      {subTab === 'challenges' && (
        <>
          {showChallengeForm && (
            <div className="border border-hairline rounded-xl p-4 bg-card">
              <WatchChallengeForm
                onCancel={() => setShowChallengeForm(false)}
                onSave={(input) => {
                  onCreateWatchChallenge(input)
                  setShowChallengeForm(false)
                }}
              />
            </div>
          )}
          <WatchChallengesPanel
            challenges={watchChallenges}
            sessions={viewingSessions}
            onDelete={onDeleteWatchChallenge}
          />
        </>
      )}
    </div>
  )
}

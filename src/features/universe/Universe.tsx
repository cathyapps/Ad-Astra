import { useState } from 'react'
import type { Constellation, Star, StarStage, Task } from '@/types'
import type { Book } from '@/types/library'
import type { BucketListItem } from '@/types/bucketList'
import { StarMap } from './StarMap'
import { OrbitList } from './OrbitList'
import { UniverseLists } from './UniverseLists'
import { ConstellationForm, ConstellationDetail } from './ConstellationDetail'
import { StarForm } from '@/features/stars/StarForm'
import { StarDetail } from '@/features/stars/StarDetail'

interface Props {
  stars: Star[]
  tasks: Task[]
  constellations: Constellation[]
  books: Book[]
  bucketListItems: BucketListItem[]
  onCreateStar: (input: Partial<Star> & { name: string }) => void
  onUpdateStar: (id: string, patch: Partial<Star>) => void
  onDeleteStar: (id: string) => void
  onMoveStar: (id: string, to: StarStage) => void
  onCreateTask: (input: Partial<Task> & { starId: string; name: string }) => void
  onUpdateTask: (id: string, patch: Partial<Task>) => void
  onCreateConstellation: (input: Partial<Constellation> & { name: string }) => void
  onUpdateConstellation: (id: string, patch: Partial<Constellation>) => void
  onDeleteConstellation: (id: string) => void
  onUpdateBook: (id: string, patch: Partial<Book>) => void
  onUpdateBucketListItem: (id: string, patch: Partial<BucketListItem>) => void
}

export function Universe({
  stars,
  tasks,
  constellations,
  books,
  bucketListItems,
  onCreateStar,
  onUpdateStar,
  onDeleteStar,
  onMoveStar,
  onCreateTask,
  onUpdateTask,
  onCreateConstellation,
  onUpdateConstellation,
  onDeleteConstellation,
  onUpdateBook,
  onUpdateBucketListItem,
}: Props) {
  const [selectedStarId, setSelectedStarId] = useState<string | undefined>()
  const [selectedConstellationId, setSelectedConstellationId] = useState<string | undefined>()
  const [showStarForm, setShowStarForm] = useState(false)
  const [showConstellationForm, setShowConstellationForm] = useState(false)
  const [showAllStars, setShowAllStars] = useState(false)

  const selectedStar = stars.find((s) => s.id === selectedStarId)
  const selectedConstellation = constellations.find((c) => c.id === selectedConstellationId)

  function selectStar(id: string) {
    setSelectedConstellationId(undefined)
    setSelectedStarId(id)
  }
  function selectConstellation(id: string) {
    setSelectedStarId(undefined)
    setSelectedConstellationId(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg text-moon">Universe</h2>
        <div className="flex gap-2">
          <button
            className="border border-hairline rounded-full px-3 py-1.5 text-sm text-moon hover:bg-card-hover transition-colors"
            onClick={() => setShowConstellationForm(true)}
          >
            + Constellation
          </button>
          <button
            className="border border-hairline rounded-full px-3 py-1.5 text-sm text-moon hover:bg-card-hover transition-colors"
            onClick={() => setShowStarForm(true)}
          >
            + New Star
          </button>
        </div>
      </div>

      {showStarForm && (
        <div className="border border-hairline rounded-xl p-4 bg-card">
          <StarForm
            onCancel={() => setShowStarForm(false)}
            onSave={(input) => {
              onCreateStar(input)
              setShowStarForm(false)
            }}
          />
        </div>
      )}

      {showConstellationForm && (
        <div className="border border-hairline rounded-xl p-4 bg-card">
          <ConstellationForm
            onCancel={() => setShowConstellationForm(false)}
            onSave={(input) => {
              onCreateConstellation(input)
              setShowConstellationForm(false)
            }}
          />
        </div>
      )}

      {selectedStar && (
        <StarDetail
          star={selectedStar}
          tasks={tasks}
          books={books}
          bucketListItems={bucketListItems}
          onMoveStage={(to) => onMoveStar(selectedStar.id, to)}
          onUpdate={(patch) => onUpdateStar(selectedStar.id, patch)}
          onCreateTask={onCreateTask}
          onUpdateTask={onUpdateTask}
          onUpdateBook={onUpdateBook}
          onUpdateBucketListItem={onUpdateBucketListItem}
          onDelete={() => {
            onDeleteStar(selectedStar.id)
            setSelectedStarId(undefined)
          }}
          onClose={() => setSelectedStarId(undefined)}
        />
      )}

      {selectedConstellation && (
        <ConstellationDetail
          constellation={selectedConstellation}
          stars={stars}
          onUpdate={(patch) => onUpdateConstellation(selectedConstellation.id, patch)}
          onDelete={() => {
            onDeleteConstellation(selectedConstellation.id)
            setSelectedConstellationId(undefined)
          }}
          onSelectStar={selectStar}
          onClose={() => setSelectedConstellationId(undefined)}
        />
      )}

      <StarMap stars={stars} constellations={constellations} onSelect={selectStar} selectedId={selectedStarId} />

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs uppercase tracking-wide text-moon-dim">In Orbit</h3>
          <button
            className="text-xs text-cosmic hover:text-moon transition-colors"
            onClick={() => setShowAllStars((v) => !v)}
          >
            {showAllStars ? 'Hide' : 'See all Stars'}
          </button>
        </div>
        <OrbitList
          stars={stars}
          constellations={constellations}
          onSelect={selectStar}
          onSelectConstellation={selectConstellation}
          selectedId={selectedStarId}
        />
      </div>

      {showAllStars && (
        <div>
          <h3 className="text-xs uppercase tracking-wide text-moon-dim mb-2">All Stars</h3>
          <UniverseLists stars={stars} onSelect={selectStar} selectedId={selectedStarId} />
        </div>
      )}
    </div>
  )
}

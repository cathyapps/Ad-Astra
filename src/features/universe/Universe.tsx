import { useState } from 'react'
import type { Star, StarStage, Task } from '@/types'
import { StarMap } from './StarMap'
import { UniverseLists } from './UniverseLists'
import { StarForm } from '@/features/stars/StarForm'
import { StarDetail } from '@/features/stars/StarDetail'

interface Props {
  stars: Star[]
  tasks: Task[]
  onCreateStar: (input: Partial<Star> & { name: string }) => void
  onUpdateStar: (id: string, patch: Partial<Star>) => void
  onMoveStar: (id: string, to: StarStage) => void
  onCreateTask: (input: Partial<Task> & { starId: string; name: string }) => void
  onUpdateTask: (id: string, patch: Partial<Task>) => void
}

export function Universe({
  stars,
  tasks,
  onCreateStar,
  onUpdateStar,
  onMoveStar,
  onCreateTask,
  onUpdateTask,
}: Props) {
  const [view, setView] = useState<'list' | 'map'>('list')
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [showForm, setShowForm] = useState(false)

  const selected = stars.find((s) => s.id === selectedId)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 text-sm border border-hairline rounded-full p-1">
          <button
            className={`rounded-full px-3 py-1 transition-colors ${
              view === 'list' ? 'bg-gold text-night font-medium' : 'text-moon-dim'
            }`}
            onClick={() => setView('list')}
          >
            List
          </button>
          <button
            className={`rounded-full px-3 py-1 transition-colors ${
              view === 'map' ? 'bg-gold text-night font-medium' : 'text-moon-dim'
            }`}
            onClick={() => setView('map')}
          >
            Map
          </button>
        </div>
        <button
          className="border border-hairline rounded-full px-3 py-1.5 text-sm text-moon hover:bg-card-hover transition-colors"
          onClick={() => setShowForm(true)}
        >
          + New Star
        </button>
      </div>

      {showForm && (
        <div className="border border-hairline rounded-xl p-4 bg-card">
          <StarForm
            onCancel={() => setShowForm(false)}
            onSave={(input) => {
              onCreateStar(input)
              setShowForm(false)
            }}
          />
        </div>
      )}

      {selected && (
        <StarDetail
          star={selected}
          tasks={tasks}
          onMoveStage={(to) => onMoveStar(selected.id, to)}
          onUpdate={(patch) => onUpdateStar(selected.id, patch)}
          onCreateTask={onCreateTask}
          onUpdateTask={onUpdateTask}
          onClose={() => setSelectedId(undefined)}
        />
      )}

      {view === 'list' ? (
        <UniverseLists stars={stars} onSelect={setSelectedId} selectedId={selectedId} />
      ) : (
        <StarMap stars={stars} onSelect={setSelectedId} selectedId={selectedId} />
      )}
    </div>
  )
}

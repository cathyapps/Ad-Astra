import type { LearningGoal, LearningItem } from '@/types/learning'
import { LEARNING_STATUS_LABELS, LearningStatusBadge } from './learningLabels'
import { allowedLearningTransitions } from './learningTransitions'
import { LearningItemList } from './LearningItemList'

interface Props {
  goal: LearningGoal
  items: LearningItem[]
  onUpdate: (patch: Partial<LearningGoal>) => void
  onDelete: () => void
  onCreateItem: (input: Partial<LearningItem> & { goalId: string; name: string }) => void
  onUpdateItem: (id: string, patch: Partial<LearningItem>) => void
  onDeleteItem: (id: string) => void
  onClose: () => void
}

export function LearningDetail({
  goal,
  items,
  onUpdate,
  onDelete,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
  onClose,
}: Props) {
  const options = allowedLearningTransitions(goal.status)
  const planets = items.filter((i) => !i.parentItemId)

  return (
    <div className="border border-hairline rounded-xl p-4 space-y-4 bg-card">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-lg text-moon">{goal.name}</h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <LearningStatusBadge status={goal.status} />
            {planets.length > 0 && (
              <span className="text-xs text-moon-dim">{planets.map((p) => p.name).join(', ')}</span>
            )}
          </div>
        </div>
        <button className="text-sm text-moon-dim hover:text-moon" onClick={onClose}>
          Close
        </button>
      </div>

      {goal.description && <p className="text-sm text-moon-dim">{goal.description}</p>}
      {goal.notes && <p className="text-sm text-moon-dim">{goal.notes}</p>}

      <div className="flex flex-wrap gap-2">
        {options.map((s) => (
          <button
            key={s}
            className="text-xs border border-hairline rounded-full px-3 py-1.5 text-moon-dim hover:text-moon hover:bg-card-hover transition-colors"
            onClick={() =>
              onUpdate({ status: s, completedAt: s === 'completed' ? new Date().toISOString() : undefined })
            }
          >
            Move to {LEARNING_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-medium text-moon mb-2">Planets &amp; Moons</h3>
        <LearningItemList
          goalId={goal.id}
          items={items}
          onCreate={onCreateItem}
          onUpdate={onUpdateItem}
          onDelete={onDeleteItem}
        />
      </div>

      <button
        className="text-xs text-moon-dim hover:text-red-400 transition-colors"
        onClick={onDelete}
      >
        Delete goal
      </button>
    </div>
  )
}

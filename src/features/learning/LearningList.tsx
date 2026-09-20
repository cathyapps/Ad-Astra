import { LEARNING_STATUS_ORDER, type LearningGoal } from '@/types/learning'
import { LEARNING_STATUS_LABELS } from './learningLabels'

interface Props {
  goals: LearningGoal[]
  onSelect: (id: string) => void
  selectedId?: string
}

export function LearningList({ goals, onSelect, selectedId }: Props) {
  return (
    <div className="space-y-5">
      {LEARNING_STATUS_ORDER.map((status) => {
        const group = goals.filter((g) => g.status === status)
        if (group.length === 0) return null
        return (
          <div key={status}>
            <h3 className="text-xs uppercase tracking-wide text-moon-dim mb-2">
              {LEARNING_STATUS_LABELS[status]} ({group.length})
            </h3>
            <div className="space-y-1.5">
              {group.map((g) => (
                <button
                  key={g.id}
                  onClick={() => onSelect(g.id)}
                  className={`w-full text-left text-sm border rounded-lg px-3 py-2 transition-colors ${
                    g.id === selectedId
                      ? 'border-gold/40 bg-card-hover text-moon'
                      : 'border-hairline text-moon hover:bg-card-hover'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>
        )
      })}
      {goals.length === 0 && (
        <p className="text-sm text-moon-dim">No learning goals yet — add one below.</p>
      )}
    </div>
  )
}

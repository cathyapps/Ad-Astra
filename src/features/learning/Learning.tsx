import { useState } from 'react'
import type { LearningGoal, LearningItem } from '@/types/learning'
import { LearningForm } from './LearningForm'
import { LearningList } from './LearningList'
import { LearningDetail } from './LearningDetail'

interface Props {
  goals: LearningGoal[]
  learningItems: LearningItem[]
  onCreateGoal: (input: Partial<LearningGoal> & { name: string }) => Promise<LearningGoal> | void
  onUpdateGoal: (id: string, patch: Partial<LearningGoal>) => void
  onDeleteGoal: (id: string) => void
  onCreateItem: (input: Partial<LearningItem> & { goalId: string; name: string }) => void
  onUpdateItem: (id: string, patch: Partial<LearningItem>) => void
  onDeleteItem: (id: string) => void
}

// Every learning aspiration is a free-form Goal — "Learn French," "Learn
// piano," "Refinery details for work" — with free-entry sub-goals/tasks
// (Planets & Moons) nested under it. No metrics, just status.
export function Learning({
  goals,
  learningItems,
  onCreateGoal,
  onUpdateGoal,
  onDeleteGoal,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
}: Props) {
  const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>()
  const [showGoalForm, setShowGoalForm] = useState(false)

  const selectedGoal = goals.find((g) => g.id === selectedGoalId)

  async function handleCreateGoal(input: Partial<LearningGoal> & { name: string }, firstItemName?: string) {
    const result = onCreateGoal(input)
    const created = result instanceof Promise ? await result : undefined
    setShowGoalForm(false)
    if (created) {
      if (firstItemName) {
        onCreateItem({ goalId: created.id, name: firstItemName })
      }
      setSelectedGoalId(created.id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-moon">Learning</h2>
        <button
          className="border border-hairline rounded-full px-3 py-1.5 text-sm text-moon hover:bg-card-hover transition-colors"
          onClick={() => setShowGoalForm(true)}
        >
          + New Goal
        </button>
      </div>

      {showGoalForm && (
        <div className="border border-hairline rounded-xl p-4 bg-card">
          <LearningForm offerFirstItem onCancel={() => setShowGoalForm(false)} onSave={handleCreateGoal} />
        </div>
      )}

      {selectedGoal && (
        <LearningDetail
          goal={selectedGoal}
          items={learningItems.filter((i) => i.goalId === selectedGoal.id)}
          onUpdate={(patch) => onUpdateGoal(selectedGoal.id, patch)}
          onDelete={() => {
            onDeleteGoal(selectedGoal.id)
            setSelectedGoalId(undefined)
          }}
          onCreateItem={onCreateItem}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
          onClose={() => setSelectedGoalId(undefined)}
        />
      )}

      <LearningList goals={goals} onSelect={setSelectedGoalId} selectedId={selectedGoalId} />
    </div>
  )
}

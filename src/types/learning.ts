// Learning domain types — Phase 4. Free-form goals ("Learn French",
// "Learn piano", "Refinery details for work") with free-entry sub-goals
// and tasks nested under them. Unlike Travel, items have no `type` — pure
// free text — and unlike Reading, there are no derived metrics: just a
// planned/in_progress/completed status at both the goal and item level.

export type LearningStatus = 'planned' | 'in_progress' | 'completed'

export const LEARNING_STATUS_ORDER: LearningStatus[] = ['planned', 'in_progress', 'completed']

export interface LearningGoal {
  id: string
  name: string
  description?: string
  status: LearningStatus
  notes?: string

  relatedStarIds: string[]
  // Auto-managed: set once this goal moves past 'planned'. See
  // src/lib/autoStars.ts. Cleared (and the Star deleted) if the goal
  // regresses back to 'planned'.
  linkedStarId?: string

  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface LearningItem {
  id: string
  goalId: string
  parentItemId?: string // absent = a Planet (top-level sub-goal); present = a Moon nested under it
  name: string
  notes?: string
  status: LearningStatus
  sortIndex: number

  createdAt: string
  updatedAt: string
  completedAt?: string
}

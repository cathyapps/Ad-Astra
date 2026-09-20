import type { LearningStatus } from '@/types/learning'

const LEARNING_ALLOWED: Record<LearningStatus, LearningStatus[]> = {
  planned: ['in_progress'],
  in_progress: ['planned', 'completed'],
  completed: ['in_progress'],
}

export function allowedLearningTransitions(from: LearningStatus): LearningStatus[] {
  return LEARNING_ALLOWED[from] ?? []
}

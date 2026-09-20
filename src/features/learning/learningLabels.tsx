import type { LearningStatus } from '@/types/learning'

export const LEARNING_STATUS_LABELS: Record<LearningStatus, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
}

export function LearningStatusBadge({ status }: { status: LearningStatus }) {
  const dot = status === 'completed' ? 'bg-moon-dim' : status === 'in_progress' ? 'bg-gold' : 'bg-cosmic'
  return (
    <span className="inline-flex items-center gap-1.5 text-xs border border-hairline rounded-full px-2.5 py-1 text-moon-dim">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {LEARNING_STATUS_LABELS[status]}
    </span>
  )
}

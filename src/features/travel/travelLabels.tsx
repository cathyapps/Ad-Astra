import type { DestinationStatus, TripStatus, LifeStageTag } from '@/types/travel'

export const DESTINATION_STATUS_LABELS: Record<DestinationStatus, string> = {
  bucket_list: 'Bucket List',
  planning: 'Planning',
  booked: 'Booked',
  visited: 'Visited',
  archived: 'Archived',
}

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  idea: 'Idea',
  planning: 'Planning',
  booked: 'Booked',
  completed: 'Completed',
  archived: 'Archived',
}

export const LIFE_STAGE_LABELS: Record<LifeStageTag, string> = {
  before_kids: 'Before kids',
  with_kids: 'With kids',
  while_young: 'While young',
  anytime: 'Anytime',
  retirement: 'Retirement',
}

export function DestinationStatusBadge({ status }: { status: DestinationStatus }) {
  const dot = status === 'visited' || status === 'archived' ? 'bg-moon-dim' : 'bg-cosmic'
  return (
    <span className="inline-flex items-center gap-1.5 text-xs border border-hairline rounded-full px-2.5 py-1 text-moon-dim">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {DESTINATION_STATUS_LABELS[status]}
    </span>
  )
}

export function TripStatusBadge({ status }: { status: TripStatus }) {
  const dot = status === 'completed' || status === 'archived' ? 'bg-moon-dim' : 'bg-gold'
  return (
    <span className="inline-flex items-center gap-1.5 text-xs border border-hairline rounded-full px-2.5 py-1 text-moon-dim">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {TRIP_STATUS_LABELS[status]}
    </span>
  )
}

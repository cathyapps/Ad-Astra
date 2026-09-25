import { useState } from 'react'
import type { BucketListItem } from '@/types/bucketList'
import { TagsField } from '@/features/shared/TagsField'
import { BucketListStatusBadge, nextBucketListStatus } from './bucketListLabels'

interface Props {
  item: BucketListItem
  tagSuggestions: string[]
  onUpdate: (id: string, patch: Partial<BucketListItem>) => void
  onDelete: (id: string) => void
  onPromoteToStar?: (item: BucketListItem) => void
}

export function BucketListItemRow({ item, tagSuggestions, onUpdate, onDelete, onPromoteToStar }: Props) {
  const [notesOpen, setNotesOpen] = useState(false)
  const isTravel = item.category === 'travel_destination'
  const isWatchable = item.category === 'show' || item.category === 'movie'

  function cycleStatus() {
    const status = nextBucketListStatus(item.category, item.status)
    onUpdate(item.id, {
      status,
      completedAt: status === 'completed' ? new Date().toISOString() : undefined,
    })
    if (status === 'progressing_to_star' && item.relatedStarIds.length === 0) {
      onPromoteToStar?.(item)
    }
  }

  return (
    <div className="border border-hairline rounded-lg px-3 py-2 bg-card space-y-2 min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="flex-1 min-w-[100px] bg-transparent text-sm text-moon focus:outline-none"
          value={item.name}
          onChange={(e) => onUpdate(item.id, { name: e.target.value })}
        />
        <BucketListStatusBadge category={item.category} status={item.status} onClick={cycleStatus} />
        <button
          className="text-xs text-moon-dim hover:text-moon transition-colors shrink-0"
          onClick={() => setNotesOpen((v) => !v)}
        >
          {notesOpen ? 'Hide' : 'Details'}
        </button>
        <button
          className="text-xs text-moon-dim hover:text-red-400 transition-colors shrink-0"
          onClick={() => onDelete(item.id)}
        >
          ✕
        </button>
      </div>

      <TagsField tags={item.tags} suggestions={tagSuggestions} onChange={(tags) => onUpdate(item.id, { tags })} />

      {notesOpen && (
        <div className="space-y-2 pt-1">
          <textarea
            className="w-full border border-hairline bg-night rounded-lg px-2.5 py-1.5 text-sm text-moon placeholder:text-moon-dim/60"
            rows={2}
            placeholder="Notes…"
            value={item.notes ?? ''}
            onChange={(e) => onUpdate(item.id, { notes: e.target.value })}
          />
          {isWatchable && (
            <input
              className="w-full border border-hairline bg-night rounded-lg px-2.5 py-1.5 text-sm text-moon placeholder:text-moon-dim/60"
              placeholder="Streaming source (e.g. Netflix)"
              value={item.streamingSource ?? ''}
              onChange={(e) => onUpdate(item.id, { streamingSource: e.target.value })}
            />
          )}
        </div>
      )}

      {isTravel && item.status === 'progressing_to_star' && item.relatedStarIds.length > 0 && (
        <p className="text-xs text-cosmic">Promoted — real planning now happens on its Star in the Universe.</p>
      )}
    </div>
  )
}

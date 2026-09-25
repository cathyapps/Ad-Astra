import { useState } from 'react'
import type { BucketListItem } from '@/types/bucketList'
import { EditButton } from '@/features/shared/EditButton'
import { BucketListItemForm } from './BucketListItemForm'
import { BucketListStatusBadge, nextBucketListStatus } from './bucketListLabels'

const STREAMING_SOURCES = ['', 'Netflix', 'Prime', 'Disney+', 'Plex', 'Other']

interface Props {
  item: BucketListItem
  tagSuggestions: string[]
  onUpdate: (id: string, patch: Partial<BucketListItem>) => void
  onDelete: (id: string) => void
  onPromoteToStar?: (item: BucketListItem) => void
}

export function BucketListItemRow({ item, tagSuggestions, onUpdate, onDelete, onPromoteToStar }: Props) {
  const [editing, setEditing] = useState(false)
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
    <div className="border border-hairline rounded-lg px-3 py-2 bg-card space-y-1.5 min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex-1 min-w-[100px] text-sm text-moon truncate">{item.name}</span>
        {isWatchable && (
          <select
            className="border border-hairline bg-night rounded-lg px-2 py-1 text-xs text-moon shrink-0"
            value={item.streamingSource ?? ''}
            onChange={(e) => onUpdate(item.id, { streamingSource: e.target.value || undefined })}
          >
            {STREAMING_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s || 'Where?'}
              </option>
            ))}
          </select>
        )}
        <BucketListStatusBadge category={item.category} status={item.status} onClick={cycleStatus} />
        <EditButton onClick={() => setEditing(true)} label="Edit item" />
      </div>

      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.tags.map((t) => (
            <span key={t} className="text-xs border border-hairline rounded-full px-2.5 py-1 text-moon-dim">
              {t}
            </span>
          ))}
        </div>
      )}

      {isTravel && item.status === 'progressing_to_star' && item.relatedStarIds.length > 0 && (
        <p className="text-xs text-cosmic">Promoted — real planning now happens on its Star in the Universe.</p>
      )}

      {editing && (
        <BucketListItemForm
          item={item}
          tagSuggestions={tagSuggestions}
          onSave={(patch) => {
            onUpdate(item.id, patch)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
          onDelete={() => {
            onDelete(item.id)
            setEditing(false)
          }}
        />
      )}
    </div>
  )
}

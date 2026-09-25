import { useState } from 'react'
import type { BucketListItem } from '@/types/bucketList'
import { TagsField } from '@/features/shared/TagsField'
import { BottomSheet } from '@/features/shared/BottomSheet'

const inputClass =
  'mt-1 w-full border border-hairline bg-night rounded-lg px-3 py-2 text-sm text-moon placeholder:text-moon-dim/60'
const labelClass = 'text-sm block text-moon-dim'

interface Props {
  item: BucketListItem
  tagSuggestions: string[]
  onSave: (patch: Partial<BucketListItem>) => void
  onCancel: () => void
  onDelete: () => void
}

export function BucketListItemForm({ item, tagSuggestions, onSave, onCancel, onDelete }: Props) {
  const [name, setName] = useState(item.name)
  const [notes, setNotes] = useState(item.notes ?? '')
  const [tags, setTags] = useState<string[]>(item.tags)

  return (
    <BottomSheet title="Edit item" onClose={onCancel}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          onSave({ name: name.trim(), notes: notes || undefined, tags })
        }}
      >
        <div>
          <label className={labelClass}>Name</label>
          <input autoFocus className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <label className={labelClass}>
          Notes
          <textarea className={inputClass} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <div>
          <span className={labelClass}>Tags</span>
          <div className="mt-1">
            <TagsField tags={tags} suggestions={tagSuggestions} onChange={setTags} />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            className="border border-hairline rounded-lg px-3 py-2.5 text-sm flex-1 text-moon hover:bg-card-hover transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button type="submit" className="rounded-lg px-3 py-2.5 text-sm flex-1 bg-gold text-night font-medium">
            Save
          </button>
        </div>
        <button type="button" className="text-xs text-moon-dim hover:text-red-400 transition-colors" onClick={onDelete}>
          Delete item
        </button>
      </form>
    </BottomSheet>
  )
}

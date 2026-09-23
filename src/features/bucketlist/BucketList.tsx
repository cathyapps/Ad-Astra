import { useState } from 'react'
import type { BucketListCategory, BucketListItem } from '@/types/bucketList'
import { BUCKET_LIST_CATEGORIES, BUCKET_LIST_CATEGORY_LABELS } from '@/types/bucketList'
import { BucketListSection } from './BucketListSection'

interface Props {
  items: BucketListItem[]
  onCreate: (input: Partial<BucketListItem> & { category: BucketListCategory; name: string }) => void
  onUpdate: (id: string, patch: Partial<BucketListItem>) => void
  onDelete: (id: string) => void
}

export function BucketList({ items, onCreate, onUpdate, onDelete }: Props) {
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState<BucketListCategory>('travel_destination')

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg text-moon">Bucket List</h2>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!newName.trim()) return
          onCreate({ category: newCategory, name: newName.trim() })
          setNewName('')
        }}
      >
        <select
          className="border border-hairline bg-night rounded-lg px-2 py-2 text-sm text-moon"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value as BucketListCategory)}
        >
          {BUCKET_LIST_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {BUCKET_LIST_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <input
          className="flex-1 border border-hairline bg-night rounded-lg px-3 py-2 text-sm text-moon placeholder:text-moon-dim/60"
          placeholder="Quick add…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-lg px-3 py-2 text-sm bg-gold text-night font-medium"
        >
          Add
        </button>
      </form>

      <div className="space-y-3">
        {BUCKET_LIST_CATEGORIES.map((category) => (
          <BucketListSection
            key={category}
            category={category}
            items={items.filter((i) => i.category === category)}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}

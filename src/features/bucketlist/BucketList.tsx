import { useState } from 'react'
import type { BucketListCategory, BucketListItem } from '@/types/bucketList'
import { BUCKET_LIST_CATEGORIES, BUCKET_LIST_CATEGORY_LABELS } from '@/types/bucketList'
import type { Star } from '@/types'
import { BucketListSection } from './BucketListSection'

interface Props {
  items: BucketListItem[]
  onCreate: (input: Partial<BucketListItem> & { category: BucketListCategory; name: string }) => void
  onUpdate: (id: string, patch: Partial<BucketListItem>) => void
  onDelete: (id: string) => void
  onCreateStar: (input: Partial<Star> & { name: string }) => Promise<Star> | Star
}

export function BucketList({ items, onCreate, onUpdate, onDelete, onCreateStar }: Props) {
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState<BucketListCategory>('travel_destination')

  async function promoteToStar(item: BucketListItem) {
    const star = await onCreateStar({
      name: item.name,
      category: 'travel',
      description: item.notes,
      stage: 'on_the_horizon',
      tags: item.tags,
    })
    onUpdate(item.id, { relatedStarIds: [...item.relatedStarIds, star.id] })
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg text-moon">Bucket List</h2>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!newName.trim()) return
          onCreate({
            category: newCategory,
            name: newName.trim(),
            status: newCategory === 'travel_destination' ? 'bucket_list' : 'backlog',
          })
          setNewName('')
        }}
      >
        <select
          className="border border-hairline bg-night rounded-lg px-2 py-2 text-sm text-moon shrink-0"
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
          className="flex-1 min-w-[140px] border border-hairline bg-night rounded-lg px-3 py-2 text-sm text-moon placeholder:text-moon-dim/60"
          placeholder="Quick add…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-lg px-3 py-2 text-sm bg-gold text-night font-medium shrink-0"
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
            onPromoteToStar={category === 'travel_destination' ? promoteToStar : undefined}
          />
        ))}
      </div>
    </div>
  )
}

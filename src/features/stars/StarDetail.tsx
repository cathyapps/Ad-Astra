import { useState } from 'react'
import type { Constellation, Star, StarStage, Task } from '@/types'
import type { Book } from '@/types/library'
import type { BucketListItem } from '@/types/bucketList'
import { ALLOWED_STAGES } from './allowedStages'
import { StageBadge, STAGE_LABELS } from './stageLabels'
import { TaskList } from '@/features/tasks/TaskList'
import { StarLinkedItems } from './StarLinkedItems'
import { EditButton } from '@/features/shared/EditButton'
import { BottomSheet } from '@/features/shared/BottomSheet'
import { StarForm } from './StarForm'

interface Props {
  star: Star
  tasks: Task[]
  books: Book[]
  bucketListItems: BucketListItem[]
  allStars: Star[] // for tag suggestions drawn from every star's tags
  constellations: Constellation[]
  onMoveStage: (to: StarStage) => void
  onUpdate: (patch: Partial<Star>) => void
  onCreateTask: (input: Partial<Task> & { starId: string; name: string }) => void
  onUpdateTask: (id: string, patch: Partial<Task>) => void
  onDeleteTask?: (id: string) => void
  onUpdateBook: (id: string, patch: Partial<Book>) => void
  onUpdateBucketListItem: (id: string, patch: Partial<BucketListItem>) => void
  onUpdateConstellation: (id: string, patch: Partial<Constellation>) => void
  onDelete: () => void
  onClose: () => void
}

export function StarDetail({
  star,
  tasks,
  books,
  bucketListItems,
  allStars,
  constellations,
  onMoveStage,
  onUpdate,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onUpdateBook,
  onUpdateBucketListItem,
  onUpdateConstellation,
  onDelete,
  onClose,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [pickingConstellations, setPickingConstellations] = useState(false)
  const [constellationDraft, setConstellationDraft] = useState<string[]>([])
  const options = ALLOWED_STAGES[star.stage]
  const starTasks = tasks.filter((t) => t.starId === star.id)
  const done = starTasks.filter((t) => t.status === 'done').length
  const tagSuggestions = Array.from(new Set(allStars.flatMap((s) => s.tags ?? [])))
  const memberOf = constellations.filter((c) => c.starIds.includes(star.id))

  function openConstellationPicker() {
    setConstellationDraft(memberOf.map((c) => c.id))
    setPickingConstellations(true)
  }

  function saveConstellations() {
    for (const c of constellations) {
      const shouldBeMember = constellationDraft.includes(c.id)
      const isMember = c.starIds.includes(star.id)
      if (shouldBeMember && !isMember) {
        onUpdateConstellation(c.id, { starIds: [...c.starIds, star.id] })
      } else if (!shouldBeMember && isMember) {
        onUpdateConstellation(c.id, { starIds: c.starIds.filter((id) => id !== star.id) })
      }
    }
    setPickingConstellations(false)
  }

  return (
    <div className="border border-hairline rounded-xl p-4 space-y-4 bg-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg text-moon">{star.name}</h2>
            <EditButton onClick={() => setEditing(true)} label="Edit star" />
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <StageBadge stage={star.stage} />
            {star.category && <span className="text-xs text-moon-dim">{star.category}</span>}
            {(star.tags ?? []).map((tag) => (
              <span key={tag} className="text-[10px] border border-hairline rounded-full px-2 py-0.5 text-cosmic">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <button className="text-sm text-moon-dim hover:text-moon" onClick={onClose}>
          Close
        </button>
      </div>

      {star.description && <p className="text-sm text-moon-dim">{star.description}</p>}

      <div className="flex flex-wrap gap-2">
        {options.map((s) => (
          <button
            key={s}
            className="text-xs border border-hairline rounded-full px-3 py-1.5 text-moon-dim hover:text-moon hover:bg-card-hover transition-colors"
            onClick={() => onMoveStage(s)}
          >
            Move to {STAGE_LABELS[s]}
          </button>
        ))}
      </div>

      {star.stage === 'current_orbit' && (
        <label className="text-sm block text-moon-dim">
          Progress: <span className="text-gold font-medium">{star.progress}%</span>
          <input
            type="range"
            min={0}
            max={100}
            value={star.progress}
            onChange={(e) => onUpdate({ progress: Number(e.target.value) })}
            className="w-full mt-1 accent-gold"
          />
        </label>
      )}

      <div>
        <h3 className="text-sm font-medium text-moon mb-2">Constellations</h3>
        <div className="flex flex-wrap items-center gap-1.5">
          {memberOf.map((c) => (
            <span key={c.id} className="text-xs border border-hairline rounded-full px-2.5 py-1 text-moon-dim">
              {c.name}
            </span>
          ))}
          <button
            type="button"
            className="text-xs text-cosmic hover:text-moon transition-colors"
            onClick={openConstellationPicker}
          >
            + Add to constellation
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-moon">Planets &amp; Moons</h3>
          <span className="text-xs text-moon-dim">
            {done}/{starTasks.length} done
          </span>
        </div>
        <TaskList
          starId={star.id}
          tasks={starTasks}
          onCreate={onCreateTask}
          onUpdate={onUpdateTask}
          onDelete={onDeleteTask}
        />
      </div>

      <div>
        <h3 className="text-sm font-medium text-moon mb-2">Linked Items</h3>
        <StarLinkedItems
          star={star}
          books={books}
          bucketListItems={bucketListItems}
          onUpdateBook={onUpdateBook}
          onUpdateBucketListItem={onUpdateBucketListItem}
        />
      </div>

      <button className="text-xs text-moon-dim hover:text-red-400 transition-colors" onClick={onDelete}>
        Delete star
      </button>

      {editing && (
        <BottomSheet title="Edit star" onClose={() => setEditing(false)}>
          <StarForm
            initial={star}
            defaultStage={star.stage}
            tagSuggestions={tagSuggestions}
            onSave={(patch) => {
              onUpdate(patch)
              setEditing(false)
            }}
            onCancel={() => setEditing(false)}
          />
        </BottomSheet>
      )}

      {pickingConstellations && (
        <BottomSheet title="Add to constellation" onClose={() => setPickingConstellations(false)}>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5 max-h-72 overflow-y-auto">
              {constellations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setConstellationDraft((d) => (d.includes(c.id) ? d.filter((id) => id !== c.id) : [...d, c.id]))
                  }
                  className={`text-xs border rounded-full px-2.5 py-1 transition-colors ${
                    constellationDraft.includes(c.id)
                      ? 'bg-cosmic text-night border-cosmic font-medium'
                      : 'border-hairline text-moon-dim hover:text-moon'
                  }`}
                >
                  {c.name}
                </button>
              ))}
              {constellations.length === 0 && (
                <p className="text-xs text-moon-dim">No constellations yet — create one from the Universe screen.</p>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                className="border border-hairline rounded-lg px-3 py-2 text-sm flex-1 text-moon hover:bg-card-hover transition-colors"
                onClick={() => setPickingConstellations(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm flex-1 bg-gold text-night font-medium"
                onClick={saveConstellations}
              >
                Done
              </button>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  )
}

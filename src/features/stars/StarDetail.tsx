import type { Star, StarStage, Task } from '@/types'
import type { Book } from '@/types/library'
import type { BucketListItem } from '@/types/bucketList'
import { ALLOWED_STAGES } from './allowedStages'
import { StageBadge, STAGE_LABELS } from './stageLabels'
import { TaskList } from '@/features/tasks/TaskList'
import { StarLinkedItems } from './StarLinkedItems'

interface Props {
  star: Star
  tasks: Task[]
  books: Book[]
  bucketListItems: BucketListItem[]
  onMoveStage: (to: StarStage) => void
  onUpdate: (patch: Partial<Star>) => void
  onCreateTask: (input: Partial<Task> & { starId: string; name: string }) => void
  onUpdateTask: (id: string, patch: Partial<Task>) => void
  onUpdateBook: (id: string, patch: Partial<Book>) => void
  onUpdateBucketListItem: (id: string, patch: Partial<BucketListItem>) => void
  onDelete: () => void
  onClose: () => void
}

export function StarDetail({
  star,
  tasks,
  books,
  bucketListItems,
  onMoveStage,
  onUpdate,
  onCreateTask,
  onUpdateTask,
  onUpdateBook,
  onUpdateBucketListItem,
  onDelete,
  onClose,
}: Props) {
  const options = ALLOWED_STAGES[star.stage]
  const starTasks = tasks.filter((t) => t.starId === star.id)
  const done = starTasks.filter((t) => t.status === 'done').length

  return (
    <div className="border border-hairline rounded-xl p-4 space-y-4 bg-card">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-lg text-moon">{star.name}</h2>
          <div className="flex items-center gap-2 mt-1.5">
            <StageBadge stage={star.stage} />
            {star.category && <span className="text-xs text-moon-dim">{star.category}</span>}
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
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-moon">Planets &amp; Moons</h3>
          <span className="text-xs text-moon-dim">
            {done}/{starTasks.length} done
          </span>
        </div>
        <TaskList starId={star.id} tasks={starTasks} onCreate={onCreateTask} onUpdate={onUpdateTask} />
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
    </div>
  )
}

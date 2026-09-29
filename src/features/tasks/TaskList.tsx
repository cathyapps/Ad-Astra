import { useState } from 'react'
import type { Task } from '@/types'
import { EditButton } from '@/features/shared/EditButton'
import { BottomSheet } from '@/features/shared/BottomSheet'
import { TaskForm } from './TaskForm'

interface Props {
  starId: string
  tasks: Task[]
  parentId?: string
  onUpdate: (id: string, patch: Partial<Task>) => void
  onDelete?: (id: string) => void
  depth?: number
}

const TYPE_BADGE: Record<NonNullable<Task['taskType']>, string> = {
  habit: 'habit',
  recurring: 'recurring',
  one_off: 'one-off',
}

function frequencyLabel(t: Task): string | undefined {
  if (t.taskType !== 'habit' || !t.habitFrequency) return undefined
  if (t.habitFrequency.kind === 'daily') return 'daily'
  if (t.habitFrequency.kind === 'per_week') return `${t.habitFrequency.count ?? 1}x/week`
  return `${t.habitFrequency.count ?? 1}x/month`
}

export function TaskList({ starId, tasks, parentId, onUpdate, onDelete, depth = 0 }: Props) {
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const children = tasks
    .filter((t) => (t.parentTaskId ?? undefined) === parentId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  const allTags = Array.from(new Set(tasks.flatMap((t) => t.tags ?? [])))
  const tasksById = new Map(tasks.map((t) => [t.id, t]))

  return (
    <div style={{ marginLeft: depth * 14, width: `calc(100% - ${depth * 14}px)` }} className="space-y-1.5 min-w-0">
      {children.map((t) => {
        const blockedBy = (t.dependencyTaskIds ?? [])
          .map((id) => tasksById.get(id))
          .filter((p): p is Task => !!p && p.status !== 'done')
        const freq = frequencyLabel(t)
        return (
          <div key={t.id} className="border border-hairline rounded-lg px-3 py-2 bg-night/40">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={t.status === 'done'}
                onChange={(e) => onUpdate(t.id, { status: e.target.checked ? 'done' : 'todo' })}
                className="accent-gold w-4 h-4"
              />
              <span
                className={`text-sm flex-1 min-w-0 truncate ${t.status === 'done' ? 'line-through text-moon-dim' : 'text-moon'}`}
              >
                {t.name}
              </span>
              {t.isGoal ? (
                <span className="text-[10px] uppercase tracking-wide text-moon-dim shrink-0">goal</span>
              ) : (
                t.estimatedMinutes != null && (
                  <span className="text-xs text-moon-dim shrink-0">{t.estimatedMinutes}m</span>
                )
              )}
              <EditButton onClick={() => setEditingTask(t)} label={depth === 0 ? 'Edit planet' : 'Edit moon'} />
            </div>

            {(t.taskType || freq || (t.tags ?? []).length > 0 || t.dueDate || blockedBy.length > 0) && (
              <div className="flex flex-wrap gap-1.5 mt-1.5 pl-[26px]">
                {t.taskType && (
                  <span className="text-[10px] uppercase tracking-wide border border-hairline rounded-full px-2 py-0.5 text-moon-dim">
                    {TYPE_BADGE[t.taskType]}
                    {freq ? ` · ${freq}` : ''}
                  </span>
                )}
                {t.dueDate && (
                  <span className="text-[10px] border border-hairline rounded-full px-2 py-0.5 text-moon-dim">
                    due {t.dueDate}
                  </span>
                )}
                {(t.tags ?? []).map((tag) => (
                  <span key={tag} className="text-[10px] border border-hairline rounded-full px-2 py-0.5 text-cosmic">
                    {tag}
                  </span>
                ))}
                {blockedBy.length > 0 && (
                  <span className="text-[10px] border border-hairline rounded-full px-2 py-0.5 text-gold-soft">
                    blocked by {blockedBy.map((b) => b.name).join(', ')}
                  </span>
                )}
              </div>
            )}

            <TaskList
              starId={starId}
              tasks={tasks}
              parentId={t.id}
              onUpdate={onUpdate}
              onDelete={onDelete}
              depth={depth + 1}
            />
          </div>
        )
      })}

      {editingTask && (
        <BottomSheet title={depth === 0 ? 'Edit planet' : 'Edit moon'} onClose={() => setEditingTask(null)}>
          <TaskForm
            initial={editingTask}
            isMoon={editingTask.parentTaskId != null}
            siblingTasks={tasks.filter((t) => t.starId === editingTask.starId && t.id !== editingTask.id)}
            tagSuggestions={allTags}
            onSave={(patch) => {
              onUpdate(editingTask.id, patch)
              setEditingTask(null)
            }}
            onCancel={() => setEditingTask(null)}
            onDelete={
              onDelete
                ? () => {
                    onDelete(editingTask.id)
                    setEditingTask(null)
                  }
                : undefined
            }
          />
        </BottomSheet>
      )}
    </div>
  )
}

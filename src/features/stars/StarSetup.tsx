import { useMemo, useState } from 'react'
import type { Star, Task } from '@/types'
import { BottomSheet } from '@/features/shared/BottomSheet'
import { TaskForm } from '@/features/tasks/TaskForm'

interface Props {
  star: Star
  tasks: Task[] // every planet/moon on this star, live
  onCreateTask: (input: Partial<Task> & { starId: string; name: string }) => void
  onClose: () => void
}

/** Flatten the star's task tree into an ordered list with depth, so a
 *  planet/moon can be chosen as the parent of the next one added. */
function flattenTasks(tasks: Task[]): { task: Task; depth: number }[] {
  const out: { task: Task; depth: number }[] = []
  const walk = (parentId: string | undefined, depth: number) => {
    tasks
      .filter((t) => (t.parentTaskId ?? undefined) === parentId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .forEach((t) => {
        out.push({ task: t, depth })
        walk(t.id, depth + 1)
      })
  }
  walk(undefined, 0)
  return out
}

/** Star setup: add planets and moons with every attribute (type/habit
 *  frequency, time, deadline, tags, suggestion-engine attributes,
 *  prerequisites) filled in at creation, and keep going without
 *  reopening anything. The chosen parent stays selected between adds so
 *  several moons can go under the same planet in a row. */
export function StarSetup({ star, tasks, onCreateTask, onClose }: Props) {
  const [parentId, setParentId] = useState<string>('')
  const [formKey, setFormKey] = useState(0)
  const [added, setAdded] = useState<{ id: number; name: string; isMoon: boolean }[]>([])

  const flat = useMemo(() => flattenTasks(tasks), [tasks])
  const allTags = useMemo(() => Array.from(new Set(tasks.flatMap((t) => t.tags ?? []))), [tasks])
  const isMoon = parentId !== ''

  return (
    <BottomSheet title={`Set up ${star.name}`} onClose={onClose}>
      <div className="space-y-4">
        <label className="text-sm block text-moon-dim">
          Add as
          <select
            className="mt-1 w-full border border-hairline bg-night rounded-lg px-3 py-2 text-sm text-moon"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">Planet (top level)</option>
            {flat.map(({ task, depth }) => (
              <option key={task.id} value={task.id}>
                {`${'\u00A0\u00A0'.repeat(depth)}Moon of: ${task.name}`}
              </option>
            ))}
          </select>
        </label>

        {added.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {added.map((a) => (
              <span
                key={a.id}
                className="text-xs border border-hairline rounded-full px-2.5 py-1 text-gold-soft"
              >
                ✓ {a.isMoon ? '↳ ' : ''}
                {a.name}
              </span>
            ))}
          </div>
        )}

        <TaskForm
          key={formKey}
          isMoon={isMoon}
          siblingTasks={tasks}
          tagSuggestions={allTags}
          saveLabel="Add & keep going"
          cancelLabel="Done"
          onCancel={onClose}
          onSave={(patch) => {
            onCreateTask({
              ...patch,
              starId: star.id,
              parentTaskId: parentId || undefined,
              name: patch.name ?? '',
            })
            setAdded((prev) => [...prev, { id: Date.now(), name: patch.name ?? '', isMoon }])
            setFormKey((k) => k + 1) // fresh, empty form for the next one
          }}
        />
      </div>
    </BottomSheet>
  )
}

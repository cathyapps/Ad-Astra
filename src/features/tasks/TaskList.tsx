import { useState } from 'react'
import type { Task } from '@/types'

interface Props {
  starId: string
  tasks: Task[]
  parentId?: string
  onCreate: (input: Partial<Task> & { starId: string; name: string }) => void
  onUpdate: (id: string, patch: Partial<Task>) => void
  depth?: number
}

export function TaskList({ starId, tasks, parentId, onCreate, onUpdate, depth = 0 }: Props) {
  const [newName, setNewName] = useState('')
  const [newMinutes, setNewMinutes] = useState('')
  const children = tasks
    .filter((t) => (t.parentTaskId ?? undefined) === parentId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  return (
    <div style={{ marginLeft: depth * 14 }} className="space-y-1.5">
      {children.map((t) => (
        <div key={t.id} className="border border-hairline rounded-lg px-3 py-2 bg-night/40">
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={t.status === 'done'}
              onChange={(e) => onUpdate(t.id, { status: e.target.checked ? 'done' : 'todo' })}
              className="accent-gold w-4 h-4"
            />
            <span
              className={`text-sm flex-1 ${t.status === 'done' ? 'line-through text-moon-dim' : 'text-moon'}`}
            >
              {t.name}
            </span>
            {t.estimatedMinutes != null && (
              <span className="text-xs text-moon-dim">{t.estimatedMinutes}m</span>
            )}
          </div>
          <TaskList
            starId={starId}
            tasks={tasks}
            parentId={t.id}
            onCreate={onCreate}
            onUpdate={onUpdate}
            depth={depth + 1}
          />
        </div>
      ))}

      <form
        className="flex gap-2 pt-1"
        onSubmit={(e) => {
          e.preventDefault()
          if (!newName.trim()) return
          onCreate({
            starId,
            parentTaskId: parentId,
            name: newName.trim(),
            estimatedMinutes: newMinutes ? Number(newMinutes) : undefined,
          })
          setNewName('')
          setNewMinutes('')
        }}
      >
        <input
          className="flex-1 border border-hairline bg-night rounded-lg px-2.5 py-1.5 text-sm text-moon placeholder:text-moon-dim/60"
          placeholder={depth === 0 ? 'Add a planet…' : 'Add a moon…'}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <input
          className="w-14 border border-hairline bg-night rounded-lg px-2 py-1.5 text-sm text-moon"
          placeholder="min"
          inputMode="numeric"
          value={newMinutes}
          onChange={(e) => setNewMinutes(e.target.value)}
        />
        <button
          type="submit"
          className="border border-hairline rounded-lg px-3 py-1.5 text-sm text-moon-dim hover:text-moon hover:bg-card-hover transition-colors"
        >
          Add
        </button>
      </form>
    </div>
  )
}

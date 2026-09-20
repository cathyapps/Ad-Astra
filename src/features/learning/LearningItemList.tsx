import { useState } from 'react'
import { LEARNING_STATUS_ORDER, type LearningItem, type LearningStatus } from '@/types/learning'
import { LEARNING_STATUS_LABELS } from './learningLabels'

interface Props {
  goalId: string
  items: LearningItem[]
  onCreate: (input: Partial<LearningItem> & { goalId: string; name: string }) => void
  onUpdate: (id: string, patch: Partial<LearningItem>) => void
  onDelete: (id: string) => void
}

const STATUS_DOT: Record<LearningStatus, string> = {
  planned: 'bg-cosmic',
  in_progress: 'bg-gold',
  completed: 'bg-moon-dim',
}

function nextStatus(status: LearningStatus): LearningStatus {
  const idx = LEARNING_STATUS_ORDER.indexOf(status)
  return LEARNING_STATUS_ORDER[(idx + 1) % LEARNING_STATUS_ORDER.length]
}

function StatusCycleButton({ item, onUpdate }: { item: LearningItem; onUpdate: Props['onUpdate'] }) {
  return (
    <button
      type="button"
      title="Cycle status"
      className="inline-flex items-center gap-1.5 text-xs border border-hairline rounded-full px-2 py-1 text-moon-dim hover:text-moon hover:bg-card-hover transition-colors shrink-0"
      onClick={() =>
        onUpdate(item.id, {
          status: nextStatus(item.status),
          completedAt: nextStatus(item.status) === 'completed' ? new Date().toISOString() : undefined,
        })
      }
    >
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[item.status]}`} />
      {LEARNING_STATUS_LABELS[item.status]}
    </button>
  )
}

function MoonRow({
  item,
  onUpdate,
  onDelete,
}: {
  item: LearningItem
  onUpdate: Props['onUpdate']
  onDelete: (id: string) => void
}) {
  return (
    <div className="border border-hairline rounded-lg px-3 py-2 bg-night/40 flex items-center gap-2.5 ml-5">
      <div className="flex-1">
        <input
          className="w-full bg-transparent text-sm text-moon focus:outline-none"
          value={item.name}
          onChange={(e) => onUpdate(item.id, { name: e.target.value })}
        />
        {item.notes && <div className="text-xs text-moon-dim">{item.notes}</div>}
      </div>
      <StatusCycleButton item={item} onUpdate={onUpdate} />
      <button
        className="text-xs text-moon-dim hover:text-red-400 transition-colors"
        onClick={() => onDelete(item.id)}
      >
        ✕
      </button>
    </div>
  )
}

/** A learning goal's sub-goals and tasks as Planets (top-level items) each
 *  with their own Moons nested within — completely free-form (no type),
 *  just a name, optional notes, and a planned/in_progress/completed
 *  status. Nesting depth is just "top-level" vs "nested" for this goal. */
export function LearningItemList({ goalId, items, onCreate, onUpdate, onDelete }: Props) {
  const [newName, setNewName] = useState('')
  const [addingMoonTo, setAddingMoonTo] = useState<string | null>(null)
  const [moonName, setMoonName] = useState('')
  const [notesOpenFor, setNotesOpenFor] = useState<string | null>(null)

  const planets = items.filter((i) => !i.parentItemId).sort((a, b) => a.sortIndex - b.sortIndex)
  const moonsOf = (planetId: string) =>
    items.filter((i) => i.parentItemId === planetId).sort((a, b) => a.sortIndex - b.sortIndex)

  return (
    <div className="space-y-3">
      {planets.map((planet) => (
        <div key={planet.id} className="space-y-1.5">
          <div className="border border-hairline rounded-lg px-3 py-2 bg-card flex items-center gap-2.5">
            <div className="flex-1">
              <input
                className="w-full bg-transparent text-sm text-moon font-medium focus:outline-none"
                value={planet.name}
                onChange={(e) => onUpdate(planet.id, { name: e.target.value })}
              />
              {planet.notes && <div className="text-xs text-moon-dim truncate">{planet.notes}</div>}
            </div>
            <StatusCycleButton item={planet} onUpdate={onUpdate} />
            <button
              className="text-xs text-moon-dim hover:text-moon transition-colors"
              onClick={() => setNotesOpenFor((cur) => (cur === planet.id ? null : planet.id))}
            >
              {notesOpenFor === planet.id ? 'Hide' : 'Notes'}
            </button>
            <button
              className="text-xs text-cosmic hover:text-moon transition-colors"
              onClick={() => setAddingMoonTo(planet.id)}
            >
              + Moon
            </button>
            <button
              className="text-xs text-moon-dim hover:text-red-400 transition-colors"
              onClick={() => onDelete(planet.id)}
            >
              ✕
            </button>
          </div>

          {notesOpenFor === planet.id && (
            <textarea
              className="ml-5 w-full border border-hairline bg-night rounded-lg px-2.5 py-1.5 text-sm text-moon placeholder:text-moon-dim/60"
              rows={2}
              placeholder="Notes…"
              value={planet.notes ?? ''}
              onChange={(e) => onUpdate(planet.id, { notes: e.target.value })}
            />
          )}

          {moonsOf(planet.id).map((moon) => (
            <MoonRow key={moon.id} item={moon} onUpdate={onUpdate} onDelete={onDelete} />
          ))}

          {addingMoonTo === planet.id && (
            <form
              className="flex gap-2 ml-5"
              onSubmit={(e) => {
                e.preventDefault()
                if (!moonName.trim()) return
                onCreate({ goalId, parentItemId: planet.id, name: moonName.trim() })
                setMoonName('')
                setAddingMoonTo(null)
              }}
            >
              <input
                autoFocus
                className="flex-1 border border-hairline bg-night rounded-lg px-2.5 py-1.5 text-sm text-moon placeholder:text-moon-dim/60"
                placeholder="Add a moon — a specific task or session…"
                value={moonName}
                onChange={(e) => setMoonName(e.target.value)}
              />
              <button
                type="submit"
                className="border border-hairline rounded-lg px-3 py-1.5 text-sm text-moon-dim hover:text-moon hover:bg-card-hover transition-colors"
              >
                Add
              </button>
            </form>
          )}
        </div>
      ))}

      <form
        className="flex gap-2 pt-1"
        onSubmit={(e) => {
          e.preventDefault()
          if (!newName.trim()) return
          onCreate({ goalId, name: newName.trim() })
          setNewName('')
        }}
      >
        <input
          className="flex-1 border border-hairline bg-night rounded-lg px-2.5 py-1.5 text-sm text-moon placeholder:text-moon-dim/60"
          placeholder="Add a planet — a sub-goal…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
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

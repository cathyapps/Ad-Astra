import { useState } from 'react'
import type { HabitFrequencyKind, Task, TaskType } from '@/types'
import { TagsField } from '@/features/shared/TagsField'
import { TaskAttributesSheet, type TaskAttributes } from './TaskAttributesSheet'

const inputClass =
  'mt-1 w-full border border-hairline bg-night rounded-lg px-3 py-2 text-sm text-moon placeholder:text-moon-dim/60'
const labelClass = 'text-sm block text-moon-dim'

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  habit: 'Habit (target frequency)',
  recurring: 'Recurring (no set cadence)',
  one_off: 'One-off (single task)',
}

const FREQUENCY_LABELS: Record<HabitFrequencyKind, string> = {
  daily: 'Daily',
  per_week: 'X times per week',
  per_month: 'X times per month',
}

function attributeSummary(a: TaskAttributes): string[] {
  const out: string[] = []
  if (a.activityType) out.push(a.activityType)
  if (a.requiredEnergy) out.push(a.requiredEnergy.replace(/_/g, ' ') + ' energy')
  if (a.requiredEffort) out.push(a.requiredEffort)
  out.push(...a.suitableLocations)
  out.push(...a.suitableDevices)
  return out
}

interface Props {
  initial?: Partial<Task>
  isMoon: boolean
  siblingTasks: Task[] // other Planets/Moons on the same Star, for prerequisite picking
  tagSuggestions: string[]
  onSave: (patch: Partial<Task>) => void
  onCancel: () => void
  onDelete?: () => void
}

export function TaskForm({ initial, isMoon, siblingTasks, tagSuggestions, onSave, onCancel, onDelete }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [isGoal, setIsGoal] = useState(initial?.isGoal ?? false)
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    initial?.estimatedMinutes != null ? String(initial.estimatedMinutes) : '',
  )
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '')
  const [taskType, setTaskType] = useState<TaskType>(initial?.taskType ?? 'one_off')
  const [frequencyKind, setFrequencyKind] = useState<HabitFrequencyKind>(
    initial?.habitFrequency?.kind ?? 'per_week',
  )
  const [frequencyCount, setFrequencyCount] = useState(
    initial?.habitFrequency?.count != null ? String(initial.habitFrequency.count) : '3',
  )
  const [tags, setTags] = useState<string[]>(initial?.tags ?? [])
  const [dependencyTaskIds, setDependencyTaskIds] = useState<string[]>(initial?.dependencyTaskIds ?? [])
  const [attributes, setAttributes] = useState<TaskAttributes>({
    activityType: initial?.activityType,
    suitableLocations: initial?.suitableLocations ?? [],
    suitableDevices: initial?.suitableDevices ?? [],
    requiredEffort: initial?.requiredEffort,
    requiredEnergy: initial?.requiredEnergy,
  })
  const [showAttributes, setShowAttributes] = useState(false)

  const otherTasks = siblingTasks.filter((t) => t.id !== initial?.id)

  function toggleDependency(id: string) {
    setDependencyTaskIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return
        onSave({
          name: name.trim(),
          description: description || undefined,
          isGoal,
          estimatedMinutes: isGoal ? undefined : estimatedMinutes ? Number(estimatedMinutes) : undefined,
          dueDate: dueDate || undefined,
          taskType,
          habitFrequency:
            taskType === 'habit'
              ? { kind: frequencyKind, count: frequencyKind === 'daily' ? undefined : Number(frequencyCount) || 1 }
              : undefined,
          tags,
          dependencyTaskIds,
          activityType: attributes.activityType,
          suitableLocations: attributes.suitableLocations.length ? attributes.suitableLocations : undefined,
          suitableDevices: attributes.suitableDevices.length ? attributes.suitableDevices : undefined,
          requiredEffort: attributes.requiredEffort,
          requiredEnergy: attributes.requiredEnergy,
        })
      }}
    >
      <div>
        <label className={labelClass}>{isMoon ? "What's the moon?" : "What's the planet?"}</label>
        <input
          autoFocus
          className={inputClass}
          placeholder={isMoon ? 'e.g. Book a lesson' : 'e.g. Learn scales'}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <label className={labelClass}>
        Notes
        <textarea className={inputClass} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>

      <label className="flex items-start gap-2.5 text-sm text-moon-dim">
        <input
          type="checkbox"
          checked={isGoal}
          onChange={(e) => setIsGoal(e.target.checked)}
          className="accent-gold w-4 h-4 mt-0.5"
        />
        <span>
          This is a goal, not a completable task — no time of its own (its sub-tasks carry the real time estimates,
          and it's left out of "what should I do now" suggestions).
        </span>
      </label>

      {!isGoal && (
        <div className="flex gap-3">
          <label className={`${labelClass} flex-1`}>
            Estimated minutes
            <input
              className={inputClass}
              inputMode="numeric"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
            />
          </label>
          <label className={`${labelClass} flex-1`}>
            Deadline
            <input type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
        </div>
      )}
      {isGoal && (
        <label className={labelClass}>
          Deadline
          <input type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>
      )}

      <label className={labelClass}>
        Type
        <select className={inputClass} value={taskType} onChange={(e) => setTaskType(e.target.value as TaskType)}>
          {(Object.keys(TASK_TYPE_LABELS) as TaskType[]).map((t) => (
            <option key={t} value={t}>
              {TASK_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </label>

      {taskType === 'habit' && (
        <div className="flex gap-3">
          <label className={`${labelClass} flex-1`}>
            Target frequency
            <select
              className={inputClass}
              value={frequencyKind}
              onChange={(e) => setFrequencyKind(e.target.value as HabitFrequencyKind)}
            >
              {(Object.keys(FREQUENCY_LABELS) as HabitFrequencyKind[]).map((f) => (
                <option key={f} value={f}>
                  {FREQUENCY_LABELS[f]}
                </option>
              ))}
            </select>
          </label>
          {frequencyKind !== 'daily' && (
            <label className={`${labelClass} w-24`}>
              Count
              <input
                className={inputClass}
                inputMode="numeric"
                value={frequencyCount}
                onChange={(e) => setFrequencyCount(e.target.value)}
              />
            </label>
          )}
        </div>
      )}

      <div>
        <span className={labelClass}>Tags</span>
        <div className="mt-1">
          <TagsField tags={tags} suggestions={tagSuggestions} onChange={setTags} />
        </div>
      </div>

      {!isGoal && (
        <div>
          <span className={labelClass}>Suggestion engine attributes</span>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {attributeSummary(attributes).map((a) => (
              <span key={a} className="text-xs border border-hairline rounded-full px-2.5 py-1 text-moon-dim capitalize">
                {a}
              </span>
            ))}
            <button
              type="button"
              className="text-xs text-cosmic hover:text-moon transition-colors"
              onClick={() => setShowAttributes(true)}
            >
              + Add attributes
            </button>
          </div>
          {showAttributes && (
            <TaskAttributesSheet
              value={attributes}
              onClose={() => setShowAttributes(false)}
              onSave={(next) => {
                setAttributes(next)
                setShowAttributes(false)
              }}
            />
          )}
        </div>
      )}

      {otherTasks.length > 0 && (
        <div>
          <span className={labelClass}>Must be completed first</span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {otherTasks.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleDependency(t.id)}
                className={`text-xs border rounded-full px-2.5 py-1 transition-colors ${
                  dependencyTaskIds.includes(t.id)
                    ? 'bg-cosmic text-night border-cosmic font-medium'
                    : 'border-hairline text-moon-dim hover:text-moon'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

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
      {onDelete && (
        <button
          type="button"
          className="text-xs text-moon-dim hover:text-red-400 transition-colors"
          onClick={onDelete}
        >
          Delete {isMoon ? 'moon' : 'planet'}
        </button>
      )}
    </form>
  )
}

import type { Star, Task } from '@/types'
import {
  activeHabits,
  addCompletion,
  habitKind,
  habitProgress,
  removeLatestCompletion,
} from '@/lib/habits'

interface Props {
  stars: Star[]
  tasks: Task[]
  onUpdateTask: (id: string, patch: Partial<Task>) => void
}

const PERIOD_WORD = { daily: 'today', per_week: 'this week', per_month: 'this month' } as const

function HabitRow({
  task,
  star,
  onUpdateTask,
}: {
  task: Task
  star: Star
  onUpdateTask: Props['onUpdateTask']
}) {
  const kind = habitKind(task)
  const { done, quota, complete } = habitProgress(task)

  // Daily: the box toggles today. Weekly/monthly: each tap logs one more
  // completion until the quota is met; tapping a finished habit undoes
  // the latest one.
  function toggle() {
    if (complete) onUpdateTask(task.id, { habitCompletions: removeLatestCompletion(task) })
    else onUpdateTask(task.id, { habitCompletions: addCompletion(task) })
  }

  return (
    <div
      className={`border border-hairline rounded-lg px-3 py-2 flex items-center gap-2.5 bg-card transition-opacity ${
        complete ? 'opacity-50' : ''
      }`}
    >
      <input
        type="checkbox"
        className="accent-gold w-4 h-4 shrink-0"
        checked={complete}
        onChange={toggle}
        aria-label={complete ? `Undo ${task.name}` : `Check off ${task.name}`}
      />
      <div className="flex-1 min-w-0">
        <div className={`text-sm text-moon truncate ${complete ? 'line-through text-moon-dim' : ''}`}>
          {task.name}
        </div>
        <div className="text-xs text-moon-dim truncate">{star.name}</div>
      </div>
      {kind !== 'daily' && (
        <div className="flex items-center gap-2 shrink-0">
          {!complete && done > 0 && (
            <button
              type="button"
              className="text-xs text-moon-dim hover:text-moon transition-colors"
              onClick={() => onUpdateTask(task.id, { habitCompletions: removeLatestCompletion(task) })}
            >
              Undo
            </button>
          )}
          <span className={`text-xs ${complete ? 'text-moon-dim' : 'text-gold'}`}>
            {Math.min(done, quota)}/{quota} {PERIOD_WORD[kind]}
          </span>
        </div>
      )}
    </div>
  )
}

export function CurrentHabits({ stars, tasks, onUpdateTask }: Props) {
  const habits = activeHabits(tasks, stars)
  const daily = habits.filter((h) => habitKind(h.task) === 'daily')
  const periodic = habits.filter((h) => habitKind(h.task) !== 'daily')

  // Unfinished habits first, finished ones (grayed and crossed off) after.
  const unfinishedFirst = (a: { task: Task }, b: { task: Task }) =>
    Number(habitProgress(a.task).complete) - Number(habitProgress(b.task).complete)

  const section = (title: string, rows: typeof habits) =>
    rows.length > 0 && (
      <div className="space-y-1.5">
        <h4 className="text-[11px] uppercase tracking-wide text-moon-dim">{title}</h4>
        {[...rows].sort(unfinishedFirst).map(({ task, star }) => (
          <HabitRow key={task.id} task={task} star={star} onUpdateTask={onUpdateTask} />
        ))}
      </div>
    )

  return (
    <div className="space-y-2.5">
      <h3 className="text-xs uppercase tracking-wide text-moon-dim">Current Habits ({habits.length})</h3>
      {habits.length === 0 ? (
        <p className="text-sm text-moon-dim">
          No habits yet — mark a Planet or Moon as a habit from its Star in the Universe tab.
        </p>
      ) : (
        <>
          {section('Daily', daily)}
          {section('Weekly / Monthly', periodic)}
        </>
      )}
    </div>
  )
}

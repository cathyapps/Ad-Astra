import type { HabitFrequencyKind, Star, Task } from '@/types'

/** First day of the week for weekly habits: 0 = Sunday, 1 = Monday. */
export const WEEK_STARTS_ON = 1

/** Completions older than this are dropped whenever a new one is logged,
 *  so the list can't grow forever. */
const KEEP_DAYS = 400

/** Local calendar date as YYYY-MM-DD (not UTC — "today" means the
 *  person's own day). */
export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Inclusive [start, end] date keys of the period containing `now`. */
export function periodBounds(kind: HabitFrequencyKind, now: Date = new Date()): { start: string; end: string } {
  if (kind === 'daily') {
    const k = dateKey(now)
    return { start: k, end: k }
  }
  if (kind === 'per_week') {
    const offset = (now.getDay() - WEEK_STARTS_ON + 7) % 7
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset)
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)
    return { start: dateKey(start), end: dateKey(end) }
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { start: dateKey(start), end: dateKey(end) }
}

export function habitKind(task: Task): HabitFrequencyKind {
  return task.habitFrequency?.kind ?? 'daily'
}

/** How many completions the habit needs in its period (daily = 1). */
export function habitQuota(task: Task): number {
  return habitKind(task) === 'daily' ? 1 : Math.max(1, task.habitFrequency?.count ?? 1)
}

export function completionsInPeriod(task: Task, now: Date = new Date()): string[] {
  const { start, end } = periodBounds(habitKind(task), now)
  return (task.habitCompletions ?? []).filter((k) => k >= start && k <= end).sort()
}

export function habitProgress(task: Task, now: Date = new Date()): { done: number; quota: number; complete: boolean } {
  const quota = habitQuota(task)
  const done = completionsInPeriod(task, now).length
  return { done, quota, complete: done >= quota }
}

/** New completions list with one more check-off for today. */
export function addCompletion(task: Task, now: Date = new Date()): string[] {
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - KEEP_DAYS)
  const keep = (task.habitCompletions ?? []).filter((k) => k >= dateKey(cutoff))
  return [...keep, dateKey(now)].sort()
}

/** New completions list with the most recent check-off in the current
 *  period removed (an "undo"). */
export function removeLatestCompletion(task: Task, now: Date = new Date()): string[] {
  const inPeriod = completionsInPeriod(task, now)
  const latest = inPeriod[inPeriod.length - 1]
  if (!latest) return task.habitCompletions ?? []
  const all = [...(task.habitCompletions ?? [])]
  const idx = all.lastIndexOf(latest)
  all.splice(idx, 1)
  return all
}

/** Habits to show on the Dashboard: every Planet/Moon marked as a habit,
 *  except retired ones (done), goal-only parents, and those on completed
 *  Stars. */
export function activeHabits(tasks: Task[], stars: Star[]): { task: Task; star: Star }[] {
  const starById = new Map(stars.map((s) => [s.id, s]))
  const out: { task: Task; star: Star }[] = []
  for (const task of tasks) {
    if (task.taskType !== 'habit' || task.isGoal || task.status === 'done') continue
    const star = starById.get(task.starId)
    if (!star || star.stage === 'completed') continue
    out.push({ task, star })
  }
  return out
}

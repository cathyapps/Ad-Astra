import type { ReadingSession } from '@/types/reading'

export function booksCompletedInRange(
  sessions: ReadingSession[],
  start: Date,
  end: Date,
): number {
  return sessions.filter((s) => {
    if (s.completionStatus !== 'completed') return false
    const d = new Date(s.date)
    return d >= start && d <= end
  }).length
}

export function pagesReadInRange(sessions: ReadingSession[], start: Date, end: Date): number {
  return sessions
    .filter((s) => {
      const d = new Date(s.date)
      return d >= start && d <= end
    })
    .reduce((sum, s) => sum + (s.pages ?? 0), 0)
}

/** Consecutive days up to today with at least one reading session logged. */
export function currentStreakDays(sessions: ReadingSession[], today: Date = new Date()): number {
  const days = new Set(sessions.map((s) => s.date.slice(0, 10)))
  let streak = 0
  const cursor = new Date(today)
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

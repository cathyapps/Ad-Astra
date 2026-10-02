import type { ViewingSession } from '@/types/watching'
import { addDays, appDayKey, appToday } from './appDate'

/** start / end are app-day keys (YYYY-MM-DD, inclusive). */
export function watchedCompletedInRange(sessions: ViewingSession[], start: string, end: string): number {
  return sessions.filter((s) => {
    if (s.completionStatus !== 'completed') return false
    const key = appDayKey(s.date)
    return key >= start && key <= end
  }).length
}

export function currentWatchStreakDays(sessions: ViewingSession[], today: Date = new Date()): number {
  const days = new Set(sessions.map((s) => appDayKey(s.date)))
  let streak = 0
  let cursor = appToday(today)
  while (days.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

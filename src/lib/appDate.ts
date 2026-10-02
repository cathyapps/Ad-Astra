// One place that decides what "day" a moment belongs to.
//
// The app runs on US Eastern time, and a new day starts at 3 AM Eastern
// (not midnight) — so a late-night reading session still counts toward the
// day it started. Day keys are plain "YYYY-MM-DD" strings, so comparing
// and sorting them never depends on the device's own time zone.

export const APP_TIME_ZONE = 'America/New_York'
/** Days roll over at this hour, Eastern time. */
export const DAY_ROLLOVER_HOUR = 3

const HOUR_MS = 3600000
// en-CA formats dates as YYYY-MM-DD.
const eastern = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

/** The app day (YYYY-MM-DD) a date / timestamp falls on.
 *  - Plain dates ("2026-09-29", e.g. reading-log days) are already days.
 *  - Timestamps stored at exactly 00:00:00 UTC are date-only values that
 *    were imported (not real moments), so they keep their calendar date.
 *  - Anything else is a real moment: converted to Eastern time, with the
 *    day starting at 3 AM. */
export function appDayKey(input: string | number | Date): string {
  if (typeof input === 'string') {
    if (DATE_ONLY.test(input)) return input
    const d = new Date(input)
    if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0) {
      return d.toISOString().slice(0, 10)
    }
    return eastern.format(new Date(d.getTime() - DAY_ROLLOVER_HOUR * HOUR_MS))
  }
  const ms = typeof input === 'number' ? input : input.getTime()
  return eastern.format(new Date(ms - DAY_ROLLOVER_HOUR * HOUR_MS))
}

/** Today's app day. */
export const appToday = (now: Date = new Date()): string => appDayKey(now)

const keyMs = (key: string): number => {
  const [y, m, d] = key.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

/** Move a day key by whole days (negative = earlier). */
export function addDays(key: string, days: number): string {
  return new Date(keyMs(key) + days * 86400000).toISOString().slice(0, 10)
}

/** Move a day key by whole years, keeping month and day. */
export function addYears(key: string, years: number): string {
  const d = new Date(keyMs(key))
  d.setUTCFullYear(d.getUTCFullYear() + years)
  return d.toISOString().slice(0, 10)
}

/** 0 = Sunday … 6 = Saturday. */
export const weekdayOf = (key: string): number => new Date(keyMs(key)).getUTCDay()

import type { AppSettings, Star } from '@/types'

export function getCurrentOrbitStars(stars: Star[]): Star[] {
  return stars.filter((s) => s.stage === 'current_orbit')
}

/**
 * Overload heuristic (spec §4: "the warning should adapt to the user's
 * actual progress when possible"). Phase 1 keeps this simple and cheap to
 * compute from Star fields alone — no activity-log dependency yet:
 *
 * A Star counts as "stalled" if it's been in Current Orbit more than 14
 * days with less than 10% progress. If at least half of the current
 * Current Orbit Stars are stalled, the user is treated as overloaded.
 *
 * This is intentionally coarse. It only decides which of the two warning
 * copy variants to show — it never blocks anything (§4: "a guardrail, not
 * a hard limit").
 */
export function isOverloaded(stars: Star[], now: Date = new Date()): boolean {
  const orbit = getCurrentOrbitStars(stars)
  if (orbit.length === 0) return false
  const stalled = orbit.filter((s) => {
    const enteredOrbit = new Date(s.updatedAt) // approximation until we log stage-entry timestamps
    const daysIn = (now.getTime() - enteredOrbit.getTime()) / (1000 * 60 * 60 * 24)
    return daysIn > 14 && s.progress < 10
  })
  return stalled.length / orbit.length >= 0.5
}

export type CapacityCheckResult =
  | { needsWarning: false }
  | { needsWarning: true; overloaded: boolean; message: string; orbit: Star[] }

export function checkCapacity(stars: Star[], settings: AppSettings): CapacityCheckResult {
  const orbit = getCurrentOrbitStars(stars)
  if (orbit.length < settings.currentOrbitLimit) {
    return { needsWarning: false }
  }
  const overloaded = isOverloaded(stars)
  const message = overloaded
    ? "You're struggling to keep up with your current orbit. Are you sure you want to add another star?"
    : `You already have the maximum recommended limit of ${settings.currentOrbitLimit} Stars in your orbit. Are you sure you want to add another one?`
  return { needsWarning: true, overloaded, message, orbit }
}

export type CapacityChoice = 'abort' | 'override' | 'replace'

/**
 * Applies the user's choice from the capacity warning (spec §4). Returns
 * the patches to apply; callers commit them via the store. `replace`
 * intentionally only changes `stage` on the outgoing star — every task,
 * milestone, progress value, and note is left untouched, satisfying the
 * "moving a Star back to Planning should not delete its work" rule.
 */
export function resolveCapacityChoice(
  choice: CapacityChoice,
  incomingStarId: string,
  outgoingStarId?: string,
): { starId: string; stage: Star['stage'] }[] {
  switch (choice) {
    case 'abort':
      return []
    case 'override':
      return [{ starId: incomingStarId, stage: 'current_orbit' }]
    case 'replace':
      if (!outgoingStarId) {
        throw new Error('replace requires an outgoing star to move back to on_the_horizon')
      }
      return [
        { starId: outgoingStarId, stage: 'on_the_horizon' },
        { starId: incomingStarId, stage: 'current_orbit' },
      ]
  }
}

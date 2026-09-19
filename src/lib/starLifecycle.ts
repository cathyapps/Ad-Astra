import type { Star, StarStage } from '@/types'

// Someday -> On the Horizon -> Planning -> Current Orbit -> Completed -> Archived
// (spec §3). Forward moves follow that order one step at a time. Backward
// moves are allowed from most stages (the user is always in control, §4),
// and any active stage can be archived directly. Completed can be reopened
// back to Current Orbit if the user changes their mind.
const FORWARD: Partial<Record<StarStage, StarStage>> = {
  someday: 'on_the_horizon',
  on_the_horizon: 'planning',
  planning: 'current_orbit',
  current_orbit: 'completed',
}

const ALLOWED_TRANSITIONS: Record<StarStage, StarStage[]> = {
  someday: ['on_the_horizon', 'archived'],
  on_the_horizon: ['someday', 'planning', 'archived'],
  planning: ['on_the_horizon', 'current_orbit', 'archived'],
  current_orbit: ['planning', 'on_the_horizon', 'completed', 'archived'],
  completed: ['current_orbit', 'archived'],
  archived: ['someday', 'on_the_horizon', 'planning'], // unarchiving restores to an active stage
}

export function canTransition(from: StarStage, to: StarStage): boolean {
  if (from === to) return true
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

export function nextForwardStage(stage: StarStage): StarStage | undefined {
  return FORWARD[stage]
}

export interface StageRequirement {
  field: keyof Star
  label: string
}

// What each stage expects to be filled in before a Star is considered
// "ready" there. Nothing here blocks the transition — the spec is explicit
// that lower stages require minimal info and the user is never forced to
// plan ahead of themselves. This only powers soft UI nudges (e.g. "add a
// next step" prompts), never a hard gate.
export function suggestedFieldsForStage(stage: StarStage): StageRequirement[] {
  switch (stage) {
    case 'someday':
      return [{ field: 'name', label: 'Name' }]
    case 'on_the_horizon':
      return [
        { field: 'desiredTimeframe', label: 'Desired timeframe' },
        { field: 'roughRequirements', label: 'Rough requirements' },
      ]
    case 'planning':
      return [
        { field: 'desiredOutcome', label: 'Desired outcome' },
        { field: 'estimatedEffort', label: 'Estimated effort' },
      ]
    case 'current_orbit':
      return [{ field: 'progress', label: 'Progress' }]
    case 'completed':
      return [{ field: 'completionDate', label: 'Completion date' }]
    case 'archived':
      return []
  }
}

export interface TransitionResult {
  star: Star
  /** True when this transition just entered current_orbit — caller should
   *  run the capacity check (see currentOrbit.ts) before committing. */
  entersCurrentOrbit: boolean
  /** True when this transition just left current_orbit. */
  leavesCurrentOrbit: boolean
}

export function planTransition(star: Star, to: StarStage): TransitionResult {
  if (!canTransition(star.stage, to)) {
    throw new Error(`Cannot move a Star from ${star.stage} to ${to}`)
  }
  const patch: Partial<Star> = { stage: to }
  if (to === 'completed' && !star.completionDate) {
    patch.completionDate = new Date().toISOString()
    patch.progress = 100
  }
  if (to === 'archived') {
    patch.archivedAt = new Date().toISOString()
  }
  return {
    star: { ...star, ...patch },
    entersCurrentOrbit: to === 'current_orbit' && star.stage !== 'current_orbit',
    leavesCurrentOrbit: star.stage === 'current_orbit' && to !== 'current_orbit',
  }
}

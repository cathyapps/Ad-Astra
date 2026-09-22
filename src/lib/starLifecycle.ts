import { STAR_STAGE_ORDER } from '@/types'
import type { Star, StarStage } from '@/types'

// Someday -> On the Horizon -> Current Orbit -> Completed. Forward moves
// go one step at a time. Backward moves are always allowed, to any
// earlier stage — the user is always in control and can revert a Star
// to a previous stage whenever they want. Completed can be reopened
// back to Current Orbit (or further back) if the user changes their mind.
const FORWARD: Partial<Record<StarStage, StarStage>> = {
  someday: 'on_the_horizon',
  on_the_horizon: 'current_orbit',
  current_orbit: 'completed',
}

export function canTransition(from: StarStage, to: StarStage): boolean {
  if (from === to) return true
  if (FORWARD[from] === to) return true
  // Any earlier stage in the order is a valid "revert back" target.
  return STAR_STAGE_ORDER.indexOf(to) < STAR_STAGE_ORDER.indexOf(from)
}

export function nextForwardStage(stage: StarStage): StarStage | undefined {
  return FORWARD[stage]
}

export interface StageRequirement {
  field: keyof Star
  label: string
}

// What each stage expects to be filled in before a Star is considered
// "ready" there. Nothing here blocks the transition — the user is never
// forced to plan ahead of themselves. This only powers soft UI nudges
// (e.g. "add a next step" prompts), never a hard gate.
export function suggestedFieldsForStage(stage: StarStage): StageRequirement[] {
  switch (stage) {
    case 'someday':
      return [{ field: 'name', label: 'Name' }]
    case 'on_the_horizon':
      return [
        { field: 'desiredTimeframe', label: 'Desired timeframe' },
        { field: 'roughRequirements', label: 'Rough requirements' },
      ]
    case 'current_orbit':
      return [
        { field: 'desiredOutcome', label: 'Desired outcome' },
        { field: 'estimatedEffort', label: 'Estimated effort' },
        { field: 'progress', label: 'Progress' },
      ]
    case 'completed':
      return [{ field: 'completionDate', label: 'Completion date' }]
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
  return {
    star: { ...star, ...patch },
    entersCurrentOrbit: to === 'current_orbit' && star.stage !== 'current_orbit',
    leavesCurrentOrbit: star.stage === 'current_orbit' && to !== 'current_orbit',
  }
}

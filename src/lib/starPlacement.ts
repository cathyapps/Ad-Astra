import type { Constellation, Star } from '@/types'

// A tiny deterministic string hash -> [0,1). Deterministic (not
// Math.random()) so a Star's position on the map is stable across
// re-renders and reloads instead of jumping around every time the
// component re-mounts, while still looking scattered rather than
// laid out on a grid or a circle.
function hash01(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  // fold to [0,1)
  return ((h >>> 0) % 100000) / 100000
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

export interface StarPoint {
  star: Star
  x: number // 0..1 of canvas
  y: number
  size: number
  opacity: number
}

// Visual weight by lifecycle stage — faint and small far out, brighter
// and bigger as a Star gets closer to being actively pursued. Completed
// Stars are dropped by the caller before this ever sees them.
const STAGE_VISUAL: Record<Exclude<Star['stage'], 'completed'>, { size: number; opacity: number }> = {
  someday: { size: 1.6, opacity: 0.32 },
  on_the_horizon: { size: 2.6, opacity: 0.6 },
  current_orbit: { size: 4.2, opacity: 1 },
}

/**
 * Places every non-completed Star on the map. Stars that belong to a
 * Constellation are scattered in a loose cluster around a (stable,
 * per-constellation) random center, so the connecting lines drawn
 * between them read like an actual constellation shape rather than a
 * spoke-and-hub diagram. Unaffiliated Stars are scattered across the
 * whole canvas. Margins keep everything within the visible circle.
 */
export function placeStars(stars: Star[], constellations: Constellation[]): StarPoint[] {
  const visible = stars.filter((s) => s.stage !== 'completed')

  const firstConstellationOf = new Map<string, string>()
  for (const c of constellations) {
    for (const id of c.starIds) {
      if (!firstConstellationOf.has(id)) firstConstellationOf.set(id, c.id)
    }
  }

  const clusterCenters = new Map<string, { x: number; y: number }>()
  for (const c of constellations) {
    clusterCenters.set(c.id, {
      x: 0.22 + hash01(c.id + ':cx') * 0.56,
      y: 0.22 + hash01(c.id + ':cy') * 0.56,
    })
  }

  return visible.map((star) => {
    const clusterId = firstConstellationOf.get(star.id)
    const cluster = clusterId ? clusterCenters.get(clusterId) : undefined
    let x: number
    let y: number
    if (cluster) {
      x = clamp(cluster.x + (hash01(star.id + ':jx') - 0.5) * 0.26, 0.06, 0.94)
      y = clamp(cluster.y + (hash01(star.id + ':jy') - 0.5) * 0.26, 0.06, 0.94)
    } else {
      x = 0.05 + hash01(star.id + ':x') * 0.9
      y = 0.05 + hash01(star.id + ':y') * 0.9
    }
    const visual = STAGE_VISUAL[star.stage as Exclude<Star['stage'], 'completed'>] ?? STAGE_VISUAL.someday
    return { star, x, y, ...visual }
  })
}

import type { Constellation } from '@/types'

// Line colors for the Universe map, one per Constellation. Chosen to read
// clearly on the dark sky and to avoid the gold used for Current Orbit
// stars. With more constellations than colors the palette repeats.
export const CONSTELLATION_PALETTE = [
  '#6E9CFF', // blue
  '#FF7A7A', // coral
  '#6EE7A8', // mint
  '#B98BFF', // violet
  '#4FD6E8', // cyan
  '#FF8AD1', // pink
  '#C7E05A', // lime
]

/** Stable color for a constellation: its position when all constellations
 *  are ordered by creation date, so colors don't reshuffle when the list
 *  is re-sorted elsewhere (they only shift if an earlier one is deleted). */
export function constellationColor(constellations: Constellation[], id: string): string {
  const ordered = [...constellations].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  )
  const idx = Math.max(0, ordered.findIndex((c) => c.id === id))
  return CONSTELLATION_PALETTE[idx % CONSTELLATION_PALETTE.length]
}

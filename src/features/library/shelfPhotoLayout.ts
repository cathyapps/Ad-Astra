export interface ShelfSlot {
  /** Left edge of the slot, as % of the shelf photo's width. */
  left: number
  /** Slot width, as % of the shelf photo's width. */
  width: number
}

export interface ShelfPhotoConfig {
  imageSrc: string
  /** Natural width / height of the source photo, so the container can be
   *  sized with `aspect-ratio` and stay pixel-accurate at any width. */
  aspectRatio: number
  slots: ShelfSlot[]
  /** Where the shelf floor sits, as % up from the photo's bottom edge —
   *  covers are anchored here with `bottom: <this>%` so they read as
   *  standing on the shelf rather than floating over it. */
  floorFromBottomPct: number
}

/** A cover at a 2:3 ratio, `slot.width` wide, would stand this tall (as %
 *  of the container's height) if it filled the slot's full vertical
 *  budget — i.e. reached as high as the books in the source photo do.
 *  Used both to size a full-height cover and, when shrinking a cover via
 *  `coverScale`, to know how much vertical room is freed up above it. */
export function fullCoverHeightPct(config: ShelfPhotoConfig, slot: ShelfSlot): number {
  return slot.width * 1.5 * config.aspectRatio
}

// Measured directly from the two source photos: the bookend spines on
// each side mark the empty "slot" zone, and the brass trim on the lower
// shelf plank marks the floor line. Keeping these as measured percentages
// (rather than fixed pixels) means the layout stays correct at any
// rendered size, since the container's aspect-ratio always matches the
// photo's true proportions.

export const MAIN_SHELF: ShelfPhotoConfig = {
  imageSrc: '/library/main-shelf.jpg',
  aspectRatio: 2043 / 770,
  floorFromBottomPct: 16.8,
  slots: [
    { left: 22, width: 19.3333 },
    { left: 44.3333, width: 19.3333 },
    { left: 66.6667, width: 19.3333 },
  ],
}

export const NEXT_READS_SHELF: ShelfPhotoConfig = {
  imageSrc: '/library/next-reads-shelf.jpg',
  aspectRatio: 2243 / 701,
  floorFromBottomPct: 16.7,
  slots: [
    { left: 30, width: 12.625 },
    { left: 45.125, width: 12.625 },
    { left: 60.25, width: 12.625 },
    { left: 75.375, width: 12.625 },
  ],
}

/** Derives caption-row grid columns (leading spacer, slot, gap, slot,
 *  gap, ..., trailing spacer) from a shelf's slots, so caption text below
 *  the photo lines up under the cover sitting above it without
 *  duplicating the slot math in two places. */
export function captionColumns(config: ShelfPhotoConfig): string {
  const cols: number[] = [config.slots[0].left]
  for (let i = 0; i < config.slots.length; i++) {
    cols.push(config.slots[i].width)
    const next = config.slots[i + 1]
    if (next) cols.push(next.left - (config.slots[i].left + config.slots[i].width))
  }
  const last = config.slots[config.slots.length - 1]
  cols.push(100 - (last.left + last.width))
  return cols.map((c) => `${c}%`).join(' ')
}

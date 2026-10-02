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

// All main-shelf photos are cut from the same generated artwork and share
// one size, one shelf height and one "feet" line, so rows stack seamlessly
// and covers look identical whichever photo is behind them.
//   - Photos are 1600x616 (aspect ~2.597), the same for every row.
//   - Book feet (the built-in end books' base, and so the covers') sit
//     20.5% up from the bottom edge: on the shelf surface, set back from
//     the front lip rather than hanging over it.
//   - Slot width gives covers the same height as the built-in end books.
const MAIN_SHELF_ASPECT = 1600 / 616
const MAIN_SHELF_FLOOR_PCT = 20.5
const MAIN_SLOT_WIDTH = 17.45

const mainSlots = (left: number, gap = 2.41): ShelfSlot[] => [
  { left, width: MAIN_SLOT_WIDTH },
  { left: left + MAIN_SLOT_WIDTH + gap, width: MAIN_SLOT_WIDTH },
  { left: left + 2 * (MAIN_SLOT_WIDTH + gap), width: MAIN_SLOT_WIDTH },
]

const mainShelf = (imageSrc: string, left: number): ShelfPhotoConfig => ({
  imageSrc,
  aspectRatio: MAIN_SHELF_ASPECT,
  floorFromBottomPct: MAIN_SHELF_FLOOR_PCT,
  slots: mainSlots(left),
})

/** Lamp on the left. */
export const MAIN_SHELF = mainShelf('/library/main-shelf.jpg', 23.91)

/** Lamp mirrored to the right. */
export const MAIN_SHELF_LAMP_RIGHT = mainShelf('/library/main-shelf-lamp-right.jpg', 18.92)

/** Four no-lamp bays (bookends on both sides), each with different books. */
const NO_LAMP_BAYS: ShelfPhotoConfig[] = [
  mainShelf('/library/main-shelf-nolamp.jpg', 22.91),
  mainShelf('/library/main-shelf-nolamp-2.jpg', 22.91),
  mainShelf('/library/main-shelf-nolamp-3.jpg', 22.91),
  mainShelf('/library/main-shelf-nolamp-4.jpg', 22.91),
]
export const MAIN_SHELF_NO_LAMP = NO_LAMP_BAYS[0]

/** Shelf photo rotation for the main library: lamp left, bay 1, bay 2,
 *  lamp right, bay 1, bay 2, then repeat. (Bays 3 and 4 are cut and
 *  ready if you want more variety later.) */
const MAIN_SHELF_ROTATION: ShelfPhotoConfig[] = [
  MAIN_SHELF,
  NO_LAMP_BAYS[0],
  NO_LAMP_BAYS[1],
  MAIN_SHELF_LAMP_RIGHT,
  NO_LAMP_BAYS[0],
  NO_LAMP_BAYS[1],
]

export function mainShelfForRow(rowIndex: number): ShelfPhotoConfig {
  return MAIN_SHELF_ROTATION[rowIndex % MAIN_SHELF_ROTATION.length]
}

// Covers are spread evenly across the empty span between the lamp-side
// books (~16.8% from the left) and the right-hand bookends (~87%), rather
// than bunched against the right with a gap on the left.
const NEXT_READS_COUNT = 5
const NEXT_READS_SLOT_WIDTH = 12.625
const NEXT_READS_SPAN_START = 16.8
const NEXT_READS_SPAN_END = 87
const NEXT_READS_GAP =
  (NEXT_READS_SPAN_END - NEXT_READS_SPAN_START - NEXT_READS_COUNT * NEXT_READS_SLOT_WIDTH) / (NEXT_READS_COUNT + 1)

export const NEXT_READS_SHELF: ShelfPhotoConfig = {
  imageSrc: '/library/next-reads-shelf.jpg',
  aspectRatio: 2243 / 701,
  floorFromBottomPct: 16.7,
  slots: Array.from({ length: NEXT_READS_COUNT }, (_, i) => ({
    left: NEXT_READS_SPAN_START + NEXT_READS_GAP + i * (NEXT_READS_SLOT_WIDTH + NEXT_READS_GAP),
    width: NEXT_READS_SLOT_WIDTH,
  })),
}

export const NEXT_READS_COUNT_PER_SHELF = NEXT_READS_COUNT

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

/** A photographed shelf of blank book spines that get text labels laid
 *  over them (rather than covers dropped into empty slots). */
export interface SpineShelfConfig {
  imageSrc: string
  aspectRatio: number
  slots: ShelfSlot[]
  /** Top edge and height of the spines, as % of the photo's height. */
  topPct: number
  heightPct: number
  /** Where the printed label may sit, as % of the spine's own height from
   *  its top / bottom — keeps text clear of the gold-leaf bands. */
  labelInsetTopPct: number
  labelInsetBottomPct: number
  /** Slot indexes whose spine is light enough to need dark label text. */
  darkTextSlots: number[]
}

// Measured from the 1891x831 gold-leaf source photo: left/right pixel
// edges of each of the ten spines, and where their tops and bottoms fall.
// The gold-leaf bands sit at roughly y 120-160 and y 604-645.
const CAT_W = 1891
const CAT_H = 831
const CAT_LEFT = [235, 383, 533, 680, 823, 970, 1116, 1262, 1410, 1553]
const CAT_RIGHT = [362, 520, 663, 806, 950, 1098, 1245, 1393, 1537, 1680]
const CAT_TOP = 110
const CAT_BOTTOM = 650

export const CATEGORY_SHELF: SpineShelfConfig = {
  imageSrc: '/library/category-shelf-gold.jpg',
  aspectRatio: CAT_W / CAT_H,
  slots: CAT_LEFT.map((l, i) => ({
    left: (l / CAT_W) * 100,
    width: ((CAT_RIGHT[i] - l) / CAT_W) * 100,
  })),
  topPct: (CAT_TOP / CAT_H) * 100,
  heightPct: ((CAT_BOTTOM - CAT_TOP) / CAT_H) * 100,
  labelInsetTopPct: ((170 - CAT_TOP) / (CAT_BOTTOM - CAT_TOP)) * 100,
  labelInsetBottomPct: ((CAT_BOTTOM - 594) / (CAT_BOTTOM - CAT_TOP)) * 100,
  darkTextSlots: [4], // the mustard spine
}

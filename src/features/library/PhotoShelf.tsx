import type { ReactNode } from 'react'
import type { ShelfPhotoConfig } from './shelfPhotoLayout'
import { captionColumns, fullCoverHeightPct } from './shelfPhotoLayout'

interface Props {
  config: ShelfPhotoConfig
  /** One entry per slot in config.slots, in order. Pass null/undefined
   *  for an empty slot (bookend shows through, nothing rendered there). */
  covers: (ReactNode | null)[]
  /** Shrinks each cover to this fraction of the slot's full vertical
   *  budget (1 = fills the slot, matching the flanking books' height).
   *  Use with `topOverlay` to free up room above the cover — e.g. for a
   *  progress bar — without the cover crowding the shelf's top trim. */
  coverScale?: number
  /** Rendered directly above each (shrunk) cover, inside the photo
   *  itself, in the band `coverScale` freed up. Ignored where the
   *  corresponding `covers` entry is null. */
  topOverlay?: (ReactNode | null)[]
  /** Optional caption row below the photo, x-aligned to each slot. Most
   *  shelves don't need this — the title already reads on the cover
   *  art (or its fallback tile) — but it's here for cases that do. */
  captions?: (ReactNode | null)[]
}

/** A photographed bookshelf with book covers dropped into its empty
 *  slots — the bookend spines printed into the photo itself do the rest
 *  of the "looks like a real shelf" work. */
export function PhotoShelf({ config, covers, coverScale = 1, topOverlay, captions }: Props) {
  return (
    <div>
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: config.aspectRatio,
          backgroundImage: `url(${config.imageSrc})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {config.slots.map((slot, i) => {
          if (!covers[i]) return null
          const fullHeight = fullCoverHeightPct(config, slot)
          const coverHeight = fullHeight * coverScale
          const coverWidth = slot.width * coverScale
          const coverLeft = slot.left + (slot.width - coverWidth) / 2
          const gap = fullHeight * 0.03
          const overlayBottom = config.floorFromBottomPct + coverHeight + gap
          const overlayHeight = fullHeight * (1 - coverScale) - gap * 2

          return (
            <div key={i}>
              <div
                className="absolute"
                style={{
                  left: `${coverLeft}%`,
                  width: `${coverWidth}%`,
                  height: `${coverHeight}%`,
                  bottom: `${config.floorFromBottomPct}%`,
                }}
              >
                {covers[i]}
              </div>
              {coverScale < 1 && topOverlay?.[i] && (
                <div
                  className="absolute flex flex-col justify-end"
                  style={{
                    left: `${slot.left}%`,
                    width: `${slot.width}%`,
                    height: `${overlayHeight}%`,
                    bottom: `${overlayBottom}%`,
                  }}
                >
                  {topOverlay[i]}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {captions && (
        <div className="grid mt-1.5" style={{ gridTemplateColumns: captionColumns(config) }}>
          {(() => {
            const cells: ReactNode[] = [<div key="lead-spacer" />]
            config.slots.forEach((_, i) => {
              cells.push(
                <div key={`cap-${i}`} className="px-0.5">
                  {captions[i]}
                </div>,
              )
              cells.push(<div key={`gap-${i}`} />)
            })
            return cells
          })()}
        </div>
      )}
    </div>
  )
}

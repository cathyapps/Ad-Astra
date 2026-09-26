import type { ReactNode } from 'react'
import type { ShelfPhotoConfig } from './shelfPhotoLayout'
import { captionColumns } from './shelfPhotoLayout'

interface Props {
  config: ShelfPhotoConfig
  /** One entry per slot in config.slots, in order. Pass null/undefined
   *  for an empty slot (bookend shows through, nothing rendered there). */
  covers: (ReactNode | null)[]
  /** Caption content per slot (title, progress bar, etc.), same length
   *  and order as `covers`. Rendered below the photo, x-aligned to the
   *  cover above it via the same slot geometry. */
  captions: (ReactNode | null)[]
}

/** A photographed bookshelf with book covers dropped into its empty
 *  slots — the bookend spines printed into the photo itself do the rest
 *  of the "looks like a real shelf" work. Captions render in a separate
 *  row below, using the same slot geometry so they line up underneath. */
export function PhotoShelf({ config, covers, captions }: Props) {
  const gridCols = captionColumns(config)
  const captionCells: ReactNode[] = [<div key="lead-spacer" />]
  config.slots.forEach((_, i) => {
    captionCells.push(
      <div key={`cap-${i}`} className="px-0.5">
        {captions[i]}
      </div>,
    )
    captionCells.push(<div key={`gap-${i}`} />)
  })

  return (
    <div>
      <div
        className="relative w-full rounded-sm overflow-hidden"
        style={{
          aspectRatio: config.aspectRatio,
          backgroundImage: `url(${config.imageSrc})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {config.slots.map((slot, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${slot.left}%`,
              width: `${slot.width}%`,
              bottom: `${config.floorFromBottomPct}%`,
              aspectRatio: '2 / 3',
            }}
          >
            {covers[i]}
          </div>
        ))}
      </div>
      <div className="grid mt-1.5" style={{ gridTemplateColumns: gridCols }}>
        {captionCells}
      </div>
    </div>
  )
}

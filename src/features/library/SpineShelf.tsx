import type { SpineShelfConfig } from './shelfPhotoLayout'

interface Props {
  config: SpineShelfConfig
  labels: string[]
  activeLabel: string | null
  onSelect: (label: string) => void
}

/** One shelf of blank book spines with a category name printed
 *  vertically on each, like reading spines on a real shelf. Tapping a
 *  spine selects that category. Label size is in container-query units so
 *  the text scales with the photo instead of overflowing on small screens. */
export function SpineShelf({ config, labels, activeLabel, onSelect }: Props) {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        aspectRatio: config.aspectRatio,
        backgroundImage: `url(${config.imageSrc})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        containerType: 'inline-size',
      }}
    >
      {config.slots.map((slot, i) => {
        const label = labels[i]
        if (!label) return null
        const active = activeLabel === label
        const dark = config.darkTextSlots.includes(i)
        return (
          <button
            key={label}
            type="button"
            aria-pressed={active}
            aria-label={label}
            onClick={() => onSelect(label)}
            className={`absolute flex items-center justify-center overflow-hidden transition-colors ${
              active ? 'ring-2 ring-gold bg-white/15' : 'hover:bg-white/10'
            }`}
            style={{
              left: `${slot.left}%`,
              width: `${slot.width}%`,
              top: `${config.topPct}%`,
              height: `${config.heightPct}%`,
            }}
          >
            <span
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                fontSize: '2.2cqw',
                whiteSpace: 'nowrap',
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: dark ? '#2b1a0a' : '#f1e4d0',
                textShadow: dark ? 'none' : '0 1px 2px rgba(0,0,0,0.7)',
              }}
            >
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

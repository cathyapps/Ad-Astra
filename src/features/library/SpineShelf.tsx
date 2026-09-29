import type { SpineShelfConfig } from './shelfPhotoLayout'

interface Props {
  config: SpineShelfConfig
  labels: string[]
  activeLabel: string | null
  onSelect: (label: string) => void
}

/** One shelf of book spines with a category name printed vertically on
 *  each, like reading spines on a real shelf. Tapping a spine selects that
 *  category. Label size is in container-query units so the text scales
 *  with the photo instead of overflowing on small screens, and longer
 *  names shrink to stay between the spine's gold-leaf bands. */
const MAX_LABEL_CQW = 2.2
// Rough width of one serif character in em (incl. letter-spacing), used
// to fit a label into the space between the gold bands.
const CHAR_EM = 0.66
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
        // Spine label zone, in cqw (same unit as the font size).
        const spineHeightCqw = config.heightPct / config.aspectRatio
        const labelZoneCqw =
          (spineHeightCqw * (100 - config.labelInsetTopPct - config.labelInsetBottomPct)) / 100
        const fontCqw = Math.min(MAX_LABEL_CQW, labelZoneCqw / (CHAR_EM * label.length))
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
            {/* Absolute offsets (unlike padding) are relative to the
                spine's height, keeping the label between the gold bands. */}
            <span
              className="absolute inset-x-0 flex items-center justify-center"
              style={{ top: `${config.labelInsetTopPct}%`, bottom: `${config.labelInsetBottomPct}%` }}
            >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                fontSize: `${fontCqw}cqw`,
                whiteSpace: 'nowrap',
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: dark ? '#2b1a0a' : '#f1e4d0',
                textShadow: dark ? 'none' : '0 1px 2px rgba(0,0,0,0.7)',
              }}
            >
              {label}
            </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

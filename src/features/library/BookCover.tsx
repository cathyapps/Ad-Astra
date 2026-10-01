import { useState } from 'react'

const FALLBACK_TONES = [
  'bg-cosmic/25 border-cosmic/40',
  'bg-gold/15 border-gold/40',
  'bg-moon-dim/15 border-moon-dim/30',
]

interface Props {
  title: string
  coverUrl?: string
  /** Used to pick a stable fallback tone when there's no cover image. */
  seed?: string
  size?: 'xs' | 'sm' | 'md'
}

function toneFor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i)) % FALLBACK_TONES.length
  return FALLBACK_TONES[h]
}

/** A single book cover for the shelf views. Real cover art when we have
 *  it; otherwise a plain tinted "spine" card with the title, so an
 *  un-covered book still reads clearly on a crowded shelf. Also covers
 *  two Open Library failure modes that aren't a normal broken-image
 *  error: a 404, and a "no cover on file" response that's actually a
 *  tiny 1x1 placeholder image loading "successfully" — caught via
 *  naturalWidth on load. Either way we fall back to the tinted tile
 *  rather than showing a broken-image icon or a blank stretched pixel. */
export function BookCover({ title, coverUrl, seed, size = 'md' }: Props) {
  // Failure state is remembered per URL. (It used to be a plain boolean, so
  // once one cover failed, whichever book later took over that shelf slot
  // — after a filter, search or reorder — inherited the failure and showed
  // the fallback tile even though its own image was fine.)
  const [status, setStatus] = useState<{ url?: string; retries: number; failed: boolean }>({
    url: coverUrl,
    retries: 0,
    failed: false,
  })
  const current = status.url === coverUrl ? status : { url: coverUrl, retries: 0, failed: false }
  const dims = size === 'xs' ? 'w-9 h-[54px]' : size === 'sm' ? 'w-14 h-20' : 'w-full aspect-[2/3]'

  // A shelf can ask Open Library for hundreds of covers at once and get
  // throttled; retry a couple of times, spaced out, before giving up.
  const canRetry = !!coverUrl && !coverUrl.startsWith('data:') && current.retries < 2
  const src =
    coverUrl && current.retries > 0 && !coverUrl.startsWith('data:')
      ? `${coverUrl}${coverUrl.includes('?') ? '&' : '?'}retry=${current.retries}`
      : coverUrl

  if (coverUrl && !current.failed) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => {
          if (canRetry) {
            window.setTimeout(
              () => setStatus({ url: coverUrl, retries: current.retries + 1, failed: false }),
              1500 * (current.retries + 1),
            )
          } else {
            setStatus({ url: coverUrl, retries: current.retries, failed: true })
          }
        }}
        onLoad={(e) => {
          // Open Library answers "no cover" with a 1x1 placeholder.
          if (e.currentTarget.naturalWidth <= 2) setStatus({ url: coverUrl, retries: current.retries, failed: true })
        }}
        className={`${dims} object-cover rounded shadow-[0_2px_6px_rgba(0,0,0,0.35)] border border-hairline shrink-0`}
      />
    )
  }

  return (
    <div
      className={`${dims} rounded shadow-[0_2px_6px_rgba(0,0,0,0.35)] border shrink-0 flex items-center justify-center ${size === 'xs' ? 'p-0.5' : 'p-1.5'} ${toneFor(
        seed ?? title,
      )}`}
    >
      <span
        className={`${size === 'xs' ? 'text-[6px] line-clamp-6' : 'text-[10px] line-clamp-5'} leading-tight text-moon text-center font-medium`}
      >
        {title}
      </span>
    </div>
  )
}

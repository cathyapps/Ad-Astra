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
  size?: 'sm' | 'md'
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
  const [failed, setFailed] = useState(false)
  const dims = size === 'sm' ? 'w-14 h-20' : 'w-full aspect-[2/3]'

  if (coverUrl && !failed) {
    return (
      <img
        src={coverUrl}
        alt=""
        onError={() => setFailed(true)}
        onLoad={(e) => {
          if (e.currentTarget.naturalWidth <= 2) setFailed(true)
        }}
        className={`${dims} object-cover rounded shadow-[0_2px_6px_rgba(0,0,0,0.35)] border border-hairline shrink-0`}
      />
    )
  }

  return (
    <div
      className={`${dims} rounded shadow-[0_2px_6px_rgba(0,0,0,0.35)] border shrink-0 flex items-center justify-center p-1.5 ${toneFor(
        seed ?? title,
      )}`}
    >
      <span className="text-[10px] leading-tight text-moon text-center line-clamp-5 font-medium">{title}</span>
    </div>
  )
}

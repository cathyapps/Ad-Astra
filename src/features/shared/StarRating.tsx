import { useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'

const STEP = 0.25
const MAX = 5

const clamp = (v: number) => Math.min(MAX, Math.max(STEP, v))

interface Props {
  label: string
  value?: number
  onChange: (value: number | undefined) => void
  emphasis?: boolean
}

/** Five-star rating in quarter-star steps. Tap or drag across the stars —
 *  the value snaps up to the nearest 0.25 under your finger and is saved
 *  when you lift. Arrow keys move it by a quarter star; ✕ clears it. */
export function StarRating({ label, value, onChange, emphasis }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState<number | null>(null)
  const shown = draft ?? value

  function valueFromPointer(e: PointerEvent): number {
    const rect = trackRef.current!.getBoundingClientRect()
    const frac = (e.clientX - rect.left) / rect.width
    return clamp(Math.ceil(frac * MAX * 4) / 4)
  }

  function onKeyDown(e: KeyboardEvent) {
    const cur = value ?? 0
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      onChange(clamp(cur + STEP))
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      onChange(cur - STEP < STEP ? undefined : cur - STEP)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className={`w-24 shrink-0 text-sm ${emphasis ? 'text-moon font-medium' : 'text-moon-dim'}`}>{label}</span>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={`${label} rating`}
        aria-valuemin={STEP}
        aria-valuemax={MAX}
        aria-valuenow={value ?? 0}
        aria-valuetext={value != null ? `${value} out of 5 stars` : 'not rated'}
        className="relative select-none touch-none text-[26px] leading-none cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-gold rounded"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          setDraft(valueFromPointer(e))
        }}
        onPointerMove={(e) => {
          if (draft != null) setDraft(valueFromPointer(e))
        }}
        onPointerUp={(e) => {
          const v = valueFromPointer(e)
          setDraft(null)
          if (v !== value) onChange(v)
        }}
        onPointerCancel={() => setDraft(null)}
        onKeyDown={onKeyDown}
      >
        <div className="whitespace-nowrap text-moon-dim/30" aria-hidden="true">
          ★★★★★
        </div>
        <div
          className="absolute inset-y-0 left-0 overflow-hidden whitespace-nowrap text-gold pointer-events-none"
          style={{ width: `${((shown ?? 0) / MAX) * 100}%` }}
          aria-hidden="true"
        >
          ★★★★★
        </div>
      </div>
      <span className={`w-9 text-sm tabular-nums ${shown != null ? 'text-gold font-medium' : 'text-moon-dim'}`}>
        {shown != null ? shown : '—'}
      </span>
      {value != null && draft == null && (
        <button
          type="button"
          className="text-xs text-moon-dim hover:text-red-400 transition-colors"
          onClick={() => onChange(undefined)}
          aria-label={`Clear ${label} rating`}
        >
          ✕
        </button>
      )}
    </div>
  )
}

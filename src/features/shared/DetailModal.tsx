import { useEffect } from 'react'
import type { ReactNode } from 'react'

// Shared body scroll lock. Fixing the body in place (and restoring the
// exact scroll offset afterwards) is what makes closing a pop-up drop
// you back at the same spot on the page, including on iOS Safari where
// plain `overflow: hidden` on the body lets the page scroll underneath.
let lockCount = 0
let savedScrollY = 0

function lockScroll() {
  if (lockCount === 0) {
    savedScrollY = window.scrollY
    const s = document.body.style
    s.position = 'fixed'
    s.top = `-${savedScrollY}px`
    s.left = '0'
    s.right = '0'
    s.width = '100%'
  }
  lockCount++
}

function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    const s = document.body.style
    s.position = ''
    s.top = ''
    s.left = ''
    s.right = ''
    s.width = ''
    window.scrollTo(0, savedScrollY)
  }
}

interface Props {
  onClose: () => void
  children: ReactNode
}

/** Pop-up "page" for every detail view (book, star, constellation…).
 *  The page underneath stays mounted and frozen in place, so closing the
 *  pop-up returns to exactly where you were instead of the detail
 *  rendering at the top of the screen and pushing content around.
 *
 *  The children keep their own card styling and Close button — this only
 *  supplies the backdrop, centering, and scrolling. Edit forms inside a
 *  detail view still open as BottomSheets (z-50) on top of this (z-40).
 *
 *  Note: no transform/filter/backdrop-filter on any ancestor of the
 *  children (the blur lives on a sibling backdrop), otherwise nested
 *  `fixed` BottomSheets would anchor to the panel instead of the screen. */
export function DetailModal({ onClose, children }: Props) {
  useEffect(() => {
    lockScroll()
    return unlockScroll
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-center justify-center p-3"
      // Inline so parent `space-y-*` margins can never shrink the overlay.
      style={{
        margin: 0,
        paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="absolute inset-0 bg-night-deep/80 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-full overflow-y-auto overscroll-contain rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        {children}
      </div>
    </div>
  )
}

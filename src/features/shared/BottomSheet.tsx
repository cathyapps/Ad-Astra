import type { ReactNode } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
}

/** Every create/edit form in the app renders inside this instead of
 *  inline in the page flow — it anchors to the bottom of the screen
 *  (thumb-reachable, doesn't push content like the Universe map around)
 *  and sits above everything else via a backdrop. */
export function BottomSheet({ title, onClose, children }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-night-deep/70 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-card border-t border-hairline rounded-t-2xl p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.4)]"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-base text-moon">{title}</h3>
          <button className="text-sm text-moon-dim hover:text-moon transition-colors" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

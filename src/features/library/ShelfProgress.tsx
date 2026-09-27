import type { Book, ReadingLog } from '@/types/library'
import { getBookProgress } from '@/lib/libraryShelf'

interface Props {
  book: Book
  logs: ReadingLog[]
  onClick: () => void
}

/** The readout + progress bar shown under an in-progress book's cover.
 *  Print books show a page number, kindle/audio show a percent — the bar
 *  itself is always a percent fill so the shelf stays visually even.
 *  Tapping it opens the quick log sheet. */
export function ShelfProgress({ book, logs, onClick }: Props) {
  const progress = getBookProgress(book, logs)
  const barPercent = progress.percent ?? (progress.pages && progress.totalPages ? (progress.pages / progress.totalPages) * 100 : 0)

  let label: string
  if (progress.unit === 'page') {
    const currentPage = progress.latestLog?.currentPage ?? (progress.pages != null ? Math.round(progress.pages) : null)
    label = currentPage != null ? `p. ${currentPage}${progress.totalPages ? ` / ${progress.totalPages}` : ''}` : 'Not started'
  } else {
    label = progress.percent != null ? `${progress.percent}%` : 'Not started'
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="w-full text-left group bg-night-deep/70 backdrop-blur-[1px] rounded px-1.5 py-1"
    >
      <span className="text-[9px] text-moon-dim group-hover:text-moon transition-colors leading-none block">{label}</span>
      <span className="block h-1 mt-1 rounded-full bg-hairline overflow-hidden">
        <span
          className="block h-full bg-gold rounded-full transition-[width]"
          style={{ width: `${Math.max(0, Math.min(100, barPercent))}%` }}
        />
      </span>
    </button>
  )
}

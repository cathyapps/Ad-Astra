import { useState } from 'react'
import type { Book, ReadingLog } from '@/types/library'
import { BottomSheet } from '@/features/shared/BottomSheet'

const inputClass =
  'w-full border border-hairline bg-night rounded-lg px-3 py-2 text-sm text-moon placeholder:text-moon-dim/60'
const labelClass = 'text-sm block text-moon-dim'

interface Props {
  book: Book
  onCreateLog: (input: Partial<ReadingLog>) => void
  onUpdateBook: (patch: Partial<Book>) => void
  onClose: () => void
}

/** Log a reading session for one book. Print books log a page number;
 *  kindle/audio log a percent — never a slider, per the "type a number"
 *  rule. If a percent-based book has no totalPages yet, this also asks
 *  for a one-time estimate so progress can be shown in equivalent pages
 *  everywhere else in the app. */
export function ProgressLogSheet({ book, onCreateLog, onUpdateBook, onClose }: Props) {
  const isPercentBased = book.format === 'kindle' || book.format === 'audio'
  const [pageInput, setPageInput] = useState('')
  const [percentInput, setPercentInput] = useState('')
  const [estimatedPagesInput, setEstimatedPagesInput] = useState('')
  const [minutesInput, setMinutesInput] = useState('')

  const needsEstimate = isPercentBased && book.totalPages == null

  return (
    <BottomSheet title={`Log progress — ${book.title}`} onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          const minutes = minutesInput ? Number(minutesInput) : undefined

          if (needsEstimate) {
            const estimate = Number(estimatedPagesInput)
            if (!estimate) return
            onUpdateBook({ totalPages: estimate })
          }

          if (isPercentBased) {
            const percent = Number(percentInput)
            if (!percent && percent !== 0) return
            onCreateLog({ percentComplete: percent, minutesSpentReading: minutes })
          } else {
            const page = Number(pageInput)
            if (!page) return
            onCreateLog({ currentPage: page, minutesSpentReading: minutes })
          }
          onClose()
        }}
      >
        {isPercentBased ? (
          <label className={labelClass}>
            Percent complete
            <input
              autoFocus
              inputMode="numeric"
              className={`${inputClass} mt-1`}
              placeholder="e.g. 42"
              value={percentInput}
              onChange={(e) => setPercentInput(e.target.value)}
            />
          </label>
        ) : (
          <label className={labelClass}>
            Current page
            <input
              autoFocus
              inputMode="numeric"
              className={`${inputClass} mt-1`}
              placeholder={book.totalPages ? `of ${book.totalPages}` : 'e.g. 120'}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
            />
          </label>
        )}

        {needsEstimate && (
          <label className={labelClass}>
            Estimated page count (so progress can show alongside your print books)
            <input
              inputMode="numeric"
              className={`${inputClass} mt-1`}
              placeholder="e.g. 320"
              value={estimatedPagesInput}
              onChange={(e) => setEstimatedPagesInput(e.target.value)}
            />
          </label>
        )}

        <label className={labelClass}>
          Minutes spent reading (optional)
          <input
            inputMode="numeric"
            className={`${inputClass} mt-1`}
            placeholder="e.g. 30"
            value={minutesInput}
            onChange={(e) => setMinutesInput(e.target.value)}
          />
        </label>

        <button type="submit" className="w-full rounded-lg px-3 py-2.5 text-sm bg-gold text-night font-medium">
          Save
        </button>
      </form>
    </BottomSheet>
  )
}

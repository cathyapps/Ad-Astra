import { useState } from 'react'
import type { Book } from '@/types/library'
import { BottomSheet } from '@/features/shared/BottomSheet'
import type { useHardcoverSync } from '@/hooks/useHardcoverSync'

type Sync = ReturnType<typeof useHardcoverSync>

interface Props {
  sync: Sync
  books: Book[]
  onClose: () => void
}

const btn = 'border border-hairline rounded-full px-3 py-1.5 text-xs text-moon hover:bg-card-hover transition-colors disabled:opacity-50'

/** Status of the Hardcover link: what's waiting, what failed and why, plus manual controls. */
export function HardcoverSync({ sync, books, onClose }: Props) {
  const [error, setError] = useState('')
  const titleOf = (id: string) => books.find((b) => b.id === id)?.title ?? 'Unknown book'
  const problems = sync.rows.filter((r) => r.status === 'failed' || r.status === 'needs_link')
  const warned = sync.rows.filter((r) => r.status === 'synced' && r.lastError)

  async function run(fn: () => Promise<unknown>) {
    setError('')
    try {
      await fn()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <BottomSheet title="Hardcover sync" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-xs text-moon-dim">
          New books and changes to status, rating, dates, notes and reading logs are pushed to Hardcover automatically.
          Overall ratings are rounded to the nearest half star there; your quarter-star ratings stay as they are here.
        </p>

        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            ['Waiting', sync.counts.pending],
            ['Synced', sync.counts.synced],
            ['Failed', sync.counts.failed],
            ['Needs link', sync.counts.needsLink],
          ].map(([label, n]) => (
            <div key={label} className="border border-hairline rounded-lg py-2">
              <div className="text-base text-moon">{n}</div>
              <div className="text-[10px] text-moon-dim">{label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button className={btn} disabled={sync.busy || sync.counts.pending + sync.counts.failed === 0} onClick={() => void run(sync.syncNow)}>
            {sync.busy ? 'Syncing…' : 'Sync now'}
          </button>
          {problems.length > 0 && (
            <button className={btn} disabled={sync.busy} onClick={() => void run(sync.retryProblems)}>
              Retry the {problems.length} with problems
            </button>
          )}
          <button
            className={btn}
            disabled={sync.busy}
            onClick={() => {
              if (window.confirm('Queue every book that is not just "want to read" so Hardcover matches Ad Astra? Each takes a few seconds, and you can leave the app open while it runs.')) {
                void run(sync.queueAllReading)
              }
            }}
          >
            Queue all my reading books
          </button>
        </div>
        {sync.message && <p className="text-xs text-gold">{sync.message}</p>}
        {error && <p className="text-xs text-red-300">{error}</p>}

        {problems.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-wide text-moon-dim">Needs attention</p>
            {problems.slice(0, 25).map((r) => (
              <div key={r.bookId} className="border border-hairline rounded-lg px-2.5 py-1.5 text-xs">
                <span className="text-moon">{titleOf(r.bookId)}</span>
                <span className="block text-moon-dim">
                  {r.status === 'needs_link' ? 'Needs link: ' : 'Failed: '}
                  {r.lastError ?? 'unknown reason'}
                </span>
              </div>
            ))}
            {problems.length > 25 && <p className="text-[11px] text-moon-dim">…and {problems.length - 25} more.</p>}
          </div>
        )}

        {warned.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-wide text-moon-dim">Synced, with a warning</p>
            {warned.slice(0, 10).map((r) => (
              <div key={r.bookId} className="border border-hairline rounded-lg px-2.5 py-1.5 text-xs">
                <span className="text-moon">{titleOf(r.bookId)}</span>
                <span className="block text-moon-dim">{r.lastError}</span>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-hairline pt-3 space-y-2">
          <p className="text-[11px] uppercase tracking-wide text-moon-dim">Cover thumbnails</p>
          <p className="text-xs text-moon-dim">
            {sync.unsavedCoverCount === 0
              ? 'Every cover is saved in your Supabase, so the bookshelf never fetches images from other sites.'
              : `${sync.unsavedCoverCount} covers still load from other sites. They are saved in the background; you can also run it now.`}
          </p>
          {sync.unsavedCoverCount > 0 && (
            <button className={btn} disabled={sync.coverBusy} onClick={() => void run(sync.saveAllCovers)}>
              {sync.coverBusy ? 'Saving…' : 'Save covers now'}
            </button>
          )}
          {sync.coverProgress && <p className="text-xs text-gold">{sync.coverProgress}</p>}
        </div>
      </div>
    </BottomSheet>
  )
}

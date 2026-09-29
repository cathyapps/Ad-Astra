import { useState } from 'react'
import type { Book } from '@/types/library'
import { BottomSheet } from '@/features/shared/BottomSheet'

export interface ReadingGoals {
  books?: number
  pages?: number
}

interface Props {
  books: Book[]
  goals: ReadingGoals
  onChangeGoals: (goals: ReadingGoals) => void
}

const inputClass =
  'mt-1 w-full border border-hairline bg-night rounded-lg px-3 py-2 text-sm text-moon placeholder:text-moon-dim/60'

function paceText(done: number, goal: number, fractionOfYear: number, unit: string): string {
  if (done >= goal) return 'Goal reached ✦'
  const diff = done - goal * fractionOfYear
  if (diff >= 1) return `${Math.floor(diff)} ${unit} ahead of pace`
  if (diff <= -1) return `${Math.ceil(-diff)} ${unit} behind pace`
  return 'Right on pace'
}

function GoalBar({ label, done, goal, unit, fractionOfYear }: {
  label: string
  done: number
  goal: number
  unit: string
  fractionOfYear: number
}) {
  const pct = Math.min(100, Math.round((done / goal) * 100))
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-moon">{label}</span>
        <span className="text-sm text-gold font-medium tabular-nums">
          {done.toLocaleString()} / {goal.toLocaleString()}
        </span>
      </div>
      <div className="h-2 rounded-full bg-night border border-hairline overflow-hidden">
        <div className="h-full bg-gold transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-moon-dim">
        {pct}% · {paceText(done, goal, fractionOfYear, unit)}
      </div>
    </div>
  )
}

/** Yearly reading goal, shown only at the top of Library > Metrics.
 *  Counts books marked Read whose finish date falls in the current
 *  calendar year (pages = those books' page counts). */
export function ReadingGoalCard({ books, goals, onChangeGoals }: Props) {
  const [editing, setEditing] = useState(false)
  const [booksInput, setBooksInput] = useState('')
  const [pagesInput, setPagesInput] = useState('')

  const now = new Date()
  const year = now.getFullYear()
  const startOfYear = new Date(year, 0, 1).getTime()
  const endOfYear = new Date(year + 1, 0, 1).getTime()
  const fractionOfYear = (now.getTime() - startOfYear) / (endOfYear - startOfYear)

  const finished = books.filter(
    (b) => b.readStatus === 'read' && b.completedAt && new Date(b.completedAt).getFullYear() === year,
  )
  const booksDone = finished.length
  const pagesDone = finished.reduce((sum, b) => sum + (b.totalPages ?? 0), 0)

  const hasGoal = goals.books != null || goals.pages != null

  function openEditor() {
    setBooksInput(goals.books != null ? String(goals.books) : '')
    setPagesInput(goals.pages != null ? String(goals.pages) : '')
    setEditing(true)
  }

  const toGoal = (v: string) => {
    const n = Math.floor(Number(v))
    return Number.isFinite(n) && n > 0 ? n : undefined
  }

  return (
    <div className="border border-hairline rounded-xl p-4 bg-card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-moon">{year} Reading Goal</h3>
        <button className="text-xs text-cosmic hover:text-moon transition-colors" onClick={openEditor}>
          {hasGoal ? 'Edit' : 'Set a goal'}
        </button>
      </div>

      {!hasGoal ? (
        <p className="text-sm text-moon-dim">
          Set a books or pages target for the year and track your progress here.
        </p>
      ) : (
        <div className="space-y-3">
          {goals.books != null && (
            <GoalBar label="Books" done={booksDone} goal={goals.books} unit="books" fractionOfYear={fractionOfYear} />
          )}
          {goals.pages != null && (
            <GoalBar label="Pages" done={pagesDone} goal={goals.pages} unit="pages" fractionOfYear={fractionOfYear} />
          )}
        </div>
      )}

      {editing && (
        <BottomSheet title={`${year} reading goal`} onClose={() => setEditing(false)}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              onChangeGoals({ books: toGoal(booksInput), pages: toGoal(pagesInput) })
              setEditing(false)
            }}
          >
            <label className="text-sm block text-moon-dim">
              Books to read this year
              <input
                autoFocus
                className={inputClass}
                inputMode="numeric"
                placeholder="e.g. 30"
                value={booksInput}
                onChange={(e) => setBooksInput(e.target.value)}
              />
            </label>
            <label className="text-sm block text-moon-dim">
              Pages to read this year (optional)
              <input
                className={inputClass}
                inputMode="numeric"
                placeholder="e.g. 10000"
                value={pagesInput}
                onChange={(e) => setPagesInput(e.target.value)}
              />
            </label>
            <p className="text-xs text-moon-dim">Leave a box empty to have no goal for it.</p>
            <div className="flex gap-2">
              <button
                type="button"
                className="border border-hairline rounded-lg px-3 py-2.5 text-sm flex-1 text-moon hover:bg-card-hover transition-colors"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
              <button type="submit" className="rounded-lg px-3 py-2.5 text-sm flex-1 bg-gold text-night font-medium">
                Save
              </button>
            </div>
          </form>
        </BottomSheet>
      )}
    </div>
  )
}

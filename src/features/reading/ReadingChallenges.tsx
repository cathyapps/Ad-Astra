import { useState } from 'react'
import type { ReadingChallenge, ReadingGoalType, ReadingSession } from '@/types/reading'
import { booksCompletedInRange, pagesReadInRange } from '@/lib/readingStats'

const inputClass =
  'mt-1 w-full border border-hairline bg-night rounded-lg px-3 py-2 text-sm text-moon placeholder:text-moon-dim/60'
const labelClass = 'text-sm block text-moon-dim'

interface FormProps {
  onSave: (input: Partial<ReadingChallenge> & { name: string }) => void
  onCancel: () => void
}

export function ReadingChallengeForm({ onSave, onCancel }: FormProps) {
  const [name, setName] = useState('')
  const [goalType, setGoalType] = useState<ReadingGoalType>('book_count')
  const [target, setTarget] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim() || !target || !startDate || !endDate) return
        onSave({
          name: name.trim(),
          goalType,
          target: Number(target),
          startDate,
          endDate,
        })
      }}
    >
      <label className={labelClass}>
        Challenge name
        <input
          autoFocus
          className={inputClass}
          placeholder="e.g. 50 books in 2027"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Goal
          <select
            className={inputClass}
            value={goalType}
            onChange={(e) => setGoalType(e.target.value as ReadingGoalType)}
          >
            <option value="book_count">Books</option>
            <option value="page_count">Pages</option>
          </select>
        </label>
        <label className={labelClass}>
          Target
          <input
            className={inputClass}
            inputMode="numeric"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Start
          <input
            type="date"
            className={inputClass}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label className={labelClass}>
          End
          <input
            type="date"
            className={inputClass}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          className="border border-hairline rounded-lg px-3 py-2 text-sm flex-1 text-moon hover:bg-card-hover transition-colors"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button type="submit" className="rounded-lg px-3 py-2 text-sm flex-1 bg-gold text-night font-medium">
          Save
        </button>
      </div>
    </form>
  )
}

interface PanelProps {
  challenges: ReadingChallenge[]
  sessions: ReadingSession[]
  onDelete: (id: string) => void
}

export function ReadingChallengesPanel({ challenges, sessions, onDelete }: PanelProps) {
  return (
    <div className="space-y-3">
      {challenges.map((c) => {
        const start = new Date(c.startDate)
        const end = new Date(c.endDate)
        const progress =
          c.goalType === 'book_count'
            ? booksCompletedInRange(sessions, start, end)
            : pagesReadInRange(sessions, start, end)
        const pct = Math.min(100, Math.round((progress / c.target) * 100))
        return (
          <div key={c.id} className="border border-hairline rounded-xl p-3 bg-card space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-moon">{c.name}</h3>
              <button
                className="text-xs text-moon-dim hover:text-red-400 transition-colors"
                onClick={() => onDelete(c.id)}
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-moon-dim">
              {progress} / {c.target} {c.goalType === 'book_count' ? 'books' : 'pages'} · {c.startDate} →{' '}
              {c.endDate}
            </div>
            <div className="h-1.5 rounded-full bg-hairline overflow-hidden">
              <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
      {challenges.length === 0 && (
        <p className="text-sm text-moon-dim">No challenges yet — set one up below.</p>
      )}
    </div>
  )
}

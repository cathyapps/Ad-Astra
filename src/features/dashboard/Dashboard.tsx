import { useState } from 'react'
import { ACTIVITY_TYPES } from '@/types'
import type {
  ActivityType,
  Constellation,
  DashboardContext,
  DeviceContext,
  EffortContext,
  EnergyContext,
  LocationContext,
  Recommendation,
  Star,
  Task,
  TimeBudget,
} from '@/types'
import { getRecommendations, getSmallWin } from '@/lib/recommendationEngine'
import { getCurrentOrbitStars } from '@/lib/currentOrbit'
import { CurrentHabits } from './CurrentHabits'

const LOCATIONS: LocationContext[] = ['anywhere', 'work', 'home', 'away_from_home']
const DEVICES: DeviceContext[] = ['phone', 'computer', 'tv', 'physical']
const EFFORTS: EffortContext[] = ['bed', 'seated', 'active']
const ENERGIES: EnergyContext[] = ['very_low', 'low', 'normal', 'high']
const TIME_BUDGETS: TimeBudget[] = [5, 15, 30, 60, 999]

const selectClass =
  'w-full min-w-0 border border-hairline bg-night rounded-lg px-1.5 py-1 text-xs text-moon truncate'

interface Props {
  stars: Star[]
  tasks: Task[]
  constellations: Constellation[]
  onUpdateTask: (id: string, patch: Partial<Task>) => void
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs border rounded-full px-2.5 py-1 transition-colors ${
        active ? 'bg-cosmic text-night border-cosmic font-medium' : 'border-hairline text-moon-dim hover:text-moon'
      }`}
    >
      {children}
    </button>
  )
}

export function Dashboard({ stars, tasks, constellations, onUpdateTask }: Props) {
  const [context, setContext] = useState<DashboardContext>({ activityTypes: [] })
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null)
  const [smallWin, setSmallWin] = useState<Recommendation | null | undefined>(undefined)
  const [celebrating, setCelebrating] = useState<string | null>(null)

  const orbit = getCurrentOrbitStars(stars)

  function toggleActivity(a: ActivityType) {
    setContext((c) => ({
      ...c,
      activityTypes: c.activityTypes.includes(a)
        ? c.activityTypes.filter((x) => x !== a)
        : [...c.activityTypes, a],
    }))
  }

  function complete(rec: Recommendation) {
    if (!rec.taskId) return
    onUpdateTask(rec.taskId, { status: 'done' })
    setCelebrating(rec.title)
    setTimeout(() => setCelebrating(null), 2500)
    setRecommendations((r) => r?.filter((x) => x.id !== rec.id) ?? null)
    if (smallWin?.id === rec.id) setSmallWin(undefined)
  }

  return (
    <div className="space-y-5">
      {celebrating && (
        <div className="border border-gold/30 rounded-xl px-3 py-2.5 text-sm bg-gold/10 text-gold-soft">
          ✦ Nice — "{celebrating}" done.
        </div>
      )}

      <div className="border border-hairline rounded-xl p-3 space-y-2 bg-card">
        <h3 className="text-sm font-medium text-moon">What are you in the mood for?</h3>
        <div className="flex flex-wrap gap-1.5">
          {ACTIVITY_TYPES.map((a) => (
            <Chip key={a} active={context.activityTypes.includes(a)} onClick={() => toggleActivity(a)}>
              {a}
            </Chip>
          ))}
        </div>

        {/* Five compact dropdowns in one tight grid. The field name lives
            inside the option text ("Time: any") so no labels are needed. */}
        <div className="grid grid-cols-3 gap-1.5">
          <select
            aria-label="Time"
            className={selectClass}
            value={context.timeBudget ?? ''}
            onChange={(e) =>
              setContext((c) => ({
                ...c,
                timeBudget: e.target.value ? (Number(e.target.value) as TimeBudget) : undefined,
              }))
            }
          >
            <option value="">Time: any</option>
            {TIME_BUDGETS.map((t) => (
              <option key={t} value={t}>
                {t === 999 ? 'Time: 1+ hour' : `Time: ${t} min`}
              </option>
            ))}
          </select>
          <select
            aria-label="Energy"
            className={selectClass}
            value={context.energy ?? ''}
            onChange={(e) =>
              setContext((c) => ({ ...c, energy: (e.target.value || undefined) as EnergyContext }))
            }
          >
            <option value="">Energy: any</option>
            {ENERGIES.map((e) => (
              <option key={e} value={e}>
                Energy: {e.replace('_', ' ')}
              </option>
            ))}
          </select>
          <select
            aria-label="Location"
            className={selectClass}
            value={context.location ?? ''}
            onChange={(e) =>
              setContext((c) => ({ ...c, location: (e.target.value || undefined) as LocationContext }))
            }
          >
            <option value="">Where: any</option>
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>
                Where: {l === 'away_from_home' ? 'away' : l}
              </option>
            ))}
          </select>
          <select
            aria-label="Device"
            className={selectClass}
            value={context.device ?? ''}
            onChange={(e) =>
              setContext((c) => ({ ...c, device: (e.target.value || undefined) as DeviceContext }))
            }
          >
            <option value="">Device: any</option>
            {DEVICES.map((d) => (
              <option key={d} value={d}>
                Device: {d}
              </option>
            ))}
          </select>
          <select
            aria-label="Physical effort"
            className={`${selectClass} col-span-2`}
            value={context.effort ?? ''}
            onChange={(e) =>
              setContext((c) => ({ ...c, effort: (e.target.value || undefined) as EffortContext }))
            }
          >
            <option value="">Effort: any</option>
            {EFFORTS.map((e) => (
              <option key={e} value={e}>
                Effort: {e}
              </option>
            ))}
          </select>
        </div>

        <button
          className="w-full rounded-lg px-3 py-2 text-sm bg-gold text-night font-medium hover:bg-gold-soft transition-colors"
          onClick={() => setRecommendations(getRecommendations(context, stars, tasks, constellations))}
        >
          Show me something
        </button>
      </div>

      {recommendations && (
        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-wide text-moon-dim">Recommendations</h3>
          {recommendations.length === 0 && (
            <p className="text-sm text-moon-dim">
              Nothing matches right now — try loosening a filter, or add tasks to your Current Orbit
              Stars.
            </p>
          )}
          {recommendations.map((r) => (
            <div
              key={r.id}
              className="border border-hairline rounded-lg px-3 py-2.5 flex items-start gap-2.5 bg-card"
            >
              <input
                type="checkbox"
                className="mt-1 accent-gold w-4 h-4"
                onChange={() => complete(r)}
              />
              <div className="flex-1">
                <div className="text-sm text-moon">{r.title}</div>
                <div className="text-xs text-moon-dim">{r.reason}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        className="w-full border border-hairline rounded-lg px-3 py-2.5 text-sm text-moon hover:bg-card-hover transition-colors"
        onClick={() => setSmallWin(getSmallWin(context, stars, tasks, constellations))}
      >
        Give me a small win
      </button>

      {smallWin !== undefined && (
        <div className="border border-hairline rounded-lg px-3 py-2.5 bg-card">
          {smallWin ? (
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                className="mt-1 accent-gold w-4 h-4"
                onChange={() => complete(smallWin)}
              />
              <div className="flex-1">
                <div className="text-sm text-moon">{smallWin.title}</div>
                <div className="text-xs text-moon-dim">{smallWin.reason}</div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-moon-dim">
              No quick tasks under 15 minutes right now — add a small task to a Current Orbit Star.
            </p>
          )}
        </div>
      )}

      <CurrentHabits stars={stars} tasks={tasks} onUpdateTask={onUpdateTask} />

      <div>
        <h3 className="text-xs uppercase tracking-wide text-moon-dim mb-2">
          Current Orbit ({orbit.length})
        </h3>
        {orbit.length === 0 ? (
          <p className="text-sm text-moon-dim">
            Nothing in orbit yet — move a Star to Current Orbit from the Universe tab.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {orbit.map((s) => (
              <span
                key={s.id}
                className="text-xs border border-hairline rounded-full px-2.5 py-1 text-moon"
              >
                {s.name} <span className="text-gold">{s.progress}%</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

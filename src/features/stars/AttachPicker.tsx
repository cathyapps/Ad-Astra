import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { BottomSheet } from '@/features/shared/BottomSheet'

export interface PickerItem {
  id: string
  label: string
  sub?: string
  /** Values this item has for each facet key (a string, or several for
   *  multi-valued facets like tags). */
  facets: Record<string, string | string[] | undefined>
}

export interface FacetDef {
  key: string
  label: string
  options: { value: string; label: string }[]
}

interface Props {
  title: string
  items: PickerItem[]
  facets: FacetDef[]
  searchPlaceholder: string
  emptyText: string
  onPick: (id: string) => void
  onClose: () => void
  /** Optional "create a brand new one" action shown under the list. */
  addNew?: { label: string; onClick: () => void }
  footer?: ReactNode
}

const byLabel = (a: PickerItem, b: PickerItem) =>
  a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })

function matchesFacet(item: PickerItem, key: string, value: string): boolean {
  const v = item.facets[key]
  return Array.isArray(v) ? v.includes(value) : v === value
}

/** Attach picker: choose an existing item either by searching or by
 *  picking from an alphabetical list that can be narrowed with filters
 *  (behind the funnel icon). */
export function AttachPicker({
  title,
  items,
  facets,
  searchPlaceholder,
  emptyText,
  onPick,
  onClose,
  addNew,
}: Props) {
  const [mode, setMode] = useState<'search' | 'list'>('search')
  const [query, setQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selected, setSelected] = useState<Record<string, string>>({})

  const activeFilters = Object.values(selected).filter(Boolean).length

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return items
      .filter((i) => `${i.label} ${i.sub ?? ''}`.toLowerCase().includes(q))
      .sort((a, b) => {
        const as = a.label.toLowerCase().startsWith(q) ? 0 : 1
        const bs = b.label.toLowerCase().startsWith(q) ? 0 : 1
        return as - bs || byLabel(a, b)
      })
  }, [items, query])

  const listResults = useMemo(
    () =>
      items
        .filter((i) => Object.entries(selected).every(([k, v]) => !v || matchesFacet(i, k, v)))
        .sort(byLabel),
    [items, selected],
  )

  const row = (i: PickerItem) => (
    <button
      key={i.id}
      className="w-full text-left border border-hairline rounded-lg px-3 py-2 bg-night/40 hover:bg-card-hover transition-colors"
      onClick={() => onPick(i.id)}
    >
      <div className="text-sm text-moon">{i.label}</div>
      {i.sub && <div className="text-xs text-moon-dim">{i.sub}</div>}
    </button>
  )

  return (
    <BottomSheet title={title} onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-night border border-hairline text-sm">
          {(['search', 'list'] as const).map((m) => (
            <button
              key={m}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                mode === m ? 'bg-card-hover text-moon font-medium' : 'text-moon-dim hover:text-moon'
              }`}
              onClick={() => setMode(m)}
            >
              {m === 'search' ? 'Search' : 'Pick from list'}
            </button>
          ))}
        </div>

        {mode === 'search' ? (
          <div className="space-y-2">
            <input
              autoFocus
              type="search"
              className="w-full border border-hairline bg-night rounded-lg px-3 py-2 text-sm text-moon placeholder:text-moon-dim/60"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query.trim() === '' ? (
              <p className="text-xs text-moon-dim">Start typing to find one.</p>
            ) : searchResults.length === 0 ? (
              <p className="text-sm text-moon-dim">No matches.</p>
            ) : (
              <div className="space-y-1.5">{searchResults.slice(0, 30).map(row)}</div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-moon-dim">
                {listResults.length} {listResults.length === 1 ? 'item' : 'items'} · A–Z
              </span>
              {facets.length > 0 && (
                <button
                  type="button"
                  aria-label="Filter list"
                  aria-expanded={filtersOpen}
                  className={`relative flex items-center gap-1.5 text-xs border rounded-full px-3 py-1.5 transition-colors ${
                    activeFilters > 0 || filtersOpen
                      ? 'border-gold text-gold'
                      : 'border-hairline text-moon-dim hover:text-moon'
                  }`}
                  onClick={() => setFiltersOpen((v) => !v)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" />
                  </svg>
                  Filter{activeFilters > 0 ? ` (${activeFilters})` : ''}
                </button>
              )}
            </div>

            {filtersOpen && (
              <div className="border border-hairline rounded-lg p-2.5 space-y-2.5 bg-night/40">
                {facets.map((f) => (
                  <div key={f.key}>
                    <div className="text-[11px] uppercase tracking-wide text-moon-dim mb-1">{f.label}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {[{ value: '', label: 'Any' }, ...f.options].map((o) => {
                        const active = (selected[f.key] ?? '') === o.value
                        return (
                          <button
                            key={o.value || 'any'}
                            type="button"
                            className={`text-xs border rounded-full px-2.5 py-1 transition-colors ${
                              active
                                ? 'bg-cosmic text-night border-cosmic font-medium'
                                : 'border-hairline text-moon-dim hover:text-moon'
                            }`}
                            onClick={() => setSelected((s) => ({ ...s, [f.key]: o.value }))}
                          >
                            {o.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
                {activeFilters > 0 && (
                  <button
                    type="button"
                    className="text-xs text-moon-dim hover:text-moon transition-colors"
                    onClick={() => setSelected({})}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {listResults.length === 0 ? (
              <p className="text-sm text-moon-dim">{emptyText}</p>
            ) : (
              <div className="space-y-1.5">{listResults.map(row)}</div>
            )}
          </div>
        )}

        {addNew && (
          <button
            className="w-full border border-hairline rounded-lg px-3 py-2 text-sm text-cosmic hover:text-moon hover:bg-card-hover transition-colors"
            onClick={addNew.onClick}
          >
            {addNew.label}
          </button>
        )}
      </div>
    </BottomSheet>
  )
}

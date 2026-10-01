// Keeps chart x-axis labels readable. Only the *labels* are thinned out
// (or regrouped into coarser units) — the plotted points are never
// touched, so the data keeps its full resolution.

export const MAX_AXIS_LABELS = 15

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_STEPS = [1, 2, 3, 4, 6] // label every Nth calendar month (Jan, Mar, May… for 2)
const YEAR_STEPS = [1, 2, 5, 10, 20, 50]

interface LabelPoint {
  label: string
  /** YYYY-MM-DD, present on date-axis points. */
  date?: string
}

const countLabels = (labels: (string | null)[]) => labels.filter((l) => l != null).length

function utcMs(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

/** Label every k-th point, with k chosen so at most `max` labels remain. */
function strideLabels(labels: string[], max: number): (string | null)[] {
  const k = Math.ceil(labels.length / max)
  return labels.map((label, i) => (i % k === 0 ? label : null))
}

/** For long date ranges: label by calendar month ("Jan ’24"), every 2nd /
 *  3rd / 4th / 6th month as needed, and when even that is too many, switch
 *  units and label years instead. Labels sit on the first point that falls
 *  in each labelled month/year. */
function calendarLabels(dates: string[], max: number): (string | null)[] | null {
  const ym = dates.map((d) => ({ year: Number(d.slice(0, 4)), month: Number(d.slice(5, 7)) - 1 }))
  const firstOfMonth = ym.map((v, i) => i === 0 || v.year !== ym[i - 1].year || v.month !== ym[i - 1].month)
  const firstOfYear = ym.map((v, i) => i === 0 || v.year !== ym[i - 1].year)

  for (const step of MONTH_STEPS) {
    const labels = ym.map((v, i) =>
      firstOfMonth[i] && v.month % step === 0 ? `${MONTHS[v.month]} ’${String(v.year).slice(2)}` : null,
    )
    if (countLabels(labels) >= 2 && countLabels(labels) <= max) return labels
  }
  for (const step of YEAR_STEPS) {
    const labels = ym.map((v, i) => (firstOfYear[i] && v.year % step === 0 ? String(v.year) : null))
    if (countLabels(labels) >= 1 && countLabels(labels) <= max) return labels
  }
  return null
}

/** One entry per point: the text to draw under it, or null for no label. */
export function axisLabels(points: LabelPoint[], isDateAxis: boolean, max = MAX_AXIS_LABELS): (string | null)[] {
  if (points.length <= max) return points.map((p) => p.label)

  if (isDateAxis && points.every((p) => p.date)) {
    const dates = points.map((p) => p.date as string)
    const spanDays = (utcMs(dates[dates.length - 1]) - utcMs(dates[0])) / 86400000
    // A couple of months or less: plain every-Nth-point labels read best.
    if (spanDays > 62) {
      const calendar = calendarLabels(dates, max)
      if (calendar) return calendar
    }
  }
  return strideLabels(points.map((p) => p.label), max)
}

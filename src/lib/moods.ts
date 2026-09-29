import type { Book } from '@/types/library'

// Mood tags (StoryGraph-style) mapped to a "how light or dark" score used
// by the mood charts: -2 is the darkest, +2 the lightest. Darker moods pull
// an average down, lighter ones push it up. Adjust freely — every chart
// recomputes from these numbers. Tag matching ignores case and whitespace.
export const MOOD_SCORES: Record<string, number> = {
  lighthearted: 2,
  funny: 2,
  humorous: 2,
  adventurous: 1.5,
  hopeful: 1,
  inspiring: 1,
  relaxing: 1,
  informative: 0,
  reflective: 0,
  emotional: 0,
  mysterious: -0.5,
  challenging: -1,
  tense: -1.5,
  dark: -2,
  sad: -2,
}

export const MOOD_MIN = -2
export const MOOD_MAX = 2

const norm = (t: string) => t.trim().toLowerCase()

/** The book's tags that are moods (lower-cased). */
export function moodsOf(book: Book): string[] {
  return Array.from(new Set(book.tags.map(norm).filter((t) => t in MOOD_SCORES)))
}

/** Average score of a book's mood tags, or undefined if it has none. */
export function bookMoodScore(book: Book): number | undefined {
  const moods = moodsOf(book)
  if (moods.length === 0) return undefined
  return moods.reduce((sum, m) => sum + MOOD_SCORES[m], 0) / moods.length
}

/** Average mood across books (each book counts once), ignoring books with
 *  no mood tags. Rounded to 2 decimals; undefined if none have moods. */
export function averageMood(books: Book[]): number | undefined {
  const scores = books.map(bookMoodScore).filter((s): s is number => s != null)
  if (scores.length === 0) return undefined
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
}

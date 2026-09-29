import type { Book } from '@/types/library'

export interface CategorySpine {
  /** Stable id (also what's shown on the spine). */
  label: string
  matches: (book: Book) => boolean
}

const hasTag = (book: Book, tag: string) => book.tags.some((t) => t.toLowerCase() === tag)
const genreIs = (genre: string) => (book: Book) => book.genre === genre
const moodTag = (tag: string) => (book: Book) => hasTag(book, tag)

const NONFICTION_GENRES = new Set(['History', 'Memoir', 'Biography', 'Self-Help', 'Nonfiction'])

/** true = non-fiction, false = fiction, undefined = can't tell. An
 *  explicit "fiction"/"nonfiction" tag wins over what the genre implies. */
function isNonFiction(book: Book): boolean | undefined {
  if (hasTag(book, 'nonfiction') || hasTag(book, 'non-fiction')) return true
  if (hasTag(book, 'fiction')) return false
  if (!book.genre) return undefined
  return NONFICTION_GENRES.has(book.genre)
}

const pagesBetween = (min: number, max: number, inclusiveMax = false) => (book: Book) =>
  book.totalPages != null && book.totalPages >= min && (inclusiveMax ? book.totalPages <= max : book.totalPages < max)

// Four shelves of ten spines each, in the order they appear on screen.
export const CATEGORY_SHELVES: CategorySpine[][] = [
  [
    { label: 'Short Stories', matches: (b) => b.totalPages != null && b.totalPages < 100 },
    { label: '<300 pages', matches: pagesBetween(100, 300) },
    { label: '300-500 pgs', matches: pagesBetween(300, 500, true) },
    { label: '500+ pgs', matches: (b) => b.totalPages != null && b.totalPages > 500 },
    { label: 'fast-paced', matches: moodTag('fast-paced') },
    { label: 'medium-paced', matches: moodTag('medium-paced') },
    { label: 'slow-paced', matches: moodTag('slow-paced') },
    { label: 'Fiction', matches: (b) => isNonFiction(b) === false },
    { label: 'Non-Fiction', matches: (b) => isNonFiction(b) === true },
    { label: 'OUABC', matches: moodTag('ouabc') },
  ],
  [
    { label: 'Classic', matches: genreIs('Classic') },
    { label: 'Literary Fiction', matches: genreIs('Literary Fiction') },
    { label: 'Historical Fiction', matches: genreIs('Historical Fiction') },
    { label: 'Mystery', matches: genreIs('Mystery') },
    { label: 'Thriller', matches: genreIs('Thriller') },
    { label: 'Science Fiction', matches: genreIs('Science Fiction') },
    { label: 'Fantasy', matches: genreIs('Fantasy') },
    { label: 'Humor', matches: genreIs('Humor') },
    { label: 'Romance', matches: genreIs('Romance') },
    { label: 'Cliterature', matches: genreIs('Cliterature') },
  ],
  [
    { label: 'History', matches: genreIs('History') },
    { label: 'Memoir', matches: genreIs('Memoir') },
    { label: 'Biography', matches: genreIs('Biography') },
    { label: 'Self-Help', matches: genreIs('Self-Help') },
    { label: 'YA Fiction', matches: genreIs('YA Fiction') },
    { label: "Children's", matches: genreIs("Children's") },
    { label: 'informative', matches: moodTag('informative') },
    { label: 'challenging', matches: moodTag('challenging') },
    { label: 'funny', matches: moodTag('funny') },
    { label: 'lighthearted', matches: moodTag('lighthearted') },
  ],
  [
    { label: 'adventurous', matches: moodTag('adventurous') },
    { label: 'inspiring', matches: moodTag('inspiring') },
    { label: 'hopeful', matches: moodTag('hopeful') },
    { label: 'relaxing', matches: moodTag('relaxing') },
    { label: 'reflective', matches: moodTag('reflective') },
    { label: 'emotional', matches: moodTag('emotional') },
    { label: 'sad', matches: moodTag('sad') },
    { label: 'mysterious', matches: moodTag('mysterious') },
    { label: 'tense', matches: moodTag('tense') },
    { label: 'dark', matches: moodTag('dark') },
  ],
]

export const ALL_CATEGORY_SPINES: CategorySpine[] = CATEGORY_SHELVES.flat()

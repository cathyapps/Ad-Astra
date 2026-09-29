import type { Book, ReadingLog } from '@/types/library'
import { ProgressLogSheet } from './ProgressLogSheet'
import { useReadingTimer } from './ReadingTimerContext'

interface Props {
  books: Book[]
  onCreateReadingLog: (input: Partial<ReadingLog> & { bookId: string }) => void
  onUpdateBook: (id: string, patch: Partial<Book>) => void
}

/** Mounted once at the app root. When Stop Reading is tapped anywhere,
 *  this opens the quick log entry for that book with the time filled in. */
export function StoppedSessionSheet({ books, onCreateReadingLog, onUpdateBook }: Props) {
  const { stoppedSession, clearStoppedSession } = useReadingTimer()
  if (!stoppedSession) return null
  const book = books.find((b) => b.id === stoppedSession.bookId)
  if (!book) return null

  return (
    <ProgressLogSheet
      book={book}
      initialMinutes={stoppedSession.minutes}
      onCreateLog={(input) => onCreateReadingLog({ ...input, bookId: book.id })}
      onUpdateBook={(patch) => onUpdateBook(book.id, patch)}
      onClose={clearStoppedSession}
    />
  )
}

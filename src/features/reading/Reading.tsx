import { useState } from 'react'
import type { Constellation, Star } from '@/types'
import type { Book, BookList, BookListItem, ReadingChallenge, ReadingSession } from '@/types/reading'
import { BookForm } from './BookForm'
import { BookLibrary } from './BookLibrary'
import { BookDetail } from './BookDetail'
import { BookListForm, BookListsPanel } from './BookLists'
import { ReadingChallengeForm, ReadingChallengesPanel } from './ReadingChallenges'
import { ReadingInsights } from './ReadingInsights'
import { currentStreakDays } from '@/lib/readingStats'

interface Props {
  stars: Star[]
  constellations: Constellation[]
  books: Book[]
  bookLists: BookList[]
  bookListItems: BookListItem[]
  readingSessions: ReadingSession[]
  readingChallenges: ReadingChallenge[]
  onCreateBook: (input: Partial<Book> & { title: string }) => void
  onUpdateBook: (id: string, patch: Partial<Book>) => void
  onDeleteBook: (id: string) => void
  onCreateBookList: (input: Partial<BookList> & { name: string }) => void
  onToggleBookInList: (bookListId: string, bookId: string, isMember: boolean) => void
  onCreateReadingSession: (input: Partial<ReadingSession> & { bookId: string }) => void
  onCreateReadingChallenge: (input: Partial<ReadingChallenge> & { name: string }) => void
  onDeleteReadingChallenge: (id: string) => void
}

type SubTab = 'library' | 'lists' | 'challenges' | 'insights'

export function Reading({
  stars,
  constellations,
  books,
  bookLists,
  bookListItems,
  readingSessions,
  readingChallenges,
  onCreateBook,
  onUpdateBook,
  onDeleteBook,
  onCreateBookList,
  onToggleBookInList,
  onCreateReadingSession,
  onCreateReadingChallenge,
  onDeleteReadingChallenge,
}: Props) {
  const [subTab, setSubTab] = useState<SubTab>('library')
  const [selectedBookId, setSelectedBookId] = useState<string | undefined>()
  const [showBookForm, setShowBookForm] = useState(false)
  const [showListForm, setShowListForm] = useState(false)
  const [showChallengeForm, setShowChallengeForm] = useState(false)

  const selectedBook = books.find((b) => b.id === selectedBookId)
  const listIdsByBook = new Map<string, string[]>()
  for (const item of bookListItems) {
    listIdsByBook.set(item.bookId, [...(listIdsByBook.get(item.bookId) ?? []), item.bookListId])
  }
  const streak = currentStreakDays(readingSessions)

  function selectBook(id: string) {
    setSelectedBookId(id)
    setSubTab('library')
  }

  return (
    <div className="space-y-4">
      {streak > 0 && (
        <div className="text-xs text-moon-dim border border-hairline rounded-full px-3 py-1.5 inline-block">
          🔥 {streak} day reading streak
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-1 text-sm border border-hairline rounded-full p-1">
          {(['library', 'lists', 'challenges', 'insights'] as SubTab[]).map((t) => (
            <button
              key={t}
              className={`rounded-full px-3 py-1 transition-colors capitalize ${
                subTab === t ? 'bg-gold text-night font-medium' : 'text-moon-dim'
              }`}
              onClick={() => setSubTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          className="border border-hairline rounded-full px-3 py-1.5 text-sm text-moon hover:bg-card-hover transition-colors disabled:opacity-0"
          disabled={subTab === 'insights'}
          onClick={() => {
            if (subTab === 'library') setShowBookForm(true)
            if (subTab === 'lists') setShowListForm(true)
            if (subTab === 'challenges') setShowChallengeForm(true)
          }}
        >
          + New
        </button>
      </div>

      {subTab === 'library' && (
        <>
          {showBookForm && (
            <div className="border border-hairline rounded-xl p-4 bg-card">
              <BookForm
                onCancel={() => setShowBookForm(false)}
                onSave={(input) => {
                  onCreateBook(input)
                  setShowBookForm(false)
                }}
              />
            </div>
          )}

          {selectedBook && (
            <BookDetail
              book={selectedBook}
              stars={stars}
              constellations={constellations}
              bookLists={bookLists}
              listIdsForBook={listIdsByBook.get(selectedBook.id) ?? []}
              sessions={readingSessions.filter((s) => s.bookId === selectedBook.id)}
              onUpdate={(patch) => onUpdateBook(selectedBook.id, patch)}
              onDelete={() => {
                onDeleteBook(selectedBook.id)
                setSelectedBookId(undefined)
              }}
              onLogSession={(input) => onCreateReadingSession({ ...input, bookId: selectedBook.id })}
              onToggleList={(listId) =>
                onToggleBookInList(
                  listId,
                  selectedBook.id,
                  (listIdsByBook.get(selectedBook.id) ?? []).includes(listId),
                )
              }
              onClose={() => setSelectedBookId(undefined)}
            />
          )}

          <BookLibrary books={books} onSelect={selectBook} selectedId={selectedBookId} />
        </>
      )}

      {subTab === 'lists' && (
        <>
          {showListForm && (
            <div className="border border-hairline rounded-xl p-4 bg-card">
              <BookListForm
                onCancel={() => setShowListForm(false)}
                onSave={(input) => {
                  onCreateBookList(input)
                  setShowListForm(false)
                }}
              />
            </div>
          )}
          <BookListsPanel
            lists={bookLists}
            books={books}
            listIdsByBook={listIdsByBook}
            onSelectBook={selectBook}
          />
        </>
      )}

      {subTab === 'challenges' && (
        <>
          {showChallengeForm && (
            <div className="border border-hairline rounded-xl p-4 bg-card">
              <ReadingChallengeForm
                onCancel={() => setShowChallengeForm(false)}
                onSave={(input) => {
                  onCreateReadingChallenge(input)
                  setShowChallengeForm(false)
                }}
              />
            </div>
          )}
          <ReadingChallengesPanel
            challenges={readingChallenges}
            books={books}
            sessions={readingSessions}
            onDelete={onDeleteReadingChallenge}
          />
        </>
      )}

      {subTab === 'insights' && <ReadingInsights books={books} sessions={readingSessions} />}
    </div>
  )
}

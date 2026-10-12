import { createContext } from 'react'
import type { RereadOptions } from '@/lib/readings'

/** Lets the book detail start a re-read without every screen that shows it passing the action down.
 *  Provided once in App; null means re-reading isn't available (the button is hidden). */
export const RereadContext = createContext<((bookId: string, opts: RereadOptions) => Promise<void>) | null>(null)

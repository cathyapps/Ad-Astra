// Maps a Trip/Book/Watchable's own status to the Star stage it should
// have, per the user's rule: things still at the "idea"/"want to" stage
// don't get a Star yet; once something is actually being pursued it does.
// A null return means "no Star should exist for this right now."
import type { StarStage } from '@/types'
import type { TripStatus } from '@/types/travel'
import type { BookStatus } from '@/types/reading'
import type { WatchStatus } from '@/types/watching'
import type { LearningStatus } from '@/types/learning'

export function tripStatusToStarStage(status: TripStatus): StarStage | null {
  switch (status) {
    case 'idea':
      return null
    case 'planning':
      return 'planning'
    case 'booked':
      return 'current_orbit'
    case 'completed':
      return 'completed'
    case 'archived':
      return 'archived'
  }
}

export function bookStatusToStarStage(status: BookStatus): StarStage | null {
  switch (status) {
    case 'want_to_read':
      return null
    case 'reading':
      return 'current_orbit'
    case 'read':
    case 'dnf':
      return 'completed'
  }
}

export function watchStatusToStarStage(status: WatchStatus): StarStage | null {
  switch (status) {
    case 'want_to_watch':
      return null
    case 'watching':
      return 'current_orbit'
    case 'watched':
    case 'dnf':
      return 'completed'
  }
}

export function learningStatusToStarStage(status: LearningStatus): StarStage | null {
  switch (status) {
    case 'planned':
      return null
    case 'in_progress':
      return 'current_orbit'
    case 'completed':
      return 'completed'
  }
}

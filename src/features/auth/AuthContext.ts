import { createContext, useContext } from 'react'

export interface AuthState {
  mode: 'local' | 'supabase'
  email?: string
  signOut?: () => void
}

export const AuthContext = createContext<AuthState>({ mode: 'local' })

export function useAuthState() {
  return useContext(AuthContext)
}

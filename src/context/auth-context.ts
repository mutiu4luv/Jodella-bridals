import { createContext } from 'react'
import type { SessionUser, UserRole } from '../types'

export type AuthContextValue = {
  user: SessionUser | null
  token: string | null
  isReady: boolean
  signIn: (payload: { token: string; user: SessionUser }) => void
  signOut: () => void
  refreshSession: () => Promise<void>
  hasRole: (role: UserRole) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext } from './auth-context'
import { api } from '../lib/api'
import type { SessionUser } from '../types'

const USER_STORAGE_KEY = 'jordela:user'
const TOKEN_STORAGE_KEY = 'jordela:token'

function readStoredSession() {
  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY)
  const userJson = window.localStorage.getItem(USER_STORAGE_KEY)

  if (!token || !userJson) {
    return { token: null, user: null }
  }

  try {
    return {
      token,
      user: JSON.parse(userJson) as SessionUser,
    }
  } catch {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    window.localStorage.removeItem(USER_STORAGE_KEY)
    return { token: null, user: null }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const storedSession = readStoredSession()
  const [user, setUser] = useState<SessionUser | null>(storedSession.user)
  const [token, setToken] = useState<string | null>(storedSession.token)
  const isReady = true

  useEffect(() => {
    if (!token) {
      return
    }

    void api.auth
      .me(token)
      .then((response) => {
        setUser(response.user)
        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user))
      })
      .catch(() => {
        setToken(null)
        setUser(null)
        window.localStorage.removeItem(TOKEN_STORAGE_KEY)
        window.localStorage.removeItem(USER_STORAGE_KEY)
      })
  }, [token])

  const signIn = useCallback((payload: { token: string; user: SessionUser }) => {
    setToken(payload.token)
    setUser(payload.user)
    window.localStorage.setItem(TOKEN_STORAGE_KEY, payload.token)
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(payload.user))
  }, [])

  const signOut = useCallback(() => {
    setToken(null)
    setUser(null)
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    window.localStorage.removeItem(USER_STORAGE_KEY)
  }, [])

  const refreshSession = useCallback(async () => {
    if (!token) {
      return
    }

    const response = await api.auth.me(token)
    setUser(response.user)
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user))
  }, [token])

  const value = useMemo(
    () => ({
      user,
      token,
      isReady,
      signIn,
      signOut,
      refreshSession,
      hasRole: (role: SessionUser['role']) => user?.role === role,
    }),
    [isReady, refreshSession, signIn, signOut, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import type { UserRole } from '../types'
import type { ReactElement } from 'react'

export default function ProtectedRoute({
  children,
  roles,
}: {
  children: ReactElement
  roles?: UserRole[]
}) {
  const { user, isReady } = useAuth()

  if (!isReady) {
    return <div className="min-h-screen bg-[#fff7fb]" />
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

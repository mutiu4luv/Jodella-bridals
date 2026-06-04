import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/useAuth'
import AuthPage from './pages/AuthPage'
import AdminDashboard from './pages/AdminDashboard'
import UserFormPage from './pages/UserFormPage'

export default function App() {
  const { isReady } = useAuth()

  if (!isReady) {
    return <div className="min-h-screen bg-[#fff7fb]" />
  }

  return (
    <Routes>
      <Route path="/" element={<UserFormPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/app" element={<Navigate to="/" replace />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

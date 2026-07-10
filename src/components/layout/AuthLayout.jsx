import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AuthLayout() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) {
    return <Navigate to={`/${user.role}`} replace />
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-primary-dark)]/10 flex items-center justify-center p-4">
      <Outlet />
    </div>
  )
}

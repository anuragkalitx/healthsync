import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute() {
  const { isAuthenticated, profileComplete } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!profileComplete) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
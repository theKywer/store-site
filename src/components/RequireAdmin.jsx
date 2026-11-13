import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/auth.js'

/** Допускает в административный раздел только вошедших пользователей с ролью ADMIN. */
function RequireAdmin({ children }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  return children
}

export default RequireAdmin

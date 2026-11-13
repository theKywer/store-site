import { useEffect, useState } from 'react'
import { AuthContext } from './auth.js'
const TOKEN_KEY = 'lunaMarketToken'
const USER_KEY = 'lunaMarketUser'

function readStoredAuth() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null')

    if (
      typeof token === 'string' &&
      token &&
      user &&
      typeof user === 'object' &&
      user.id !== undefined &&
      typeof user.email === 'string' &&
      ['USER', 'ADMIN'].includes(user.role)
    ) {
      return { token, user }
    }
  } catch {
    // При недоступном или повреждённом localStorage пользователь считается гостем.
  }

  return { token: null, user: null }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth)

  // Синхронизирует авторизацию между вкладками, если её изменили в другой вкладке.
  useEffect(() => {
    function handleStorageChange(event) {
      if (event.key === TOKEN_KEY || event.key === USER_KEY || event.key === null) {
        setAuth(readStoredAuth())
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  function login(token, user) {
    if (!token || !user) {
      throw new Error('Сервер не вернул данные для входа')
    }

    try {
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      throw new Error('Не удалось сохранить авторизацию в браузере')
    }

    setAuth({ token, user })
  }

  function logout() {
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    } finally {
      setAuth({ token: null, user: null })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        token: auth.token,
        user: auth.user,
        isAuthenticated: Boolean(auth.token && auth.user),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}


import { createContext, useContext, useEffect, useState } from 'react'

const AUTH_STORAGE_KEY = 'admin-fe:isAuthed'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAuthed, setIsAuthed] = useState(
    () => sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true',
  )

  useEffect(() => {
    if (isAuthed) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, 'true')
    } else {
      sessionStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }, [isAuthed])

  function login() {
    setIsAuthed(true)
  }

  function logout() {
    setIsAuthed(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthed, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서 사용해야 합니다')
  }
  return context
}

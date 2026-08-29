import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiPost } from '../api/client'
import { useAuth } from '../auth/AuthContext'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await apiPost('/api/auth/login', { password })
      login()
      navigate('/')
    } catch {
      setError('비밀번호가 올바르지 않습니다')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>딜레마 만들기 어드민</h1>
      <label htmlFor="password">비밀번호</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={submitting}>
        로그인
      </button>
    </form>
  )
}

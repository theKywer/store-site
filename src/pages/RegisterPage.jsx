import { useState } from 'react'
import { Link } from 'react-router-dom'
import './AuthPage.css'

/** Страница регистрации с проверкой email, длины и совпадения паролей. */
function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password || !passwordConfirmation) {
      setError('Заполни все поля.')
      return
    }

    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов.')
      return
    }

    if (password !== passwordConfirmation) {
      setError('Пароли не совпадают.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Не удалось зарегистрироваться.')
      }

      setIsRegistered(true)
    } catch (requestError) {
      setError(requestError.message || 'Не удалось связаться с сервером.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isRegistered) {
    return (
      <section className="auth-page">
        <div className="auth-card auth-success">
          <span className="section-label">АККАУНТ СОЗДАН</span>
          <h1>Регистрация прошла успешно</h1>
          <p className="auth-description">Теперь можно войти с новым аккаунтом.</p>
          <Link to="/login" className="primary-button">Перейти ко входу</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <span className="section-label">ПРИСОЕДИНЯЙСЯ К LUNA MARKET</span>
        <h1>Создать аккаунт</h1>
        <p className="auth-description">Укажи email и придумай пароль длиной от 8 символов.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="register-password">Пароль</label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <label htmlFor="register-password-confirmation">Повтори пароль</label>
          <input
            id="register-password-confirmation"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            required
          />

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="auth-switch">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </section>
  )
}

export default RegisterPage

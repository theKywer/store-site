import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import './AuthPage.css'
import { apiFetch } from '../api'

/** Страница регистрации с проверкой email, длины и совпадения паролей. */
function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!name.trim() || !email.trim() || !password || !passwordConfirmation) {
      setError('Заполни все поля.')
      return
    }

    if (name.trim().length > 40) {
      setError('Имя должно содержать не более 40 символов.')
      return
    }

    if (!/^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s.'’-]{0,39}$/u.test(name.trim())) {
      setError('Имя может содержать буквы, цифры, пробелы, дефис, точку и апостроф.')
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
      const response = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (data.code === 'EMAIL_NOT_VERIFIED') {
          navigate('/verify-email', {
            state: { email: data.email || email.trim(), message: data.message },
          })
          return
        }

        if (data.code === 'EMAIL_SEND_FAILED') {
          navigate('/verify-email', {
            state: {
              email: data.email || email.trim(),
              error: data.message,
              resendAfterSeconds: data.resendAfterSeconds || 60,
            },
          })
          return
        }

        throw new Error(data.message || 'Не удалось зарегистрироваться.')
      }

      navigate('/verify-email', {
        state: {
          email: data.email || email.trim(),
          message: data.message || 'Код подтверждения отправлен на почту.',
          resendAfterSeconds: data.resendAfterSeconds || 60,
        },
      })
    } catch (requestError) {
      setError(requestError.message || 'Не удалось связаться с сервером.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <span className="section-label">ПРИСОЕДИНЯЙСЯ К LUNA MARKET</span>
        <h1>Создать аккаунт</h1>
        <p className="auth-description">Укажи имя и email, затем придумай пароль длиной от 8 символов.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="register-name">Имя</label>
          <input
            id="register-name"
            type="text"
            autoComplete="name"
            maxLength={40}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />

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

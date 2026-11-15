import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'
import './AuthPage.css'
import './VerifyEmailPage.css'

async function readResponse(response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.message || 'Не удалось выполнить запрос')
    error.code = data.code
    error.retryAfterSeconds = data.retryAfterSeconds
    throw error
  }
  return data
}

function VerifyEmailPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState(location.state?.email || '')
  const [code, setCode] = useState('')
  const [error, setError] = useState(location.state?.error || '')
  const [notice, setNotice] = useState(location.state?.message || '')
  const [resendSeconds, setResendSeconds] = useState(location.state?.resendAfterSeconds || 0)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const isCountingDown = resendSeconds > 0

  useEffect(() => {
    if (!isCountingDown) return undefined
    const timer = window.setInterval(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [isCountingDown])

  async function handleVerify(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setIsVerifying(true)
    try {
      const response = await apiFetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code }),
      })
      const data = await readResponse(response)
      navigate('/login', {
        replace: true,
        state: { message: data.message || 'Почта подтверждена. Теперь войдите в аккаунт.' },
      })
    } catch (requestError) {
      setError(requestError.message || 'Не удалось подтвердить почту.')
    } finally {
      setIsVerifying(false)
    }
  }

  async function handleResend() {
    setError('')
    setNotice('')
    setIsResending(true)
    try {
      const response = await apiFetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await readResponse(response)
      setResendSeconds(data.resendAfterSeconds || 60)
      setNotice(data.message)
    } catch (requestError) {
      if (requestError.retryAfterSeconds) {
        setResendSeconds(requestError.retryAfterSeconds)
      }
      setError(requestError.message || 'Не удалось отправить код. Попробуйте позже.')
    } finally {
      setIsResending(false)
    }
  }

  function handleCodeChange(event) {
    setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
  }

  function handleCodePaste(event) {
    const pastedCode = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pastedCode) return
    event.preventDefault()
    setCode(pastedCode)
  }

  const canResend = Boolean(email.trim()) && resendSeconds === 0 && !isResending

  return (
    <section className="auth-page verify-email-page">
      <div className="auth-card verify-email-card">
        <span className="section-label">ПОСЛЕДНИЙ ШАГ</span>
        <div className="verify-email-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /><path d="m16 3 1.5 1.5L20 2" /></svg>
        </div>
        <h1>Подтверждение почты</h1>
        <p className="auth-description">
          Мы отправили шестизначный код на указанный email. Введите его, чтобы подтвердить аккаунт.
        </p>

        {notice && <p className="auth-success-message" role="status">{notice}</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}

        <form className="auth-form verify-email-form" onSubmit={handleVerify}>
          <label htmlFor="verification-email">Email для подтверждения</label>
          <input
            id="verification-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />

          <label htmlFor="verification-code">Код из письма</label>
          <input
            id="verification-code"
            className="verification-code-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={handleCodeChange}
            onPaste={handleCodePaste}
            placeholder="000000"
            aria-describedby="verification-code-hint"
            required
          />
          <span id="verification-code-hint" className="verification-code-hint">
            Код действует 10 минут. Проверьте папку «Спам», если письма нет во входящих.
          </span>

          <button type="submit" className="primary-button" disabled={isVerifying || code.length !== 6 || !email.trim()}>
            {isVerifying ? <><span className="ui-spinner" aria-hidden="true" /> Проверяем…</> : 'Подтвердить'}
          </button>
        </form>

        <div className="verify-resend-row">
          {resendSeconds > 0 ? (
            <span>Отправить код повторно можно через {resendSeconds} сек.</span>
          ) : (
            <span>Не получили письмо?</span>
          )}
          <button type="button" onClick={handleResend} disabled={!canResend}>
            {isResending ? 'Отправляем…' : 'Отправить код повторно'}
          </button>
        </div>

        <p className="auth-switch"><Link to="/login">Вернуться ко входу</Link></p>
      </div>
    </section>
  )
}

export default VerifyEmailPage

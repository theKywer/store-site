
import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../api'

const botUsername = (
  import.meta.env.VITE_TELEGRAM_BOT_USERNAME || ''
).replace(/^@/, '').trim()

export default function TelegramLinkPanel({ token }) {
  const [linked, setLinked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const checkStatus = useCallback(async () => {
    setLoading(true)

    try {
      const response = await apiFetch('/api/telegram/status', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error('Не удалось проверить Telegram')

      const data = await response.json()
      setLinked(data.linked)
      if (data.linked) setLinkUrl('')
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  async function createLink() {
    setWorking(true)
    setError('')
    setNotice('')

    try {
      if (!botUsername) {
        throw new Error('Username Telegram-бота не настроен')
      }

      const response = await apiFetch('/api/telegram/link-token', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Не удалось создать ссылку')
      }

      setLinkUrl(
        `https://t.me/${botUsername}?start=link_${data.token}`
      )
      setNotice('Ссылка действует 10 минут. Не передавайте её другим.')
    } catch (err) {
      setError(err.message)
    } finally {
      setWorking(false)
    }
  }

  async function unlink() {
    if (!window.confirm('Отключить Telegram от аккаунта?')) return

    setWorking(true)
    setError('')

    try {
      const response = await apiFetch('/api/telegram/link', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error('Не удалось отключить Telegram')

      setLinked(false)
      setLinkUrl('')
      setNotice('Telegram отключён.')
    } catch (err) {
      setError(err.message)
    } finally {
      setWorking(false)
    }
  }

  return (
    <section className="profile-card" style={{ marginTop: 24 }}>
      <div className="profile-card-heading">
        <div>
          <span className="profile-eyebrow">TELEGRAM</span>
          <h2>Подключение Telegram</h2>
        </div>
      </div>

      <p>
        Привяжите Telegram, чтобы в будущем получать
        уведомления и просматривать заказы через бота.
      </p>

      {error && <p className="profile-feedback is-error" role="alert">{error}</p>}
      {notice && <p className="profile-feedback is-success" role="status">{notice}</p>}

      {loading ? (
        <p>Проверяем подключение…</p>
      ) : linked ? (
        <div className="profile-actions">
          <p>✅ Telegram подключён</p>
          <button
            type="button"
            className="profile-button profile-button-secondary"
            disabled={working}
            onClick={unlink}
          >
            Отключить Telegram
          </button>
        </div>
      ) : (
        <div className="profile-actions">
          <button
            type="button"
            className="profile-button profile-button-primary"
            disabled={working}
            onClick={createLink}
          >
            {working ? 'Создаём ссылку…' : 'Подключить Telegram'}
          </button>

          {linkUrl && (
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="profile-button profile-button-secondary"
            >
              Открыть Telegram-бота
            </a>
          )}

          <button
            type="button"
            className="profile-button profile-button-secondary"
            disabled={working}
            onClick={checkStatus}
          >
            Проверить привязку
          </button>
        </div>
      )}
    </section>
  )
}

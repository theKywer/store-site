import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'
import { useAuth } from '../context/auth.js'
import './ProfilePage.css'
import TelegramLinkPanel from '../components/TelegramLinkPanel'

const MAX_AVATAR_SIZE = 2 * 1024 * 1024
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const VALID_NAME = /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s.'’-]{0,39}$/u

async function readResponse(response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Не удалось выполнить запрос')
  return data
}

function ProfilePage() {
  const { token, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [draftName, setDraftName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingName, setIsSavingName] = useState(false)
  const [isSavingAvatar, setIsSavingAvatar] = useState(false)
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadProfile() {
      setIsLoading(true)
      setError('')
      try {
        const response = await apiFetch('/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        const data = await readResponse(response)
        setProfile(data)
        setDraftName(data.name || data.email.split('@')[0])
        setIsEditingName(false)
        updateUser({ name: data.name, avatar: data.avatar })
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError.message || 'Не удалось загрузить профиль')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadProfile()
    return () => controller.abort()
  }, [token, updateUser])

  useEffect(() => () => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const displayName = profile?.name?.trim() || profile?.email?.split('@')[0] || 'Пользователь'
  const avatarSource = previewUrl || profile?.avatar
  const registrationDate = profile?.createdAt
    ? new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long' }).format(new Date(profile.createdAt))
    : '—'

  function handleAvatarSelection(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setError('')
    setNotice('')
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setError('Подойдут только изображения JPEG, PNG или WebP.')
      return
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setError('Файл слишком большой. Максимальный размер — 2 МБ.')
      return
    }

    setSelectedAvatar(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleNameSave(event) {
    event.preventDefault()
    const name = draftName.trim()
    if (name && !VALID_NAME.test(name)) {
      setError('Имя: от 1 до 40 символов — буквы, цифры, пробелы, дефис, точка или апостроф.')
      return
    }

    setIsSavingName(true)
    setError('')
    setNotice('')
    try {
      const response = await apiFetch('/api/profile', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })
      const data = await readResponse(response)
      setProfile(data)
      setDraftName(data.name || data.email.split('@')[0])
      setIsEditingName(false)
      updateUser({ name: data.name, avatar: data.avatar })
      setNotice('Имя профиля сохранено.')
    } catch (requestError) {
      setError(requestError.message || 'Не удалось сохранить имя')
    } finally {
      setIsSavingName(false)
    }
  }

  async function handleAvatarSave() {
    if (!selectedAvatar) return
    setIsSavingAvatar(true)
    setError('')
    setNotice('')
    try {
      const response = await apiFetch('/api/profile/avatar', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': selectedAvatar.type,
        },
        body: selectedAvatar,
      })
      const data = await readResponse(response)
      setProfile(data)
      updateUser({ name: data.name, avatar: data.avatar })
      setSelectedAvatar(null)
      setPreviewUrl(null)
      setNotice('Аватар сохранён.')
    } catch (requestError) {
      setError(requestError.message || 'Не удалось сохранить аватар')
    } finally {
      setIsSavingAvatar(false)
    }
  }

  async function handleAvatarRemove() {
    setIsRemovingAvatar(true)
    setError('')
    setNotice('')
    try {
      const response = await apiFetch('/api/profile/avatar', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await readResponse(response)
      setProfile(data)
      updateUser({ name: data.name, avatar: data.avatar })
      setSelectedAvatar(null)
      setPreviewUrl(null)
      setNotice('Аватар удалён. Показана стандартная заглушка.')
    } catch (requestError) {
      setError(requestError.message || 'Не удалось удалить аватар')
    } finally {
      setIsRemovingAvatar(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  if (isLoading) {
    return <section className="profile-page"><p className="profile-state"><span className="ui-spinner" aria-hidden="true" />Загружаем профиль…</p></section>
  }

  if (!profile) {
    return (
      <section className="profile-page">
        <div className="profile-state" role="alert">
          <p>{error || 'Не удалось загрузить профиль.'}</p>
          <button type="button" className="profile-button profile-button-secondary" onClick={() => window.location.reload()}>
            Попробовать снова
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="profile-page">
      <div className="profile-heading">
        <span className="section-label">ТВОЙ АККАУНТ LUNA MARKET</span>
        <h1>Профиль игрока</h1>
        <p>Настрой свой профиль и возвращайся к любимым мирам.</p>
      </div>

      {(error || notice) && (
        <p className={`profile-feedback${error ? ' is-error' : ' is-success'}`} role={error ? 'alert' : 'status'}>
          {error || notice}
        </p>
      )}

      <div className="profile-layout">
        <section className="profile-card profile-avatar-card">
          <div className="profile-avatar-wrap">
            {avatarSource ? (
              <img className="profile-avatar" src={avatarSource} alt={`Аватар: ${displayName}`} />
            ) : (
              <div className="profile-avatar profile-avatar-placeholder" aria-label={`Аватар пользователя ${displayName}`}>
                {displayName.charAt(0).toLocaleUpperCase('ru-RU')}
              </div>
            )}
            <label className="profile-avatar-camera" title="Изменить аватар" aria-disabled={isSavingAvatar || isRemovingAvatar}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarSelection}
                disabled={isSavingAvatar || isRemovingAvatar}
              />
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h3l1.5-2h7L17 7h3v12H4V7Z" /><circle cx="12" cy="13" r="3.5" /></svg>
              <span className="profile-sr-only">Изменить фотографию профиля</span>
            </label>
            <span className="profile-avatar-status" aria-hidden="true" />
          </div>
          <h2>{displayName}</h2>
          <p>Участник Luna Market</p>

          <span className="profile-help">Нажми на камеру, чтобы {profile.avatar || previewUrl ? 'заменить' : 'загрузить'} фото</span>
          <span className="profile-help">JPEG, PNG или WebP · до 2 МБ</span>

          {selectedAvatar && (
            <div className="profile-avatar-actions">
              <button type="button" className="profile-button profile-button-primary" onClick={handleAvatarSave} disabled={isSavingAvatar || isRemovingAvatar}>
                {isSavingAvatar ? <><span className="ui-spinner" aria-hidden="true" /> Сохраняем…</> : 'Сохранить фото'}
              </button>
              <button type="button" className="profile-text-button" onClick={() => { setSelectedAvatar(null); setPreviewUrl(null) }} disabled={isSavingAvatar}>
                Отменить
              </button>
            </div>
          )}
          {!selectedAvatar && profile.avatar && (
            <button type="button" className="profile-text-button profile-remove-avatar" onClick={handleAvatarRemove} disabled={isRemovingAvatar}>
              {isRemovingAvatar ? <><span className="ui-spinner" aria-hidden="true" /> Удаляем…</> : 'Удалить фото'}
            </button>
          )}
        </section>

        <section className="profile-card profile-details-card">
          <div className="profile-card-heading">
            <div>
              <span className="profile-eyebrow">PERSONAL DATA</span>
              <h2>Данные аккаунта</h2>
            </div>
            <span className="profile-role">{profile.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}</span>
          </div>

          <form className="profile-form" onSubmit={handleNameSave}>
            <label htmlFor="profile-name">Имя пользователя</label>
            {isEditingName ? (
              <>
                <div className="profile-name-row">
                  <input
                    id="profile-name"
                    type="text"
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    maxLength={40}
                    autoComplete="name"
                    aria-describedby="profile-name-help"
                    autoFocus
                  />
                  <button type="submit" className="profile-button profile-button-primary" disabled={isSavingName}>
                    {isSavingName ? <><span className="ui-spinner" aria-hidden="true" /> Сохраняем…</> : 'Сохранить'}
                  </button>
                  <button
                    type="button"
                    className="profile-button profile-button-secondary"
                    onClick={() => {
                      setDraftName(profile.name || profile.email.split('@')[0])
                      setIsEditingName(false)
                      setError('')
                    }}
                    disabled={isSavingName}
                  >
                    Отмена
                  </button>
                </div>
                <span id="profile-name-help" className="profile-help">Оставь поле пустым, чтобы снова показывалась часть email.</span>
              </>
            ) : (
              <div className="profile-name-display">
                <strong>{displayName}</strong>
                <button type="button" className="profile-edit-button" onClick={() => setIsEditingName(true)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5 5 5M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z" /></svg>
                  Изменить
                </button>
              </div>
            )}
          </form>

          <div className="profile-data-grid">
            <div className="profile-data-item">
              <span>Email</span>
              <strong>{profile.email}</strong>
              <small>Email нельзя изменить из профиля</small>
            </div>
            <div className="profile-data-item">
              <span>В Luna Market с</span>
              <strong>{registrationDate}</strong>
              <small>Дата регистрации аккаунта</small>
            </div>
          </div>

          <div className="profile-actions">
            <Link to="/orders/my" className="profile-button profile-button-orders">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v17l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L5 21V4Z" /><path d="M9 9h6M9 13h6" /></svg>
              Мои заказы
            </Link>
            <button type="button" className="profile-button profile-button-logout" onClick={handleLogout}>
              Выйти из аккаунта
            </button>
          </div>
        </section>
      </div>
      <TelegramLinkPanel token={token} />
    </section>
  )
}

export default ProfilePage

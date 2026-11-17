
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth.js'
import { apiFetch } from '../api'

/** Шапка сайта с навигацией и текущими счётчиками корзины и избранного. */
function Header({ cartCount, favoriteCount }) {
  const { isAuthenticated, user, token, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const infoMenuRef = useRef(null)
  const infoButtonRef = useRef(null)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const isInformationPage = ['/about', '/support', '/legal', '/orders/my'].includes(location.pathname)

  useEffect(() => {
    if (!isAuthenticated || !token) {
      updateUser({ avatar: null })
      return undefined
    }

    const controller = new AbortController()
    apiFetch('/api/profile', {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'Не удалось загрузить профиль')
        updateUser({ name: data.name, avatar: data.avatar })
      })
      .catch(() => {})

    return () => controller.abort()
  }, [isAuthenticated, token, updateUser])

  useEffect(() => {
    if (!isInfoOpen) return undefined

    function handlePointerDown(event) {
      if (!infoMenuRef.current?.contains(event.target)) setIsInfoOpen(false)
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsInfoOpen(false)
        infoButtonRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isInfoOpen])

  /** При повторном нажатии на логотип плавно прокручивает страницу вверх. */
  function handleLogoClick() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  function handleInformationMenuKeyDown(event) {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    const menuItems = infoMenuRef.current?.querySelectorAll('[role="menuitem"]')
    if (!menuItems?.length) return

    event.preventDefault()
    const currentIndex = Array.from(menuItems).indexOf(document.activeElement)
    if (event.key === 'Home') return menuItems[0].focus()
    if (event.key === 'End') return menuItems[menuItems.length - 1].focus()

    const nextIndex = currentIndex < 0
      ? (event.key === 'ArrowDown' ? 0 : menuItems.length - 1)
      : event.key === 'ArrowDown'
        ? (currentIndex + 1) % menuItems.length
        : (currentIndex - 1 + menuItems.length) % menuItems.length
    menuItems[nextIndex].focus()
  }

  return (
    <header className="header">
      <Link
        to="/"
        className="logo"
        onClick={handleLogoClick}
      >
        <span className="logo-icon">
          <span className="logo-icon-letter">L</span>
        </span>
        <span className="logo-wordmark">
          LUNA MARKET
          <span className="logo-pumpkin" aria-hidden="true">🎃</span>
        </span>
      </Link>

      <nav className="navigation" aria-label="Основная навигация">
        <div className={`information-menu${isInfoOpen ? ' is-open' : ''}`} ref={infoMenuRef}>
          <button
            ref={infoButtonRef}
            type="button"
            className={`information-trigger${isInformationPage ? ' is-current' : ''}`}
            aria-expanded={isInfoOpen}
            aria-controls="header-information-links"
            aria-haspopup="true"
            onClick={() => setIsInfoOpen((open) => !open)}
          >
            Информация
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
          </button>
          <div
            className="information-dropdown"
            id="header-information-links"
            role="menu"
            onKeyDown={handleInformationMenuKeyDown}
          >
            <Link
              role="menuitem"
              to="/#catalog"
              aria-current={location.pathname === '/' && location.hash === '#catalog' ? 'page' : undefined}
              onClick={() => setIsInfoOpen(false)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12l2 4v12H4V8l2-4Z" /><path d="M4 9h16M9 13h6" /></svg>
              Каталог
            </Link>
            <Link role="menuitem" to="/about" aria-current={location.pathname === '/about' ? 'page' : undefined} onClick={() => setIsInfoOpen(false)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></svg>
              О нас
            </Link>
            <Link role="menuitem" to="/support" aria-current={location.pathname === '/support' ? 'page' : undefined} onClick={() => setIsInfoOpen(false)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v12H9l-5 4V5Z" /><path d="M8 10h8m-8 4h5" /></svg>
              Техподдержка
            </Link>
            {isAuthenticated && (
              <Link role="menuitem" to="/orders/my" aria-current={location.pathname === '/orders/my' ? 'page' : undefined} onClick={() => setIsInfoOpen(false)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v15H4zM8 9h8m-8 4h8m-8 4h5" /></svg>
                Мои заказы
              </Link>
            )}
            <Link role="menuitem" to="/legal" aria-current={location.pathname === '/legal' ? 'page' : undefined} onClick={() => setIsInfoOpen(false)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l4 4v14H6V3Z" /><path d="M14 3v5h5M9 13h7m-7 4h7" /></svg>
              Правовая информация
            </Link>
          </div>
        </div>
        {isAuthenticated && user.role === 'ADMIN' && (
          <Link to="/admin" aria-current={location.pathname === '/admin' ? 'page' : undefined}>
            Админ-панель
          </Link>
        )}
      </nav>

      <div className="header-actions">
        <div className="store-action-buttons">
          <Link to="/favorites" className="favorites-button">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
            </svg>
            <span>Избранное ({favoriteCount})</span>
          </Link>
          <Link to="/cart" className="cart-button">
            Корзина ({cartCount})
          </Link>
        </div>

        <div className="account-actions">
          {isAuthenticated ? (
            <>
              <span className="account-user">
                <Link
                  to="/profile"
                  className="header-profile-link"
                  aria-current={location.pathname === '/profile' ? 'page' : undefined}
                  aria-label={`Профиль: ${user.name?.trim() || user.email.split('@')[0]}`}
                >
                  <span className="header-avatar-thumb">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" />
                    ) : (
                      (user.name?.trim() || user.email.split('@')[0]).charAt(0).toLocaleUpperCase('ru-RU')
                    )}
                  </span>
                  <span className="account-email" title={user.email}>
                    {user.name?.trim() || user.email.split('@')[0]}
                  </span>
                </Link>
                {user.role === 'ADMIN' && (
                  <span className="account-role">ADMIN</span>
                )}
              </span>
              <button
                type="button"
                className="header-auth-button"
                onClick={handleLogout}
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="header-auth-button">Войти</Link>
              <Link
                to="/register"
                className="header-auth-button header-register-button"
              >
                Регистрация
              </Link>
            </>
          )}

          {!isAuthenticated && <button
            type="button"
            className="account-icon-button"
            disabled
            aria-label="Аккаунт пользователя — скоро"
            title="Страница аккаунта скоро появится"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 21a8 8 0 0 0-16 0" />
              <circle cx="12" cy="8" r="4" />
            </svg>
          </button>}
        </div>
      </div>
    </header>
  )
}

export default Header


import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth.js'

/** Шапка сайта с навигацией и текущими счётчиками корзины и избранного. */
function Header({ cartCount, favoriteCount }) {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

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

  return (
    <header className="header">
      <Link
        to="/"
        className="logo"
        onClick={handleLogoClick}
      >
        <span className="logo-icon">L</span>
        <span>LUNA MARKET</span>
      </Link>

      <nav className="navigation">
        <Link to="/#discounts">Скидки</Link>
        <Link to="/about">О нас</Link>
        {isAuthenticated && <Link to="/orders/my">Мои заказы</Link>}
        {isAuthenticated && user.role === 'ADMIN' && (
          <Link to="/admin">Админ-панель</Link>
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
                <span className="account-email" title={user.email}>
                  {user.email}
                </span>
                <span className="account-role">{user.role}</span>
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

          <button
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
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header

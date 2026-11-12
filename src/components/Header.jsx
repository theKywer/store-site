
import { Link } from 'react-router-dom'

function Header({ cartCount, favoriteCount }) {
  function handleLogoClick() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
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
        <Link to="/favorites" className="favorites-nav-link">
          <span aria-hidden="true">♡</span> Избранное ({favoriteCount})
        </Link>
        <Link to="/about">О нас</Link>
      </nav>

      <Link to="/cart" className="cart-button">
        Корзина ({cartCount})
      </Link>
    </header>
  )
}

export default Header

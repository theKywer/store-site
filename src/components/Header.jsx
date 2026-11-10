
function Header({ cartCount }) {
  return (
    <header className="header">
      <a href="/" className="logo">
        <span className="logo-icon">L</span>
        <span>LUNA MARKET</span>
      </a>

      <nav className="navigation">
        <a href="#catalog">Каталог</a>
        <a href="#discounts">Скидки</a>
        <a href="#about">О нас</a>
      </nav>

      <button className="cart-button" type="button">
        <span>Корзина ({cartCount})</span>
      </button>
    </header>
  )
}

export default Header

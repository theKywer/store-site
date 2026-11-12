import { Link } from 'react-router-dom'
import './CartPage.css'

function getItemCountLabel(count) {
  const lastTwoDigits = count % 100
  const lastDigit = count % 10

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'товаров'
  if (lastDigit === 1) return 'товар'
  if (lastDigit >= 2 && lastDigit <= 4) return 'товара'
  return 'товаров'
}

function CartPage({
  cartItems,
  onIncrease,
  onDecrease,
  onRemove,
}) {
  const totalPrice = cartItems.reduce(
    (total, item) => total + item.game.price * item.quantity,
    0
  )

  const totalOldPrice = cartItems.reduce(
    (total, item) => {
      const game = item.game
      const hasDiscount =
        game.discount > 0 && game.oldPrice > game.price

      return total + (hasDiscount ? game.oldPrice : game.price) * item.quantity
    },
    0
  )

  const totalSavings = totalOldPrice - totalPrice
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0)

  if (cartItems.length === 0) {
    return (
      <section className="cart-section">
        <div className="cart-heading">
          <div>
            <span className="section-label">ВАШ ЗАКАЗ</span>
            <h1>Корзина</h1>
          </div>
          <span className="cart-count">0 товаров</span>
        </div>

        <div className="empty-cart">
          <h2>Корзина пока пуста</h2>
          <p>Самое время найти что-нибудь интересное!</p>

          <Link to="/#catalog" className="primary-button">
            Перейти в каталог
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="cart-section">
      <div className="cart-heading">
        <div>
          <span className="section-label">ВАШ ЗАКАЗ</span>
          <h1>Корзина</h1>
        </div>
        <span className="cart-count">
          {itemCount} {getItemCountLabel(itemCount)}
        </span>
      </div>

      <div className="cart-content">
        <div className="cart-items">
          {cartItems.map((item) => {
            const game = item.game

            const hasDiscount =
              game.discount > 0 &&
              game.oldPrice > game.price

            return (
              <article className="cart-item" key={game.id}>
                <div className="cart-item-image">
                  <img src={game.image} alt={game.title} />

                  {hasDiscount && (
                    <span className="cart-item-discount">
                      -{game.discount}%
                    </span>
                  )}
                </div>

                <div className="cart-item-info">
                  <Link to={`/game/${game.id}`}>
                    <h3>{game.title}</h3>
                  </Link>

                  <span>{game.genre}</span>

                  <div className="cart-item-prices">
                    {hasDiscount && (
                      <span className="cart-item-old-price">
                        {game.oldPrice.toLocaleString('ru-RU')} ₸
                      </span>
                    )}

                    <strong>
                      {game.price.toLocaleString('ru-RU')} ₸
                    </strong>
                  </div>

                  {hasDiscount && (
                    <span className="cart-item-savings">
                      Экономия: {((game.oldPrice - game.price) * item.quantity).toLocaleString('ru-RU')} ₸
                    </span>
                  )}
                </div>

                <div className="cart-item-actions">
                  <div className="cart-quantity">
                    <button
                      type="button"
                      onClick={() => onDecrease(game.id)}
                      aria-label={`Уменьшить количество: ${game.title}`}
                    >
                      −
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      type="button"
                      onClick={() => onIncrease(game.id)}
                      aria-label={`Увеличить количество: ${game.title}`}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    className="cart-remove"
                    onClick={() => onRemove(game.id)}
                    aria-label={`Удалить ${game.title} из корзины`}
                  >
                    Удалить
                  </button>
                </div>
              </article>
            )
          })}
        </div>

        <aside className="cart-summary">
          <h2>Итого</h2>

          {totalSavings > 0 && (
            <div className="cart-total-old">
              <span>Без скидок</span>
              <span>
                {totalOldPrice.toLocaleString('ru-RU')} ₸
              </span>
            </div>
          )}

          <div className="cart-total">
            <span>К оплате</span>

            <strong>
              {totalPrice.toLocaleString('ru-RU')} ₸
            </strong>
          </div>

          {totalSavings > 0 && (
            <div className="cart-total-savings">
              <span>Твоя экономия</span>

              <strong>
                {totalSavings.toLocaleString('ru-RU')} ₸
              </strong>
            </div>
          )}

          <button type="button" className="checkout-button">
            Перейти к оформлению
          </button>
        </aside>
      </div>
    </section>
  )
}

export default CartPage

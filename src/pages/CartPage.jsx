
function CartPage({
  cartItems,
  onIncrease,
  onDecrease,
  onRemove,
}) {
  const totalPrice = cartItems.reduce((total, item) => {
    return total + item.game.price * item.quantity
  }, 0)

  return (
    <section className="cart-section">
      <span className="section-label">ТВОИ ПОКУПКИ</span>

      <h1>Корзина</h1>

      {cartItems.length === 0 ? (
        <p>Корзина пока пуста.</p>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map((item) => (
              <div
                className="cart-item"
                key={item.game.id}
              >
                <div className="cart-item-info">
                  <img
                    src={item.game.image}
                    alt={item.game.title}
                  />

                  <div>
                    <h3>{item.game.title}</h3>
                    <span>{item.game.genre}</span>
                  </div>
                </div>

                <div className="cart-item-actions">
                  <strong>
                    {(item.game.price * item.quantity).toLocaleString('ru-RU')} ₸
                  </strong>

                  <div className="quantity-controls">
                    <button
                      type="button"
                      onClick={() => onDecrease(item.game.id)}
                    >
                      −
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      type="button"
                      onClick={() => onIncrease(item.game.id)}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemove(item.game.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-total">
            <span>Итого:</span>

            <strong>
              {totalPrice.toLocaleString('ru-RU')} ₸
            </strong>
          </div>
        </>
      )}
    </section>
  )
}

export default CartPage

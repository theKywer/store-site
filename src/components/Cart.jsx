
function Cart({ cartItems, onRemoveFromCart }) {
  const totalPrice = cartItems.reduce((total, game) => {
    return total + game.price
  }, 0)

  return (
    <section className="cart-section" id="cart">
      <h2>Корзина</h2>

      {cartItems.length === 0 ? (
        <p>Корзина пока пуста.</p>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map((game, index) => (
              <div
                className="cart-item"
                key={`${game.id}-${index}`}
              >
                <span>{game.title}</span>

                <div className="cart-item-actions">
                  <strong>
                    {game.price.toLocaleString('ru-RU')} ₸
                  </strong>

                  <button
                    type="button"
                    onClick={() => onRemoveFromCart(index)}
                    aria-label={`Удалить ${game.title} из корзины`}
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

export default Cart

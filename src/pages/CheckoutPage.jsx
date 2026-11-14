import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/auth.js'
import './OrdersPage.css'

async function readResponse(response, fallback) {
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data.message || fallback)
    error.status = response.status
    throw error
  }

  return data
}

function CheckoutPage({ cartItems, onOrderPaid }) {
  const { token, isAuthenticated, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const resumeOrderId = searchParams.get('orderId')
  const [order, setOrder] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoadingOrder, setIsLoadingOrder] = useState(Boolean(resumeOrderId))
  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState('')
  const [copiedKey, setCopiedKey] = useState('')

  useEffect(() => {
    if (!resumeOrderId || !token) return undefined

    const controller = new AbortController()

    async function loadOrder() {
      setError('')

      try {
        const response = await fetch('/api/orders/my', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        const orders = await readResponse(response, 'Не удалось загрузить заказ')
        const foundOrder = orders.find((item) => item.id === Number(resumeOrderId))

        if (!foundOrder) {
          throw new Error('Заказ не найден в вашей истории.')
        }

        setOrder(foundOrder)
      } catch (requestError) {
        if (requestError.name === 'AbortError') return

        if (requestError.status === 401) {
          logout()
          navigate('/login', {
            replace: true,
            state: { message: 'Сеанс истёк. Войдите снова.', from: location },
          })
          return
        }

        setError(requestError.message)
      } finally {
        if (!controller.signal.aborted) setIsLoadingOrder(false)
      }
    }

    loadOrder()
    return () => controller.abort()
  }, [resumeOrderId, token, logout, navigate, location])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  async function createOrder() {
    setIsCreating(true)
    setError('')

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cartItems.map(({ game, quantity }) => ({
            gameId: game.id,
            quantity,
          })),
        }),
      })
      const data = await readResponse(response, 'Не удалось создать заказ')
      setOrder(data.order)
    } catch (requestError) {
      if (requestError.status === 401) {
        logout()
        navigate('/login', {
          replace: true,
          state: { message: 'Сеанс истёк. Войдите снова.', from: location },
        })
      } else {
        setError(requestError.message)
      }
    } finally {
      setIsCreating(false)
    }
  }

  async function payOrder() {
    if (!order) return

    setIsPaying(true)
    setError('')

    try {
      const response = await fetch(`/api/orders/${order.id}/pay`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await readResponse(response, 'Не удалось выполнить оплату')
      setOrder(data.order)
      onOrderPaid()
    } catch (requestError) {
      if (requestError.status === 401) {
        logout()
        navigate('/login', {
          replace: true,
          state: { message: 'Сеанс истёк. Войдите снова.', from: location },
        })
      } else {
        setError(requestError.message)
      }
    } finally {
      setIsPaying(false)
    }
  }

  async function copyKey(code) {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedKey(code)
      window.setTimeout(() => setCopiedKey(''), 1800)
    } catch {
      setError('Не удалось скопировать ключ. Вы можете выделить его вручную.')
    }
  }

  const isPaid = order?.status === 'PAID'

  return (
    <section className="orders-page">
      <header className="orders-heading">
        <span className="section-label">LUNA MARKET · ПОКУПКА</span>
        <h1>{isPaid ? 'Покупка завершена' : order ? 'Демо-оплата' : 'Оформление заказа'}</h1>
        <p>Оплата демонстрационная: реальные деньги не списываются.</p>
      </header>

      {isLoadingOrder ? (
        <div className="orders-state">Загружаем заказ…</div>
      ) : error && !order ? (
        <div className="orders-state is-error" role="alert">
          <p>{error}</p>
          <Link className="order-secondary-button" to="/orders/my">К истории заказов</Link>
        </div>
      ) : !order && cartItems.length === 0 ? (
        <div className="orders-state">
          <h2>Корзина пуста</h2>
          <p>Добавьте игру в корзину, чтобы оформить покупку.</p>
          <Link className="order-primary-button" to="/#catalog">Перейти в каталог</Link>
        </div>
      ) : (
        <div className="checkout-layout">
          <section className="orders-panel">
            <h2>{isPaid ? 'Приобретённые игры' : order ? `Заказ №${order.id}` : 'Состав заказа'}</h2>
            <div className="order-lines">
              {(order?.items ?? cartItems.map(({ game, quantity }) => ({
                gameTitle: game.title,
                quantity,
                unitPrice: game.price,
              }))).map((item, index) => (
                <article className="order-line" key={`${item.gameTitle}-${index}`}>
                  <div>
                    <strong>{item.gameTitle}</strong>
                    <span>{item.quantity} шт. × {item.unitPrice.toLocaleString('ru-RU')} ₸</span>
                  </div>
                  <b>{(item.quantity * item.unitPrice).toLocaleString('ru-RU')} ₸</b>
                </article>
              ))}
            </div>

            {isPaid && (
              <>
                <div className="demo-notice" role="status">
                  Это демонстрационные ключи Luna Market. Они не являются ключами Steam или других платформ.
                </div>
                {order.items.map((item) => (
                  <div className="issued-keys" key={item.id}>
                    <h3>{item.gameTitle}</h3>
                    {item.keys.map((key) => (
                      <div className="issued-key" key={key.id}>
                        <code>{key.code}</code>
                        <button type="button" onClick={() => copyKey(key.code)}>
                          {copiedKey === key.code ? 'Скопировано' : 'Копировать'}
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}
          </section>

          <aside className="orders-panel checkout-total">
            <span>{isPaid ? 'Оплачено демо-режимом' : 'Итого по заказу'}</span>
            <strong>{(order?.totalAmount ?? cartItems.reduce((sum, item) => sum + item.game.price * item.quantity, 0)).toLocaleString('ru-RU')} ₸</strong>
            {!order && <small>Предварительная сумма. Итоговые цены рассчитает сервер при создании заказа.</small>}
            {error && <p className="orders-error" role="alert">{error}</p>}

            {isPaid ? (
              <Link className="order-primary-button" to="/orders/my">Перейти к моим заказам</Link>
            ) : order ? (
              <button className="order-primary-button" type="button" onClick={payOrder} disabled={isPaying}>
                {isPaying ? 'Проводим демо-оплату…' : 'Оплатить'}
              </button>
            ) : (
              <button className="order-primary-button" type="button" onClick={createOrder} disabled={isCreating || cartItems.length === 0}>
                {isCreating ? 'Создаём заказ…' : 'Продолжить к оплате'}
              </button>
            )}
            {!isPaid && <Link className="order-back-link" to="/cart">Вернуться в корзину</Link>}
          </aside>
        </div>
      )}
    </section>
  )
}

export default CheckoutPage

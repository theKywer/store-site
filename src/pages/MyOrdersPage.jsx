import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth.js'
import './OrdersPage.css'

const statusLabels = {
  PENDING: 'Ожидает оплаты',
  PAID: 'Оплачен',
  CANCELLED: 'Отменён',
}

function MyOrdersPage() {
  const { token, isAuthenticated, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedKey, setCopiedKey] = useState('')

  useEffect(() => {
    if (!token) return undefined

    const controller = new AbortController()

    async function loadOrders() {
      try {
        const response = await fetch('/api/orders/my', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          const requestError = new Error(data.message || 'Не удалось загрузить заказы')
          requestError.status = response.status
          throw requestError
        }

        setOrders(data)
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
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadOrders()
    return () => controller.abort()
  }, [token, logout, navigate, location])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
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

  return (
    <section className="orders-page">
      <header className="orders-heading">
        <span className="section-label">ВАШ АККАУНТ · ИСТОРИЯ ПОКУПОК</span>
        <h1>Мои заказы</h1>
        <p>Ваши покупки и выданные демонстрационные ключи.</p>
      </header>

      {isLoading && <div className="orders-state">Загружаем историю заказов…</div>}
      {error && <div className="orders-state is-error" role="alert">{error}</div>}

      {!isLoading && !error && orders.length === 0 && (
        <div className="orders-state">
          <h2>Пока нет заказов</h2>
          <p>Оформленные покупки появятся здесь.</p>
          <Link className="order-primary-button" to="/#catalog">Открыть каталог</Link>
        </div>
      )}

      <div className="orders-list">
        {orders.map((order) => (
          <article className="order-card" key={order.id}>
            <header className="order-card-heading">
              <div>
                <span>ЗАКАЗ №{order.id}</span>
                <h2>{new Date(order.createdAt).toLocaleString('ru-RU', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}</h2>
              </div>
              <span className={`order-status status-${order.status.toLowerCase()}`}>
                {statusLabels[order.status] || order.status}
              </span>
            </header>

            <div className="order-card-items">
              {order.items.map((item) => (
                <section className="order-history-item" key={item.id}>
                  <div className="order-history-line">
                    <strong>{item.gameTitle}</strong>
                    <span>{item.quantity} шт. · {item.unitPrice.toLocaleString('ru-RU')} ₸ за копию</span>
                  </div>
                  {item.keys.length > 0 && (
                    <div className="history-keys">
                      {item.keys.map((key) => (
                        <div className="issued-key" key={key.id}>
                          <code>{key.code}</code>
                          <button type="button" onClick={() => copyKey(key.code)}>
                            {copiedKey === key.code ? 'Скопировано' : 'Копировать'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>

            <footer className="order-card-footer">
              <span>Итого</span>
              <strong>{order.totalAmount.toLocaleString('ru-RU')} ₸</strong>
              {order.status === 'PENDING' && (
                <Link className="order-primary-button" to={`/checkout?orderId=${order.id}`}>
                  Продолжить оплату
                </Link>
              )}
            </footer>
            {order.status === 'PAID' && (
              <p className="demo-notice">Ключи демонстрационные и не являются ключами Steam или других платформ.</p>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

export default MyOrdersPage

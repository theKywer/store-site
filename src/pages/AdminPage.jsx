
import { useEffect, useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth.js'
import './AdminPage.css'

const emptyGameForm = {
  title: '',
  price: '',
  oldPrice: '',
  discount: '0',
  badge: '',
  genre: '',
  description: '',
  image: '',
  officialTrailerId: '',
  developer: '',
  publisher: '',
  releaseDate: '',
  ageRating: '',
  platform: '',
  gallery: [],
}

function AdminDisclosure({ title, eyebrow, meta, className = '', children }) {
  const [isOpen, setIsOpen] = useState(false)
  const contentId = useId()

  return (
    <section className={`admin-disclosure ${className}${isOpen ? ' is-open' : ''}`}>
      <button
        className="admin-disclosure-toggle"
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="admin-disclosure-heading">
          {eyebrow && <span className="section-label">{eyebrow}</span>}
          <span className="admin-disclosure-title">{title}</span>
        </span>
        {meta && <span className="admin-disclosure-meta">{meta}</span>}
        <span className="admin-disclosure-chevron" aria-hidden="true" />
      </button>
      <div
        className="admin-disclosure-content"
        id={contentId}
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="admin-disclosure-inner">
          <fieldset className="admin-disclosure-fieldset" disabled={!isOpen}>
            {children}
          </fieldset>
        </div>
      </div>
    </section>
  )
}

async function readAdminResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(
      data.message ||
      (response.status === 401
        ? 'Сеанс истёк. Войди в аккаунт ещё раз.'
        : response.status === 403
          ? 'Недостаточно прав для управления каталогом.'
          : fallbackMessage),
    )

    error.status = response.status
    throw error
  }

  return data
}

function prepareGameData(form) {
  return {
    title: form.title.trim(),
    price: Number(form.price),
    oldPrice: form.oldPrice === '' ? null : Number(form.oldPrice),
    discount: form.discount === '' ? 0 : Number(form.discount),
    badge: form.badge.trim() || null,
    genre: form.genre.trim(),
    description: form.description.trim(),
    image: form.image.trim(),
    officialTrailerId: form.officialTrailerId.trim(),
    developer: form.developer.trim(),
    publisher: form.publisher.trim(),
    releaseDate: form.releaseDate.trim(),
    ageRating: form.ageRating.trim(),
    platform: form.platform.trim(),
    gallery: form.gallery.map((media, index) => ({
      type: media.type,
      src: media.src.trim(),
      thumbnail: media.thumbnail.trim() || null,
      alt: media.alt.trim() || null,
      sortOrder: index,
    })),
  }
}

function AdminPage({ games, isLoading, error, setGames, onGameDeleted }) {
  const { token, logout } = useAuth()
  const navigate = useNavigate()

  const [gameForm, setGameForm] = useState(emptyGameForm)
  const [isAdding, setIsAdding] = useState(false)
  const [addGameError, setAddGameError] = useState(null)

  const [editingGameId, setEditingGameId] = useState(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editGameError, setEditGameError] = useState(null)

  const [deletingGameId, setDeletingGameId] = useState(null)
  const [deleteGameError, setDeleteGameError] = useState(null)

  const [orders, setOrders] = useState([])
  const [areOrdersLoading, setAreOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState(null)
  const [cancellingOrderId, setCancellingOrderId] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadOrders() {
      try {
        const response = await fetch('/api/admin/orders', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        const data = await readAdminResponse(response, 'Не удалось загрузить заказы')
        setOrders(data)
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          if (requestError.status === 401) {
            logout()
            navigate('/login', {
              replace: true,
              state: { message: requestError.message },
            })
          } else {
            setOrdersError(requestError.message)
          }
        }
      } finally {
        if (!controller.signal.aborted) setAreOrdersLoading(false)
      }
    }

    loadOrders()
    return () => controller.abort()
  }, [token, logout, navigate])

  function handleRequestError(requestError, setError) {
    if (requestError.status === 401) {
      logout()

      navigate('/login', {
        replace: true,
        state: { message: requestError.message },
      })

      return
    }

    setError(requestError.message)
  }

  function updateForm(field, value) {
    setGameForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateGalleryItem(index, field, value) {
    setGameForm((current) => ({
      ...current,
      gallery: current.gallery.map((media, mediaIndex) =>
        mediaIndex === index
          ? { ...media, [field]: value }
          : media,
      ),
    }))
  }

  function addGalleryItem() {
    setGameForm((current) => ({
      ...current,
      gallery: [
        ...current.gallery,
        {
          type: 'image',
          src: '',
          thumbnail: '',
          alt: '',
        },
      ],
    }))
  }

  function removeGalleryItem(index) {
    setGameForm((current) => ({
      ...current,
      gallery: current.gallery.filter(
        (_, mediaIndex) => mediaIndex !== index,
      ),
    }))
  }

  function resetForm() {
    setGameForm(emptyGameForm)
  }

  // Добавление игры
  async function addGame(event) {
    event.preventDefault()

    setIsAdding(true)
    setAddGameError(null)

    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(prepareGameData(gameForm)),
      })

      const data = await readAdminResponse(
        response,
        'Не удалось добавить игру',
      )

      setGames((currentGames) => [...currentGames, data])
      resetForm()
    } catch (requestError) {
      handleRequestError(requestError, setAddGameError)
    } finally {
      setIsAdding(false)
    }
  }

  // Начало редактирования
  function startEditing(game) {
    setEditingGameId(game.id)

    setGameForm({
      title: game.title ?? '',
      price: String(game.price ?? ''),
      oldPrice: game.oldPrice == null ? '' : String(game.oldPrice),
      discount: String(game.discount ?? 0),
      badge: game.badge ?? '',
      genre: game.genre ?? '',
      description: game.description ?? '',
      image: game.image ?? '',
      officialTrailerId: game.officialTrailerId ?? '',
      developer: game.developer ?? '',
      publisher: game.publisher ?? '',
      releaseDate: game.releaseDate ?? '',
      ageRating: game.ageRating ?? '',
      platform: game.platform ?? '',
      gallery: (game.gallery ?? [])
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((media) => ({
          type: media.type,
          src: media.src,
          thumbnail: media.thumbnail ?? '',
          alt: media.alt ?? '',
        })),
    })

    setEditGameError(null)
    setAddGameError(null)
  }

  // Отмена редактирования
  function cancelEditing() {
    setEditingGameId(null)
    resetForm()
    setEditGameError(null)
  }

  // Сохранение изменений
  async function saveGame(event) {
    event.preventDefault()

    setIsSavingEdit(true)
    setEditGameError(null)

    try {
      const response = await fetch(`/api/games/${editingGameId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(prepareGameData(gameForm)),
      })

      const updatedGame = await readAdminResponse(
        response,
        'Не удалось изменить игру',
      )

      setGames((currentGames) =>
        currentGames.map((game) =>
          game.id === updatedGame.id
            ? updatedGame
            : game,
        ),
      )

      cancelEditing()
    } catch (requestError) {
      handleRequestError(requestError, setEditGameError)
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Удаление игры
  async function deleteGame(gameId) {
    const confirmed = window.confirm(
      'Ты действительно хочешь удалить эту игру?',
    )

    if (!confirmed) return

    setDeletingGameId(gameId)
    setDeleteGameError(null)

    try {
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      await readAdminResponse(response, 'Не удалось удалить игру')

      setGames((currentGames) =>
        currentGames.filter((game) => game.id !== gameId),
      )

      onGameDeleted(gameId)
    } catch (requestError) {
      handleRequestError(requestError, setDeleteGameError)
    } finally {
      setDeletingGameId(null)
    }
  }

  async function cancelOrder(orderId) {
    if (!window.confirm(`Отменить заказ №${orderId}?`)) return

    setCancellingOrderId(orderId)
    setOrdersError(null)

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await readAdminResponse(response, 'Не удалось отменить заказ')
      setOrders((currentOrders) =>
        currentOrders.map((order) => order.id === data.order.id ? data.order : order),
      )
    } catch (requestError) {
      handleRequestError(requestError, setOrdersError)
    } finally {
      setCancellingOrderId(null)
    }
  }

  // Общая форма для добавления и редактирования
  function renderGameForm(onSubmit, submitLabel, isSubmitting, formError) {
    return (
      <form className="admin-game-form" onSubmit={onSubmit}>
        <AdminDisclosure className="admin-form-section" title="Основная информация">
          <div className="admin-form-fields">

        <div>
          <label htmlFor="admin-title">Название игры</label>
          <input
            id="admin-title"
            type="text"
            value={gameForm.title}
            onChange={(event) => updateForm('title', event.target.value)}
            placeholder="Например, Elden Ring"
            required
          />
        </div>

        <div>
          <label htmlFor="admin-genre">Жанр</label>
          <input
            id="admin-genre"
            type="text"
            value={gameForm.genre}
            onChange={(event) => updateForm('genre', event.target.value)}
            placeholder="Action RPG"
            required
          />
        </div>

        <div>
          <label htmlFor="admin-description">Описание</label>
          <textarea
            id="admin-description"
            value={gameForm.description}
            onChange={(event) => updateForm('description', event.target.value)}
            placeholder="Описание игры..."
            rows="5"
            required
          />
        </div>

          </div>
        </AdminDisclosure>

        <AdminDisclosure className="admin-form-section" title="Цены и скидки">
          <div className="admin-form-fields">

        <div>
          <label htmlFor="admin-price">Текущая цена (₸)</label>
          <input
            id="admin-price"
            type="number"
            value={gameForm.price}
            onChange={(event) => updateForm('price', event.target.value)}
            min="0"
            step="1"
            required
          />
        </div>

        <div>
          <label htmlFor="admin-old-price">Старая цена (₸)</label>
          <input
            id="admin-old-price"
            type="number"
            value={gameForm.oldPrice}
            onChange={(event) => updateForm('oldPrice', event.target.value)}
            min="0"
            step="1"
          />
        </div>

        <div>
          <label htmlFor="admin-discount">Скидка (%)</label>
          <input
            id="admin-discount"
            type="number"
            value={gameForm.discount}
            onChange={(event) => updateForm('discount', event.target.value)}
            min="0"
            max="100"
            step="1"
          />
        </div>

        <div>
          <label htmlFor="admin-badge">Значок</label>
          <input
            id="admin-badge"
            type="text"
            value={gameForm.badge}
            onChange={(event) => updateForm('badge', event.target.value)}
            placeholder="Например, Хит продаж"
          />
        </div>

          </div>
        </AdminDisclosure>

        <AdminDisclosure className="admin-form-section" title="Информация об игре">
          <div className="admin-form-fields">

        <div>
          <label htmlFor="admin-developer">Разработчик</label>
          <input
            id="admin-developer"
            type="text"
            value={gameForm.developer}
            onChange={(event) => updateForm('developer', event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="admin-publisher">Издатель</label>
          <input
            id="admin-publisher"
            type="text"
            value={gameForm.publisher}
            onChange={(event) => updateForm('publisher', event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="admin-release-date">Дата выхода</label>
          <input
            id="admin-release-date"
            type="text"
            value={gameForm.releaseDate}
            onChange={(event) => updateForm('releaseDate', event.target.value)}
            placeholder="Например, 21 ноября 2026"
            required
          />
        </div>

        <div>
          <label htmlFor="admin-age-rating">Возрастной рейтинг</label>
          <input
            id="admin-age-rating"
            type="text"
            value={gameForm.ageRating}
            onChange={(event) => updateForm('ageRating', event.target.value)}
            placeholder="18+"
            required
          />
        </div>

        <div>
          <label htmlFor="admin-platform">Платформа</label>
          <input
            id="admin-platform"
            type="text"
            value={gameForm.platform}
            onChange={(event) => updateForm('platform', event.target.value)}
            placeholder="PC"
            required
          />
        </div>

          </div>
        </AdminDisclosure>

        <AdminDisclosure className="admin-form-section" title="Изображения и трейлер">
          <div className="admin-form-fields">

        <div>
          <label htmlFor="admin-image">Обложка (путь или URL)</label>
          <input
            id="admin-image"
            type="text"
            value={gameForm.image}
            onChange={(event) => updateForm('image', event.target.value)}
            placeholder="/images/game.jpg"
            required
          />
        </div>

        <div>
          <label htmlFor="admin-trailer">ID официального трейлера</label>
          <input
            id="admin-trailer"
            type="text"
            value={gameForm.officialTrailerId}
            onChange={(event) => updateForm('officialTrailerId', event.target.value)}
            placeholder="YouTube ID"
          />
        </div>

          </div>
        </AdminDisclosure>

        <AdminDisclosure className="admin-form-section" title="Галерея">
          <div className="admin-form-fields admin-gallery-fields">

        {gameForm.gallery.map((media, index) => (
          <AdminDisclosure
            className="admin-gallery-disclosure"
            key={index}
            title={`Элемент галереи ${index + 1}`}
          >
            <fieldset className="admin-gallery-item">

            <div>
              <label htmlFor={`gallery-type-${index}`}>Тип</label>
              <select
                id={`gallery-type-${index}`}
                value={media.type}
                onChange={(event) =>
                  updateGalleryItem(index, 'type', event.target.value)
                }
              >
                <option value="image">Изображение</option>
                <option value="video">Видео</option>
              </select>
            </div>

            <div>
              <label htmlFor={`gallery-src-${index}`}>
                Источник (URL изображения или ID/ссылка видео)
              </label>
              <input
                id={`gallery-src-${index}`}
                type="text"
                value={media.src}
                onChange={(event) =>
                  updateGalleryItem(index, 'src', event.target.value)
                }
                required
              />
            </div>

            <div>
              <label htmlFor={`gallery-thumbnail-${index}`}>
                Миниатюра (необязательно)
              </label>
              <input
                id={`gallery-thumbnail-${index}`}
                type="text"
                value={media.thumbnail}
                onChange={(event) =>
                  updateGalleryItem(index, 'thumbnail', event.target.value)
                }
              />
            </div>

            <div>
              <label htmlFor={`gallery-alt-${index}`}>
                Описание изображения (alt)
              </label>
              <input
                id={`gallery-alt-${index}`}
                type="text"
                value={media.alt}
                onChange={(event) =>
                  updateGalleryItem(index, 'alt', event.target.value)
                }
              />
            </div>

            <button
              type="button"
              onClick={() => removeGalleryItem(index)}
            >
              Удалить элемент галереи
            </button>
            </fieldset>
          </AdminDisclosure>
        ))}

        <button type="button" onClick={addGalleryItem}>
          Добавить элемент галереи
        </button>
          </div>
        </AdminDisclosure>

        {formError && <p className="admin-feedback is-error">Ошибка: {formError}</p>}

        <div className="admin-game-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Сохранение...' : submitLabel}
          </button>

          {editingGameId !== null && (
            <button
              type="button"
              onClick={cancelEditing}
              disabled={isSubmitting}
            >
              Отмена
            </button>
          )}
        </div>
      </form>
    )
  }

  return (
    <section className="admin-page">
      <header className="admin-page-heading">
        <span className="section-label">LUNA MARKET · ПАНЕЛЬ УПРАВЛЕНИЯ</span>
        <h1>Управление магазином</h1>
        <p>Каталог, цены и материалы игр в одном месте.</p>
      </header>

      {editingGameId === null && (
        <AdminDisclosure
          className="admin-add-game admin-panel"
          title="Добавить игру"
          meta="Новая карточка каталога"
        >
          {renderGameForm(
            addGame,
            'Добавить игру',
            isAdding,
            addGameError,
          )}
        </AdminDisclosure>
      )}

      <AdminDisclosure
        className="admin-game-list admin-panel"
        title={`Каталог игр (${games.length})`}
        meta="Редактирование и удаление"
      >

        {isLoading && <p className="admin-feedback is-loading">Загрузка игр...</p>}
        {error && <p className="admin-feedback is-error">Ошибка загрузки: {error}</p>}
        {deleteGameError && <p className="admin-feedback is-error">Ошибка удаления: {deleteGameError}</p>}

        {!isLoading && !error && games.length === 0 && (
          <p className="admin-feedback">Игры не найдены.</p>
        )}

        {!isLoading &&
          !error &&
          games.map((game) => (
            <AdminDisclosure
              className="admin-game-item"
              key={game.id}
              title={editingGameId === game.id ? `Редактирование: ${game.title}` : game.title}
              meta={`${game.price.toLocaleString('ru-RU')} ₸ · ${game.genre}`}
            >
              {editingGameId === game.id ? (
                <div>
                  {renderGameForm(
                    saveGame,
                    'Сохранить изменения',
                    isSavingEdit,
                    editGameError,
                  )}
                </div>
              ) : (
                <div className="admin-game-item-content">
                  <div className="admin-game-copy">
                    <p>{game.price.toLocaleString('ru-RU')} ₸</p>

                    {game.oldPrice != null && (
                      <p>
                        Старая цена: {game.oldPrice.toLocaleString('ru-RU')} ₸
                      </p>
                    )}

                    {game.discount > 0 && (
                      <p>Скидка: {game.discount}%</p>
                    )}

                    <p>Жанр: {game.genre}</p>
                    <p>Разработчик: {game.developer}</p>
                  </div>

                  <div className="admin-game-actions">
                    <button
                      type="button"
                      onClick={() => startEditing(game)}
                      disabled={deletingGameId !== null || isSavingEdit}
                    >
                      Редактировать
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteGame(game.id)}
                      disabled={deletingGameId !== null || isSavingEdit}
                    >
                      {deletingGameId === game.id
                        ? 'Удаление...'
                        : 'Удалить'}
                    </button>
                  </div>
                </div>
              )}
            </AdminDisclosure>
          ))}
      </AdminDisclosure>

      <AdminDisclosure
        className="admin-orders admin-panel"
        eyebrow="ПОКУПКИ КЛИЕНТОВ"
        title={`Заказы (${orders.length})`}
        meta="Состав и статусы заказов"
      >

        {areOrdersLoading && <p className="admin-feedback is-loading">Загрузка заказов...</p>}
        {ordersError && <p className="admin-feedback is-error">{ordersError}</p>}
        {!areOrdersLoading && !ordersError && orders.length === 0 && (
          <p className="admin-feedback">Заказов пока нет.</p>
        )}

        {!areOrdersLoading && orders.map((order) => (
          <AdminDisclosure
            className={`admin-order status-${order.status.toLowerCase()}`}
            key={order.id}
            title={`Заказ №${order.id}`}
            eyebrow={order.user.email}
            meta={`${new Date(order.createdAt).toLocaleString('ru-RU')} · ${order.totalAmount.toLocaleString('ru-RU')} ₸ · ${{ PENDING: 'Ожидает оплаты', PAID: 'Оплачен', CANCELLED: 'Отменён' }[order.status] || order.status}`}
          >
            <div className="admin-order-details">
              <p>Покупатель: <strong>{order.user.email}</strong> · ID {order.user.id}</p>
              <div className="admin-order-lines">
                {order.items.map((item) => (
                  <section className="admin-order-line" key={item.id}>
                    <div className="admin-order-item-heading">
                      <strong>{item.gameTitle}</strong>
                      <span>{item.quantity} коп. × {item.unitPrice.toLocaleString('ru-RU')} ₸</span>
                    </div>
                    {item.keys.length > 0 && (
                      <div className="admin-order-keys">
                        {item.keys.map((key) => <code key={key.id}>{key.code}</code>)}
                      </div>
                    )}
                  </section>
                ))}
              </div>
              {order.status === 'PENDING' && (
                <button
                  className="admin-order-cancel"
                  type="button"
                  onClick={() => cancelOrder(order.id)}
                  disabled={cancellingOrderId !== null}
                >
                  {cancellingOrderId === order.id ? 'Отменяем…' : 'Отменить заказ'}
                </button>
              )}
            </div>
          </AdminDisclosure>
        ))}
      </AdminDisclosure>
    </section>
  )
}

export default AdminPage

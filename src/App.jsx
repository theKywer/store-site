
import './App.css'

import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Header from './components/Header'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'

import Home from './pages/Home'
import CartPage from './pages/CartPage'
import AboutPage from './pages/AboutPage'
import SupportPage from './pages/SupportPage'
import LegalPage from './pages/LegalPage'
import GamePage from './pages/GamePage'
import FavoritesPage from './pages/FavoritesPage'
import NotFoundPage from './pages/NotFoundPage'
import ToastViewport from './components/ToastViewport'

import games from './data/game'

function App() {
  const [serverGames, setServerGames] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [gameTitle, setGameTitle] = useState('')
  const [gamePrice, setGamePrice] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [addGameError, setAddGameError] = useState(null)

  const [deletingGameId, setDeletingGameId] = useState(null)
  const [deleteGameError, setDeleteGameError] = useState(null)

  // Состояния редактирования игры
  const [editingGameId, setEditingGameId] = useState(null)
  const [editGameTitle, setEditGameTitle] = useState('')
  const [editGamePrice, setEditGamePrice] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editGameError, setEditGameError] = useState(null)

  const [toasts, setToasts] = useState([])

  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      const savedFavorites = JSON.parse(
        localStorage.getItem('favoriteGameIds') || '[]',
      )
      return Array.isArray(savedFavorites)
        ? [...new Set(savedFavorites.map(Number))].filter((id) =>
            games.some((game) => game.id === id),
          )
        : []
    } catch {
      return []
    }
  })

  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cartItems')

      if (!savedCart) return []

      const parsedCart = JSON.parse(savedCart)

      if (!Array.isArray(parsedCart)) return []

      return parsedCart.reduce((cart, item) => {
        if (!item || typeof item !== 'object') return cart

        const savedGame = item.game ?? item
        const gameId = Number(savedGame?.id)
        const game = games.find((entry) => entry.id === gameId)

        if (!game) return cart

        const savedQuantity = item.game ? Number(item.quantity) : 1
        const quantity = Number.isFinite(savedQuantity) && savedQuantity > 0
          ? Math.max(1, Math.floor(savedQuantity))
          : 1

        const existingItem = cart.find(
          (cartItem) => cartItem.game.id === game.id
        )

        if (existingItem) {
          existingItem.quantity += quantity
        } else {
          cart.push({ game, quantity })
        }

        return cart
      }, [])
    } catch {
      return []
    }
  })

  // Получение игр с сервера
  useEffect(() => {
    async function getGames() {
      try {
        const response = await fetch('http://localhost:3000/games')

        if (!response.ok) {
          throw new Error('Не удалось загрузить игры')
        }

        const data = await response.json()

        setServerGames(data)
      } catch (error) {
        setError(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    getGames()
  }, [])

  // Добавление игры на сервер
  async function addGameToServer(event) {
    event.preventDefault()

    setIsAdding(true)
    setAddGameError(null)

    try {
      const response = await fetch('http://localhost:3000/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: gameTitle.trim(),
          price: Number(gamePrice),
        }),
      })

      if (!response.ok) {
        throw new Error('Не удалось добавить игру')
      }

      const data = await response.json()

      setServerGames((currentGames) => [...currentGames, data])

      setGameTitle('')
      setGamePrice('')
    } catch (error) {
      setAddGameError(error.message)
    } finally {
      setIsAdding(false)
    }
  }

  // Удаление игры с сервера
  async function deleteGameFromServer(gameId) {
    setDeletingGameId(gameId)
    setDeleteGameError(null)

    try {
      const response = await fetch(
        `http://localhost:3000/games/${gameId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error('Не удалось удалить игру')
      }

      setServerGames((currentGames) =>
        currentGames.filter((game) => game.id !== gameId)
      )
    } catch (error) {
      setDeleteGameError(error.message)
    } finally {
      setDeletingGameId(null)
    }
  }

  // Начало редактирования игры
  function startEditingGame(game) {
    setEditingGameId(game.id)
    setEditGameTitle(game.title)
    setEditGamePrice(String(game.price))
    setEditGameError(null)
  }

  // Отмена редактирования
  function cancelEditingGame() {
    setEditingGameId(null)
    setEditGameTitle('')
    setEditGamePrice('')
    setEditGameError(null)
  }

  // Сохранение изменений игры
  async function saveGameChanges(event) {
    event.preventDefault()

    setIsSavingEdit(true)
    setEditGameError(null)

    try {
      const response = await fetch(
        `http://localhost:3000/games/${editingGameId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: editGameTitle.trim(),
            price: Number(editGamePrice),
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Не удалось сохранить изменения')
      }

      const updatedGame = await response.json()

      setServerGames((currentGames) =>
        currentGames.map((game) =>
          game.id === updatedGame.id ? updatedGame : game
        )
      )

      cancelEditingGame()
    } catch (error) {
      setEditGameError(error.message)
    } finally {
      setIsSavingEdit(false)
    }
  }

  useEffect(() => {
    try {
      localStorage.setItem('cartItems', JSON.stringify(cartItems))
    } catch {
      // The cart remains usable for this session if storage is unavailable.
    }
  }, [cartItems])

  useEffect(() => {
    try {
      localStorage.setItem('favoriteGameIds', JSON.stringify(favoriteIds))
    } catch {
      // Favorites remain usable for this session if storage is unavailable.
    }
  }, [favoriteIds])

  function notify(message, type = 'cart') {
    const id = `${Date.now()}-${Math.random()}`

    setToasts((currentToasts) => [
      ...currentToasts.slice(-3),
      { id, message, type, isLeaving: false },
    ])

    window.setTimeout(() => {
      setToasts((currentToasts) =>
        currentToasts.map((toast) =>
          toast.id === id ? { ...toast, isLeaving: true } : toast,
        ),
      )
    }, 2700)

    window.setTimeout(() => {
      setToasts((currentToasts) =>
        currentToasts.filter((toast) => toast.id !== id),
      )
    }, 3050)
  }

  function dismissToast(toastId) {
    setToasts((currentToasts) =>
      currentToasts.map((toast) =>
        toast.id === toastId ? { ...toast, isLeaving: true } : toast,
      ),
    )

    window.setTimeout(() => {
      setToasts((currentToasts) =>
        currentToasts.filter((toast) => toast.id !== toastId),
      )
    }, 350)
  }

  function toggleFavorite(gameId) {
    const willBeFavorite = !favoriteIds.includes(gameId)
    const gameTitle = games.find((game) => game.id === gameId)?.title

    setFavoriteIds((currentIds) =>
      currentIds.includes(gameId)
        ? currentIds.filter((id) => id !== gameId)
        : [...currentIds, gameId]
    )

    notify(
      willBeFavorite
        ? `«${gameTitle}» добавлена в избранное`
        : `«${gameTitle}» удалена из избранного`,
      'favorite',
    )
  }

  function addToCart(game) {
    const isAlreadyInCart = cartItems.some((item) => item.game.id === game.id)

    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.game.id === game.id
      )

      if (existingItem) {
        return currentItems.map((item) =>
          item.game.id === game.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [...currentItems, { game, quantity: 1 }]
    })

    notify(
      isAlreadyInCart
        ? `Количество игры «${game.title}» увеличено`
        : `«${game.title}» добавлена в корзину`,
      'cart',
    )
  }

  function increaseQuantity(gameId) {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.game.id === gameId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    )
  }

  function decreaseQuantity(gameId) {
    setCartItems((currentItems) =>
      currentItems
        .map((item) =>
          item.game.id === gameId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  function removeFromCart(gameId) {
    const removedGame = cartItems.find((item) => item.game.id === gameId)?.game

    setCartItems((currentItems) =>
      currentItems.filter((item) => item.game.id !== gameId)
    )

    if (removedGame) {
      notify(`«${removedGame.title}» удалена из корзины`, 'cart')
    }
  }

  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  )

  return (
    <BrowserRouter>
      <ScrollToTop />
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />

      <Header cartCount={cartCount} favoriteCount={favoriteIds.length} />

      <main>
        <div>
          <h2>Добавить игру на сервер</h2>

          <form onSubmit={addGameToServer}>
            <div>
              <label htmlFor="game-title">Название игры</label>
              <input
                id="game-title"
                type="text"
                value={gameTitle}
                onChange={(event) => setGameTitle(event.target.value)}
                placeholder="Например, Elden Ring"
                required
              />
            </div>

            <div>
              <label htmlFor="game-price">Цена игры</label>
              <input
                id="game-price"
                type="number"
                value={gamePrice}
                onChange={(event) => setGamePrice(event.target.value)}
                placeholder="24999"
                min="0"
                step="1"
                required
              />
            </div>

            <button type="submit" disabled={isAdding}>
              {isAdding ? 'Добавление...' : 'Добавить игру'}
            </button>
          </form>

          {addGameError && <p>Ошибка: {addGameError}</p>}

          <h2>Игры с сервера:</h2>

          {isLoading && <p>Загрузка игр...</p>}

          {error && <p>Ошибка: {error}</p>}

          {deleteGameError && (
            <p>Ошибка удаления: {deleteGameError}</p>
          )}

          {!isLoading && !error && serverGames.length === 0 && (
            <p>Игры не найдены</p>
          )}

          {!isLoading && !error && serverGames.map((game) => (
            <div key={game.id}>
              {editingGameId === game.id ? (
                <form onSubmit={saveGameChanges}>
                  <div>
                    <label htmlFor={`edit-title-${game.id}`}>
                      Название игры
                    </label>
                    <input
                      id={`edit-title-${game.id}`}
                      type="text"
                      value={editGameTitle}
                      onChange={(event) =>
                        setEditGameTitle(event.target.value)
                      }
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor={`edit-price-${game.id}`}>
                      Цена игры
                    </label>
                    <input
                      id={`edit-price-${game.id}`}
                      type="number"
                      value={editGamePrice}
                      onChange={(event) =>
                        setEditGamePrice(event.target.value)
                      }
                      min="0"
                      step="1"
                      required
                    />
                  </div>

                  <button type="submit" disabled={isSavingEdit}>
                    {isSavingEdit ? 'Сохранение...' : 'Сохранить'}
                  </button>

                  <button
                    type="button"
                    onClick={cancelEditingGame}
                    disabled={isSavingEdit}
                  >
                    Отмена
                  </button>

                  {editGameError && (
                    <p>Ошибка: {editGameError}</p>
                  )}
                </form>
              ) : (
                <>
                  <p>
                    {game.title} — {game.price} ₸
                  </p>

                  <button
                    type="button"
                    onClick={() => startEditingGame(game)}
                    disabled={deletingGameId !== null || isSavingEdit}
                  >
                    Редактировать
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteGameFromServer(game.id)}
                    disabled={deletingGameId !== null || isSavingEdit}
                  >
                    {deletingGameId === game.id ? 'Удаление...' : 'Удалить'}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        <Routes>
          <Route
            path="/"
            element={
              <Home
                games={games}
                onAddToCart={addToCart}
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
              />
            }
          />

          <Route
            path="/favorites"
            element={
              <FavoritesPage
                games={games}
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
                onAddToCart={addToCart}
              />
            }
          />

          <Route
            path="/cart"
            element={
              <CartPage
                cartItems={cartItems}
                onIncrease={increaseQuantity}
                onDecrease={decreaseQuantity}
                onRemove={removeFromCart}
              />
            }
          />

          <Route path="/about" element={<AboutPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/legal" element={<LegalPage />} />

          <Route
            path="/game/:id"
            element={
              <GamePage
                games={games}
                onAddToCart={addToCart}
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
              />
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </BrowserRouter>
  )
}

export default App
